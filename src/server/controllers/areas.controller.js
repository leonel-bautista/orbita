import { db } from "#config/db";

export const getEveryArea = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.query;
    const params = [];
    let sql = 'SELECT area_id AS id, area_name AS name, area_description AS description FROM areas WHERE 1=1'

    if (name) {
        sql += " AND area_name LIKE ?";
        params.push('%' + name + '%');
    }

    sql += " ORDER BY area_id DESC";
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo las áreas. Vuelva a intentarlo más tarde" });
        }
        if (result.length == 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron resultados." })
        }

        res.json(result);
    })
}

export const createArea = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name, description = '' } = req.body;
    const sql = 'INSERT INTO areas (area_name, area_description) VALUES (?, ?)';

    db.query(sql, [name, description], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema registrando el área. Vuelva a intentarlo más tarde" });
        }

        res.status(201).json({ message: "Área de administración registrada con éxito.", id: result.insertId, name })
    })
}

export const updateArea = (req, res) => {
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
        fields.push("area_name = ?");
        params.push(name);
    }
    if (description) {
        fields.push("area_description = ?");
        params.push(description);
    }

    if (fields.length === 0) {
        return res
            .status(400)
            .json({ error: "No se envió ningún campo ha actualizar." });
    }

    params.push(id);
    const sql = `UPDATE areas SET ${fields.join(', ')} WHERE area_id = ?`
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema al actualizar el área. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el área ha actualizar" });
        }

        res.status(201).json({ message: "Área de administración actualizada con éxito.", id })
    })
}

export const deleteArea = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const sql = 'DELETE FROM areas WHERE area_id = ?';
    db.query(sql, [id], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema eliminando el área. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el área ha eliminar" });
        }

        res.status(201).json({ message: "Área de administración eliminada con éxito.", id })
    })
}