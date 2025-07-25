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
// REGISTRO
app.get('/register', (req, res) => {
    const registerPath = path.join(__dirname, '..', 'public', 'views', 'register.html');
    res.sendFile(registerPath);
})
// LOGIN
app.get('/login', (req, res) => {
    const loginPath = path.join(__dirname, '..', 'public', 'views', 'login.html');
    res.sendFile(loginPath);
})

// --- PRENDER SERVER ---
app.listen(PORT, () => {
    console.log('server escuchando en el puerto: ' + PORT);
    console.log(`http://localhost:${PORT}`);
})