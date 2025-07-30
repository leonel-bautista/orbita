import { db } from "#config/db"
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const {
    JWT_SECRET,
    SALT_ROUNDS,
    TOKEN_EXPIRATION,
    COOKIE_EXPIRATION,
    HTTP_ONLY,
    COOKIE_DOMAIN,
    COOKIE_NAME,
    NODE_ENV,
    FRONT_URL,
    ADMIN_URL
} = process.env;

const salt = parseInt(SALT_ROUNDS) || 10;

function rngString(length){
    let str = "";
    for (let i = 0; i < length; i++){
        str += Math.floor(Math.random() * 10)
    }
    return str;
}
function safeRedirect(path){
    try{
        if (typeof path === 'string' && path.startsWith('/')) return path;
        const url = new URL(path);
        if (
            url.hostname === ADMIN_URL.replace(/^https?:\/\//, '').split(':')[0] ||
            url.hostname === FRONT_URL.replace(/^https?:\/\//, '').split(':')[0]
        ){
            return url.pathname + url.search;
        }
    } catch{}

    return '/';
}

// --- MÉTODO GET ---
export const findUserByEmail = (req, res) => {
    const { email } = req.body;
    const sql = `
        SELECT COUNT(*) as users_found FROM users WHERE email = ?
    `;
    db.query(sql, [email], (error ,result) => {
        if (error){
            return res
                .status(500)
                .json({ error: "(❌) ERROR: Vuelva a intentarlo más tarde" });
        }
        const found = result[0].users_found > 0;
        return res
            .json({ exists: found });
    })
}
export const getProfile = (req, res) => {
    const { id, username, auth } = req.user;
    const user = { id, username, auth };
    return res.json(user);
};

// --- MÉTODO POST ---
export const register = (req, res) => {
    const { email, password, next } = req.body;
    const checkUser = `
        SELECT COUNT(*) as found FROM users WHERE email = ? LIMIT 1
    `;
    db.query(checkUser, [email], async (error, result) => {
        if (error){
            return res
                .status(500)
                .json({ error: "(❌) ERROR: Vuelva a intentarlo más tarde" });
        }
        if (result[0].found > 0){
            return res
                .status(409)
                .json({ user_exists: "(❌) ERROR: El correo electrónico ya está en uso" });
        }

        const image = ""; // por defecto, el usuario no tendrá imágen (se le dará una predeterminada luego)
        const tier = 1; // nuevas cuentas inician con el tier base
        const name = `user${rngString(6)}`; // nuevas cuentas inician con un nombre aleatorio
        const alias = name; // el alias predeterminado será el nombre de usuario
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = `
            INSERT INTO users (user_image, tier_id, user_name, user_alias, email, password)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [image, tier, name, alias, email, hashedPassword];

        db.query(sql, params, (error, result) => {
            if (error){
                return res
                    .status(500)
                    .json({ error: "(❌) ERROR: Vuelva a intentarlo más tarde" });
            }
            const newUserID = result.insertId;
            const auth = "user";
            const cookieExpiration = new Date(Date.now() + parseInt(COOKIE_EXPIRATION) * 24 * 60 * 60 * 1000);

            const token = jwt.sign(
                {
                    id: newUserID,
                    username: name,
                    auth: auth
                },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRATION }
            );
            const cookieOptions = {
                httpOnly: HTTP_ONLY === 'true',
                secure: NODE_ENV === 'production',
                sameSite: NODE_ENV === 'production' ? "None" : "Lax",
                domain: COOKIE_DOMAIN,
                path: "/",
                expires: cookieExpiration,
            };
            res.cookie(COOKIE_NAME, token, cookieOptions);

            const redirectPath = safeRedirect(next);

            return res
                .status(201)
                .json({
                    message: "(✔) Registro con éxito!",
                    token: token,
                    redirect: redirectPath
                });
        })
    })
}
export const login = (req, res) => {
    const { email, password, next } = req.body;
    const findUser = `
        SELECT user_id, user_name, password FROM users WHERE email = ?
    `;
    db.query(findUser, [email], async (error, result) => {
        if (error){
            return res
                .status(500)
                .json({ error: "(❌) ERROR: Vuelva a intentarlo más tarde" });
        }
        if (result.length === 0){
            return res
                .status(401)
                .json({ not_found: "(❌) ERROR: Verifique que el correo y/o contraseña sean correctos." });
        }
        const u = result[0];

        const correctPassword = await bcrypt.compare(password, u.password);
        if (!correctPassword){
            return res
                .status(401)
                .json({ not_found: "(❌) ERROR: Verifique que el correo y/o contraseña sean correctos." });
        }
        const checkAdmin = `
            SELECT role_name FROM admins
            JOIN users ON admins.user_id = users.user_id
            JOIN roles ON admins.role_id = roles.role_id
            WHERE users.user_id = ?
        `;
        db.query(checkAdmin, [u.user_id], (error, result) => {
            if (error){
                return res
                    .status(500)
                    .json({ error: "(❌) ERROR: Vuelva a intentarlo más tarde" });
            }
            const auth = result.length ? "admin"
                                       : "user";
            const tokenData = {
                id: u.user_id,
                username: u.user_name,
                auth: auth
            };
            if (auth === "admin") tokenData.role = result[0].role_name;

            const cookieExpiration = new Date(Date.now() + parseInt(COOKIE_EXPIRATION) * 24 * 60 * 60 * 1000);

            const token = jwt.sign(
                tokenData,
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRATION }
            );
            const cookieOptions = {
                httpOnly: HTTP_ONLY === 'true',
                secure: NODE_ENV === 'production',
                sameSite: NODE_ENV === 'production' ? "None" : "Lax",
                domain: COOKIE_DOMAIN,
                path: "/",
                expires: cookieExpiration,
            };
            res.cookie(COOKIE_NAME, token, cookieOptions);

            let redirectPath = safeRedirect(next);
            let isAdminNext = false;

            if (next){
                try{
                    const url = new URL(next, ADMIN_URL);
                    isAdminNext = url.hostname === new URL(ADMIN_URL).hostname;
                } catch{}
            }

            if (auth === "admin" && isAdminNext && !redirectPath.startsWith('http')){
                redirectPath = `${ADMIN_URL}${redirectPath}`;
            }

            return res
                .status(201)
                .json({
                    message: "(✔) Inicio de sesión con éxito!",
                    token: token,
                    redirect: redirectPath
                });
        })
    })
}
export const logout = (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: HTTP_ONLY === 'true',
        secure: NODE_ENV === 'production',
        sameSite: NODE_ENV === 'production' ? "None" : "Lax",
        domain: COOKIE_DOMAIN,
        path: "/"
    });

    return res.json({ message: "(✔) Se ha cerrado la sesión con éxito!" });
}