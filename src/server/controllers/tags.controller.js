import { db } from "#config/db";

export const getEveryTag = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.query;
    const params = [];
    let sql = 'SELECT tag_id AS id, tag_name AS name FROM tags WHERE 1=1'

    if (name) {
        sql += " AND tag_name LIKE ?";
        params.push('%' + name + '%');
    }

    sql += " ORDER BY tag_id DESC";
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo las etiquetas. Vuelva a intentarlo más tarde" });
        }

        res.json(result);
    })
}

export const createTag = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }
    const { name } = req.body;
    const sql = 'INSERT INTO tags (tag_name) VALUES (?)';

    db.query(sql, [name], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema registrando la etiqueta. Vuelva a intentarlo más tarde" });
        }

        res.status(201).json({ message: "Etiqueta de juego registrada con éxito.", id: result.insertId, name })
    })
}

export const updateTag = (req, res) => {
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
        fields.push("tag_name = ?");
        params.push(name);
    }

    if (fields.length === 0) {
        return res
            .status(400)
            .json({ error: "No se envió ningún campo ha actualizar." });
    }

    params.push(id);
    const sql = `UPDATE tags SET ${fields.join(', ')} WHERE tag_id = ?`
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema al actualizar la etiqueta. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró la etiqueta ha actualizar" });
        }

        res.status(201).json({ message: "Etiqueta de juego actualizada con éxito.", id })
    })
}

export const deleteTag = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const sql = 'DELETE FROM tags WHERE tag_id = ?';
    db.query(sql, [id], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema eliminando la etiqueta. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró la etiqueta ha eliminar" });
        }

        res.status(201).json({ message: "Etiqueta de juego eliminado con éxito.", id })
    })
}