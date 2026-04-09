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
    MAIN_URL
} = process.env;

const salt = parseInt(SALT_ROUNDS) || 10;

const URL_ORIGIN = new URL(MAIN_URL).origin;

function rngString(length){
    let str = "";
    for (let i = 0; i < length; i++) {
        str += Math.floor(Math.random() * 10)
    }
    return str;
}
function safeRedirect(nextURL, currentOrigin) {
    const fallback = ".";

    if (typeof nextURL !== "string") return fallback;

    let decodedNext;
    try { decodedNext = decodeURIComponent(nextURL); }
    catch { decodedNext = nextURL; }

    try {
        const url = new URL(decodedNext);
        if (url.origin === URL_ORIGIN) {
            if (url.origin === currentOrigin) return url.pathname + url.search;

            return url.href;
        }
    } catch {}

    if (decodedNext.startsWith("/")) return decodedNext;

    return fallback;
}

export const getProfile = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }
    if (!req.user){
        return res
            .status(401)
            .json({ error: "Sin autenticación." });
    }

    const { id } = req.user;
    const sql = `
        SELECT users.user_id AS id, users.user_name AS username, users.user_image AS image, tiers.tier_name AS tier, users.email AS email,
        CASE WHEN admins.admin_id IS NOT NULL THEN 1 ELSE 0 END AS isAdmin
        FROM users JOIN tiers ON users.tier_id = tiers.tier_id
        LEFT JOIN admins ON users.user_id = admins.user_id
        WHERE users.user_id = ? LIMIT 1
    `;
    db.query(sql, [id], (error, result) => {
        if (error){
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo los datos de usuario. Vuelva a intentarlo más tarde" });
        }
        if (result.length === 0){
            return res
                .status(404)
                .json({ error: "No se han encontrado datos de usuario." });
        }

        const user = result[0];
        const mappedResult = {
            ...user,
            image: `uploads/users/${user.image || 'u-default.png'}`
        }

        res.json(mappedResult);
    })
};

export const register = (req, res) => {
    if (!db) {
        return res
                .status(500)
                .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { email, password } = req.body;
    const checkUser = `
        SELECT COUNT(*) AS found FROM users WHERE email = ? LIMIT 1
    `;
    db.query(checkUser, [email], async (error, result) => {
        if (error){
            return res
                .status(500)
                .json({ error: "Hubo un problema verificando el usuario. Vuelva a intentarlo más tarde" });
        }
        if (result[0].found > 0){
            return res
                .status(409)
                .json({ user_exists: "El correo electrónico ya está en uso." });
        }

        const image = "u-default.png";
        const tier = 1;
        const username = `user${rngString(6)}`;
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = `
            INSERT INTO users (user_image, tier_id, user_name, email, password)
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [image, tier, username, email, hashedPassword];

        db.query(sql, params, (error, result) => {
            if (error){
                return res
                    .status(500)
                    .json({ error: "Hubo un problema al registrarse. Vuelva a intentarlo más tarde." });
            }
            const newUserId = result.insertId;
            const auth = "user";
            const cookieExpiration = new Date(Date.now() + parseInt(COOKIE_EXPIRATION) * 24 * 60 * 60 * 1000);

            const token = jwt.sign(
                { id: newUserId, username, auth },
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

            const { next } = req.body;
            const currentOrigin = `${req.protocol}://${req.get('host')}`;
            const redirectPath = safeRedirect(next, currentOrigin);

            return res
                .status(201)
                .json({
                    message: "Registro con éxito.",
                    token,
                    redirect: redirectPath
                });
        })
    })
}
export const login = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { email, password } = req.body;
    const findUser = `
        SELECT user_id AS id, user_name AS username, password AS password
        FROM users WHERE email = ?
    `;
    db.query(findUser, [email], async (error, result) => {
        if (error){
            return res
                .status(500)
                .json({ error: "Hubo un problema verificando el usuario. Vuelva a intentarlo más tarde." });
        }
        if (result.length === 0){
            return res
                .status(401)
                .json({ not_found: "Verifique que el correo y/o contraseña sean correctos." });
        }
        const user = result[0];

        const correctPassword = await bcrypt.compare(password, user.password);
        if (!correctPassword){
            return res
                .status(401)
                .json({ not_found: "Verifique que el correo y/o contraseña sean correctos." });
        }
        const checkAdmin = `
            SELECT role_name AS role FROM admins
            JOIN users ON admins.user_id = users.user_id
            JOIN roles ON admins.role_id = roles.role_id
            WHERE admins.user_id = ?
        `;
        db.query(checkAdmin, [user.id], (error, result) => {
            if (error){
                return res
                    .status(500)
                    .json({ error: "Hubo un problema verificando el administrador. Vuelva a intentarlo más tarde." });
            }
            const admin = result[0];
            const auth = result.length ? "admin" : "user";
            const tokenData = {
                id: user.id,
                username: user.username,
                auth
            };
            if (auth === "admin") tokenData.role = admin.role;

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

            const { next } = req.body;
            const currentOrigin = `${req.protocol}://${req.get('host')}`;
            const redirectPath = safeRedirect(next, currentOrigin);

            return res
                .status(201)
                .json({
                    message: "Inicio de sesión con éxito.",
                    token,
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

    res.json({ message: "Sesión cerrada con éxito." });
}
export const findUser = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { check } = req.query;
    const { email, username } = req.body;
    let sql = 'SELECT COUNT(*) AS found FROM users WHERE 1=1';
    const params = [];

    if (check == 'email' && email) {
        sql += ' AND email = ?';
        params.push(email);
    }
    if (check == 'username' && username) {
        sql += ' AND user_name = ?';
        params.push(username);
    }

    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema verificando el usuario. Vuelva a intentarlo más tarde" });
        }
        const found = result[0].found > 0;

        return res.json({ exists: found });
    })
}

export const updateAccount = async (req, res) => {
    if (!db) {
        return res
                .status(500)
                .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const image = req.file ? req.file.filename : null;
    const { username, password } = req.body;

    const fields = [];
    const params = [];

    if (image) {
        fields.push("user_image = ?");
        params.push(image);
    }
    if (username) {
        fields.push("user_name = ?");
        params.push(username);
    }
    if (password) {
        const hashedPassword = await bcrypt.hash(password, salt);
        fields.push("password = ?");
        params.push(hashedPassword);
    }

    if (fields.length === 0) {
        return res
            .status(400)
            .json({ error: "No se envió ningún dato ha actualizar." });
    }

    params.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema al actualizar sus datos. Vuelva a intentarlo más tarde." });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el usuario ha actualizar." });
        }

        res.status(201).json({ message: "Datos actualizados con éxito." })
    })
}