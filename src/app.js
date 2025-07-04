import dotenv from 'dotenv';
dotenv.config();

import 'module-alias/register.js';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = process.env.HOST_PORT || 8100;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- DIRECTORIOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- PÁGINAS ---
// INICIO
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'public', 'views', 'index.html');
    res.sendFile(indexPath);
})

// --- PRENDER SERVER ---
app.listen(PORT, () => {
    console.log('server escuchando en el puerto: ' + PORT);
    console.log(`http://localhost:${PORT}`);
})