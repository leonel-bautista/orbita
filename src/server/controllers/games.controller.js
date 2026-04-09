import { db } from "#config/db";

function parseArrayField(field) {
    if (!field) return [];
    if (typeof field === "string") {
        try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            return [field]; // fallback
        }
    }
    if (Array.isArray(field)) return field;
    return [];
}

export const getEveryGame = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { status, name } = req.query;
    const params = [];
    let sql = `
        SELECT gameInfo.game_id AS 'id',
            gameInfo.game_image AS 'image',
            gameInfo.game_name AS 'name',
            gameInfo.tags AS 'tags',
            gameInfo.platforms AS 'platforms',
            gameInfo.launch_date AS 'launch',
            gameInfo.developer AS 'developer',
            gameInfo.game_description AS 'description',
            gameInfo.status AS 'status'
        FROM (
            SELECT games.game_id,
                games.game_image,
                games.game_name,
                GROUP_CONCAT(tags.tag_name) AS 'tags',
                gamePlatforms.platforms,
                games.launch_date,
                developers.developer_name AS 'developer',
                games.game_description,
                games.status
            FROM games
            LEFT JOIN games_tags
                ON games.game_id = games_tags.game_id
            LEFT JOIN tags
                ON tags.tag_id = games_tags.tag_id
            LEFT JOIN (
                SELECT games.game_id,
                    GROUP_CONCAT(platforms.platform_name) AS 'platforms'
                FROM games
                JOIN games_platforms
                    ON games.game_id = games_platforms.game_id
                JOIN platforms
                    ON platforms.platform_id = games_platforms.platform_id
                GROUP BY games.game_id
                ORDER BY platforms.platform_name

            ) AS gamePlatforms
                ON games.game_id = gamePlatforms.game_id
            LEFT JOIN developers
                ON developers.developer_id = games.developer_id
            GROUP BY games.game_id

        ) AS gameInfo
        WHERE 1=1
    `;

    if (status) {
        sql += " AND gameInfo.status = ?";
        params.push(status === 'active' ? 1 : status);
    }

    if (name) {
        sql += " AND gameInfo.game_name LIKE ?";
        params.push('%' + name + '%');
    }

    sql += " ORDER BY gameInfo.game_id DESC"
    db.query(sql, params, (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema trayendo los juegos. Vuelva a intentarlo más tarde" });
        }
        if (result.length == 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron resultados." })
        }

        const mappedResult = result.map(row => ({
            ...row,
            image: `uploads/games/${row.image || 'g-default.jpg'}`
        }))

        res.json(mappedResult);
    })
}

