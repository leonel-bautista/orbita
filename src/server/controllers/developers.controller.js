import { db } from "#config/db";

export const getEveryDeveloper = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.query;
    const params = [];
    let sql = 'SELECT developer_id AS id, developer_name AS name FROM developers WHERE 1=1'

    if (name) {
        sql += " AND developer_name LIKE ?";
        params.push('%' + name + '%');
    }

    sql += " ORDER BY developer_id DESC";
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo los desarrolladores. Vuelva a intentarlo más tarde" });
        }

        res.json(result);
    })
}

export const createDeveloper = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.body;
    const sql = 'INSERT INTO developers (developer_name) VALUES (?)';

    db.query(sql, [name], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema registrando el desarrollador. Vuelva a intentarlo más tarde" });
        }

        res.status(201).json({ message: "Desarrollador de juegos registrado con éxito.", id: result.insertId, name })
    })
}

export const updateDeveloper = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const { name } = req.body;

    const fields = [];
    const params = [];

    if (name) {
        fields.push("developer_name = ?");
        params.push(name);
    }

    if (fields.length === 0) {
        return res
            .status(400)
            .json({ error: "No se envió ningún campo ha actualizar." });
    }

    params.push(id);
    const sql = `UPDATE developers SET ${fields.join(', ')} WHERE developer_id = ?`
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema al actualizar el desarrollador. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el desarrollador ha actualizar" });
        }

        res.status(201).json({ message: "Desarrollador de juegos actualizado con éxito.", id })
    })
}

export const deleteDeveloper = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const sql = 'DELETE FROM developers WHERE developer_id = ?';
    db.query(sql, [id], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema eliminando el desarrollador. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el desarrollador ha eliminar" });
        }

        res.status(201).json({ message: "Desarrollador de juegos eliminado con éxito.", id })
    })
}