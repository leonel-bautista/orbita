import path from 'node:path';
import fs from 'node:fs/promises';

const BASE_PATH = process.env.BASE_PATH ?? null;

function normalizePath(pathString) {
    if (!pathString) return '/';
    let normalized = String(pathString).trim();
    if (!normalized.startsWith('/')) normalized = '/' + normalized;
    if (!normalized.endsWith('/')) normalized += '/';

    return normalized;
}

const escapeAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export const sendHtmlFile = (dir, fileName) => {
    const filePath = path.join(dir, fileName);
    let cachedFile = null;

    return async (req, res, next) => {
        try {
            if (!cachedFile) cachedFile = await fs.readFile(filePath, 'utf-8');

            const rawPath = BASE_PATH ?? (req.baseUrl || '/')
            const base = normalizePath(rawPath);
            const safeBase = escapeAttr(base);

            const html = cachedFile.includes('<!-- BASE -->')
                ? cachedFile.replace('<!-- BASE -->', `<base href="${safeBase}">`)
                : cachedFile.replace(/<head([^>]*)>/i, `<head$1>\n<base href="${safeBase}">`);

            res.type('html').send(html);
        } catch (error) {
            next(error);
        }
    }
}