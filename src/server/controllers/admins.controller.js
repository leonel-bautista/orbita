import { db } from "#config/db";
import bcrypt from "bcryptjs";

const { SALT_ROUNDS, DEFAULT_PIN } = process.env;
const salt = parseInt(SALT_ROUNDS) || 10;

export const getEveryAdmin = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.query;
    const params = [];
    let sql = `
        SELECT admins.admin_id AS id,
               users.user_name AS user,
               roles.role_name AS role,
               areas.area_name AS area
        FROM admins
        LEFT JOIN users ON admins.user_id = users.user_id
        LEFT JOIN roles ON admins.role_id = roles.role_id
        LEFT JOIN areas ON admins.area_id = areas.area_id
        WHERE 1=1
    `;

    if (name) {
        sql += " AND users.user_name LIKE ?";
        params.push('%' + name + '%');
    }

    sql += " ORDER BY admins.admin_id DESC";
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo los administradores. Vuelva a intentarlo más tarde" });
        }
        if (result.length == 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron resultados." })
        }

        res.json(result);
    })
}

export const createAdmin = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { user, role, area } = req.body;
    const pin = req.body.pin || DEFAULT_PIN || '4321';
    const checkAdmin = 'SELECT admin_id AS found FROM admins WHERE user_id = ? LIMIT 1'

    db.query(checkAdmin, [user], async (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema verificando al usuario. Vuelva a intentarlo más tarde" });
        }
        if (result.length > 0){
            return res
                .status(409)
                .json({ error: "El usuario ya está registrado como administrador." });
        }

        const hashedPin = await bcrypt.hash(pin, salt);

        const sql = 'INSERT INTO admins (user_id, role_id, area_id, pin) VALUES (?, ?, ?, ?)';
        db.query(sql, [user, role, area, hashedPin], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema registrando al administrador. Vuelva a intentarlo más tarde" });
        }

        res.status(201).json({ message: "Administrador registrado con éxito.", admin_id: result.insertId, user_id: user })
    })
    })
}

export const updateAdmin = async (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const { role, area, pin } = req.body;

    const fields = [];
    const params = [];

    if (role) {
        fields.push("role_id = ?");
        params.push(role);
    }
    if (area) {
        fields.push("area_id = ?");
        params.push(area);
    }
    if (pin) {
        const hashedPin = await bcrypt.hash(pin, salt);
        fields.push("pin = ?");
        params.push(hashedPin);
    }

    if (fields.length === 0) {
        return res
            .status(400)
            .json({ error: "No se envió ningún campo ha actualizar." });
    }

    params.push(id);
    const sql = `UPDATE admins SET ${fields.join(', ')} WHERE admin_id = ?`
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema al actualizar el administrador. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el administrador ha actualizar" });
        }

        res.status(201).json({ message: "Administrador actualizado con éxito.", id })
    })
}

export const deleteAdmin = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const sql = 'DELETE FROM admins WHERE admin_id = ?';
    db.query(sql, [id], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema eliminando el administrador. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el administrador ha eliminar" });
        }

        res.status(201).json({ message: "Administrador eliminado con éxito.", id })
    })
}