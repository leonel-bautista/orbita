import { db } from "#config/db";

export const getEveryPlatform = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.query;
    const params = [];
    let sql = 'SELECT platform_id AS id, platform_name AS name FROM platforms WHERE 1=1'

    if (name) {
        sql += " AND platform_name LIKE ?";
        params.push('%' + name + '%');
    }

    sql += " ORDER BY platform_id DESC";
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo las plataformas. Vuelva a intentarlo más tarde" });
        }
        if (result.length == 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron resultados." })
        }

        res.json(result);
    })
}

export const createPlatform = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.body;
    const sql = 'INSERT INTO platforms (platform_name) VALUES (?)';

    db.query(sql, [name], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema registrando la plataforma. Vuelva a intentarlo más tarde" });
        }

        res.status(201).json({ message: "Plataforma de juegos registrada con éxito.", id: result.insertId, name })
    })
}

export const updatePlatform = (req, res) => {
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
        fields.push("platform_name = ?");
        params.push(name);
    }

    if (fields.length === 0) {
        return res
            .status(400)
            .json({ error: "No se envió ningún campo ha actualizar." });
    }

    params.push(id);
    const sql = `UPDATE platforms SET ${fields.join(', ')} WHERE platform_id = ?`
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema al actualizar la plataforma. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró la plataforma ha actualizar" });
        }

        res.status(201).json({ message: "Plataforma de juegos actualizada con éxito.", id })
    })
}

export const deletePlatform = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const sql = 'DELETE FROM platforms WHERE platform_id = ?';
    db.query(sql, [id], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema eliminando la plataforma. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró la plataforma ha eliminar" });
        }

        res.status(201).json({ message: "Plataforma de juegos eliminada con éxito.", id })
    })
}