import { db } from "#config/db";

export const getEveryTier = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name } = req.query;
    const params = [];
    let sql = 'SELECT tier_id AS id, tier_name AS name, tier_description AS description FROM tiers WHERE 1=1'

    if (name) {
        sql += " AND tier_name LIKE ?";
        params.push('%' + name + '%');
    }

    sql += " ORDER BY tier_id DESC";
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo los planes. Vuelva a intentarlo más tarde" });
        }
        if (result.length == 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron resultados." })
        }

        res.json(result);
    })
}

export const createTier = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { name, description = '' } = req.body;
    const sql = 'INSERT INTO tiers (tier_name, tier_description) VALUES (?, ?)';

    db.query(sql, [name, description], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema registrando el plan. Vuelva a intentarlo más tarde" });
        }

        res.status(201).json({ message: "Nivel de plan registrado con éxito.", id: result.insertId, name })
    })
}

export const updateTier = (req, res) => {
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
        fields.push("tier_name = ?");
        params.push(name);
    }
    if (description) {
        fields.push("tier_description = ?");
        params.push(description);
    }

    if (fields.length === 0) {
        return res
            .status(400)
            .json({ error: "No se envió ningún campo ha actualizar." });
    }

    params.push(id);
    const sql = `UPDATE tiers SET ${fields.join(', ')} WHERE tier_id = ?`
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema al actualizar el plan. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el plan ha actualizar" });
        }

        res.status(201).json({ message: "Nivel de plan actualizado con éxito.", id })
    })
}

export const deleteTier = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const sql = 'DELETE FROM tiers WHERE tier_id = ?';
    db.query(sql, [id], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema eliminando el plan. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el plan ha eliminar" });
        }

        res.status(201).json({ message: "Nivel de plan eliminado con éxito.", id })
    })
}