export const createGame = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const image = req.file ? req.file.filename : 'g-default.jpg';
    const { name, launch, developer, description } = req.body;
    const tags = parseArrayField(req.body.tags);
    const platforms = parseArrayField(req.body.platforms);

    const sqlGame = `
        INSERT INTO games (game_image, game_name, launch_date, developer_id, game_description, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(sqlGame, [image, name, launch, developer, description, 1], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema registrando el juego. Vuelva a intentarlo más tarde" });
        }

        const gameId = result.insertId;

        if (Array.isArray(platforms) && platforms.length) {
            const sqlPlatforms = `
                INSERT INTO games_platforms (game_id, platform_id)
                VALUES ?
            `
            const values = platforms.map(platformId => [gameId, platformId]);
            db.query(sqlPlatforms, [values], (error) => {
                if (error) {
                    return res
                        .status(500)
                        .json({ error: "Hubo un problema creando la relación juegos-plataformas. Vuelva a intentarlo más tarde" });
                }
            })
        }

        if (Array.isArray(tags) && tags.length) {
            const sqlTags = `
                INSERT INTO games_tags (game_id, tag_id)
                VALUES ?
            `
            const values = tags.map(tagId => [gameId, tagId]);
            db.query(sqlTags, [values], (error) => {
                if (error) {
                    return res
                        .status(500)
                        .json({ error: "Hubo un problema creando la relación juegos-etiquetas. Vuelva a intentarlo más tarde" });
                }
            })
        }

        res.status(201).json({ message: "Juego registrado con éxito.", id: gameId, name })
    })
}

export const updateGame = async (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const image = req.file ? req.file.filename : null;
    const { name, launch, developer, description, status } = req.body;
    const tags = parseArrayField(req.body.tags);
    const platforms = parseArrayField(req.body.platforms);

    const fields = [];
    const params = [];

    if (image) {
        fields.push("game_image = ?");
        params.push(image);
    }
    if (name) {
        fields.push("game_name = ?");
        params.push(name);
    }
    if (launch) {
        fields.push("launch_date = ?");
        params.push(launch);
    }
    if (developer) {
        fields.push("developer_id = ?");
        params.push(developer);
    }
    if (description) {
        fields.push("game_description = ?");
        params.push(description);
    }
    if (status !== undefined) {
        fields.push("status = ?");
        params.push(status);
    }

    if (fields.length === 0 && !tags.length && !platforms.length) {
        return res
            .status(400)
            .json({ error: "No se envió ningún campo ha actualizar." });
    }

    let pending = 1;
    const done = () => {
        pending--;
        if (pending === 0) {
            res.status(200).json({ message: "Juego actualizado con éxito.", id });
        }
    };

    if (fields.length > 0) {
        params.push(id);
        const sqlGame = `UPDATE games SET ${fields.join(', ')} WHERE game_id = ?`
        db.query(sqlGame, params, (error, result) => {
            if (error) {
                return res
                    .status(500)
                    .json({ error: "Hubo un problema al actualizar el juego. Vuelva a intentarlo más tarde" });
            }
            if (result.affectedRows === 0) {
                return res
                    .status(404)
                    .json({ error: "No se encontró el juego ha actualizar" });
            }
            done();
        })
    }
    else done();

    if (tags !== undefined) {
        pending++;
        const sqlClean = 'DELETE FROM games_tags WHERE game_id = ?';
        db.query(sqlClean, [id], (error) => {
            if (error) {
                return res
                    .status(500)
                    .json({ error: "Hubo un problema limpiando la relación juegos-etiquetas. Vuelva a intentarlo más tarde" });
            }
            if (tags.length) {
                const sqlTags = 'INSERT INTO games_tags (game_id, tag_id) VALUES ?';
                const values = tags.map(tagId => [id, tagId]);
                db.query(sqlTags, [values], (error) => {
                    if (error) {
                        return res
                            .status(500)
                            .json({ error: "Hubo un problema registrando las relaciones juegos-etiquetas. Vuelva a intentarlo más tarde" });
                    }
                    done();
                });
            } else done();
        })
    }

    if (platforms !== undefined) {
        const sqlClean = 'DELETE FROM games_platforms WHERE game_id = ?';
        db.query(sqlClean, [id], (error) => {
            if (error) {
                return res
                    .status(500)
                    .json({ error: "Hubo un problema limpiando la relación juegos-plataformas. Vuelva a intentarlo más tarde" });
            }
            if (platforms.length) {
                const sqlPlatforms = 'INSERT INTO games_platforms (game_id, platform_id) VALUES ?';
                const values = platforms.map(platformId => [id, platformId]);
                db.query(sqlPlatforms, [values], (error) => {
                    if (error) {
                        return res
                            .status(500)
                            .json({ error: "Hubo un problema registrando las relaciones juegos-plataformas. Vuelva a intentarlo más tarde" });
                    }
                    done();
                });
            } else done();
        })
    }
}

export const deleteGame = (req, res) => {
    if (!db) {
        return res
            .status(500)
            .json({ error: "Hubo un problema comunicandose con la base de datos." });
    }

    const { id } = req.params;
    const sql = 'DELETE FROM games WHERE game_id = ?';
    db.query(sql, [id], (error, result) => {
        if (error) {
            return res
                .status(500)
                .json({ error: "Hubo un problema eliminando el juego. Vuelva a intentarlo más tarde" });
        }
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "No se encontró el juego ha eliminar" });
        }

        res.status(201).json({ message: "Juego eliminado con éxito.", id })
    })
}