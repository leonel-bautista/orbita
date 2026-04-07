import { db } from "#config/db";

export const getEveryRole = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.query;
    const params = [];
    let sql = 'SELECT role_id AS id, role_name AS name, role_description AS description FROM roles WHERE 1=1'

    if (name) {
        sql += " AND role_name LIKE ?";
        params.push('%' + name + '%');
    }

    sql += " ORDER BY role_id DESC";
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo los roles. Vuelva a intentarlo más tarde" });
        }
        if (result.length == 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron resultados." })
        }

        res.json(result);
    })
}

export const createRole = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name, description = '' } = req.body;
    const sql = 'INSERT INTO roles (role_name, role_description) VALUES (?, ?)';

    db.query(sql, [name, description], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema registrando el rol. Vuelva a intentarlo más tarde" });
        }

        res.status(201).json({ message: "Rol de administración registrado con éxito.", id: result.insertId, name })
    })
}

export const updateRole = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const fields = [];
    const params = [];

    if (name) {
        fields.push("role_name = ?");
        params.push(name);
    }
    if (description) {
        fields.push("role_description = ?");
        params.push(description);
    }

    if (fields.length === 0) {
        return res
            .status(400)
            .json({ error: "No se envió ningún campo ha actualizar." });
    }

    params.push(id);
    const sql = `UPDATE roles SET ${fields.join(', ')} WHERE role_id = ?`
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema al actualizar el rol. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el rol ha actualizar" });
        }

        res.status(201).json({ message: "Rol de administración actualizado con éxito.", id })
    })
}

export const deleteRole = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const sql = 'DELETE FROM roles WHERE role_id = ?';
    db.query(sql, [id], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema eliminando el rol. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el rol ha eliminar" });
        }

        res.status(201).json({ message: "Rol de administración eliminado con éxito.", id })
    })
}