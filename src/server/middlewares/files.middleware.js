import path from 'node:path';
import fs from 'node:fs/promises';

const { BASE_PATH } = process.env;

export const sendHtmlFile = (dir, fileName) => {
    return async (req, res, next) => {
        try {
            const filePath = path.join(dir, fileName);

            let base = BASE_PATH || req.baseUrl || '/';
            if (!base.endsWith('/')) base += '/';

            let html = await fs.readFile(filePath, 'utf-8');
            html = html.replace('<!-- BASE -->', `<base href="${base}">`);

            res.type('html').send(html);
        } catch (error) {
            next(error);
        }
    }
}