import { db } from "#config/db";
import bcrypt from "bcryptjs";

const { SALT_ROUNDS } = process.env;
const salt = parseInt(SALT_ROUNDS) || 10;

function rngString(length){
    let str = "";
    for (let i = 0; i < length; i++){
        str += Math.floor(Math.random() * 10)
    }
    return str;
}

export const getEveryUser = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.query;
    const params = [];
    let sql = `
        SELECT users.user_id AS id,
               users.user_image AS image,
               tiers.tier_name AS tier,
               user_name AS username,
               users.email AS email
        FROM users
        LEFT JOIN tiers ON users.tier_id = tiers.tier_id
        WHERE 1=1
    `;

    if (name) {
        sql += " AND users.user_name LIKE ?";
        params.push('%' + name + '%');
    }

    sql += " ORDER BY users.user_id DESC";
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo los usuarios. Vuelva a intentarlo más tarde" });
        }
        if (result.length == 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron resultados." })
        }

        const mappedResult = result.map(row => ({
            ...row,
            image: `uploads/users/${row.image || 'u-default.png'}`
        }))

        res.json(mappedResult);
    })
}

export const createUser = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { tier, email, password } = req.body;

    const checkUser = `
        SELECT COUNT(*) AS found FROM users WHERE email = ? LIMIT 1
    `;
    db.query(checkUser, [email], async (error, result) => {
        if (error){
            return res
                .status(500)
                .json({ error: "Hubo un problema verificando el correo. Vuelva a intentarlo más tarde" });
        }
        if (result[0].found > 0){
            return res
                .status(409)
                .json({ user_exists: "El correo electrónico ya está en uso" });
        }

        const username = req.body.username || `user${rngString(6)}`;
        const image = req.file ? req.file.filename : 'u-default.png';
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = `INSERT INTO users (user_image, tier_id, user_name, email, password) VALUES (?, ?, ?, ?, ?)`
        db.query(sql, [image, tier, username, email, hashedPassword], (error, result) => {
            if (error) {
                return res
                    .status(500)
                    .json({ error: "Hubo un problema registrando al usuario. Vuelva a intentarlo más tarde" });
            }

            res.status(201).json({ message: "Usuario registrado con éxito.", id: result.insertId, username })
        })
    })
}

export const updateUser = async (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const image = req.file ? req.file.filename : null;
    const { tier, username, email, password } = req.body;

    const fields = [];
    const params = [];

    if (image) {
        fields.push("user_image = ?");
        params.push(image);
    }
    if (tier) {
        fields.push("tier_id = ?");
        params.push(tier);
    }
    if (username) {
        fields.push("user_name = ?");
        params.push(username);
    }
    if (email) {
        fields.push("email = ?");
        params.push(email);
    }
    if (password) {
        const hashedPassword = await bcrypt.hash(password, salt);
        fields.push("password = ?");
        params.push(hashedPassword);
    }

    if (fields.length === 0) {
        return res
            .status(400)
            .json({ error: "No se envió ningún campo ha actualizar." });
    }

    params.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema al actualizar el usuario. Vuelva a intentarlo más tarde." });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el usuario ha actualizar." });
        }

        res.status(201).json({ message: "Usuario actualizado con éxito.", id })
    })
}

export const deleteUser = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const sql = 'DELETE FROM users WHERE user_id = ?';
    db.query(sql, [id], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema eliminando el usuario. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el usuario ha eliminar" });
        }

        res.status(201).json({ message: "Usuario eliminado con éxito.", id })
    })
}