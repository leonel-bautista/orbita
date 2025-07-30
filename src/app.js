import 'dotenv/config'
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { adminOnly, checkAuth, userOnly } from '#middlewares/authorizations.middleware';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
    SERVER_PORT,
    SERVER_HOST,
    FRONT_URL,
    API_URL,
    ADMIN_URL,
    NODE_ENV
} = process.env;
const PORT = parseInt(SERVER_PORT) || 4000;
const adminHost = new URL(ADMIN_URL).hostname;
const apiHost = new URL(API_URL).hostname;

const corsConfig = {
    origin: [ FRONT_URL, API_URL, ADMIN_URL ],
    credentials: true
}

if (NODE_ENV === 'production') app.set('trust proxy', true);
app.use(cors(corsConfig));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(checkAuth)

const publicDir = path.join(__dirname, '..', 'public');
const viewsDir = path.join(publicDir, 'views');

// --- APIS ---
const apiApp = express();
apiApp.use(cors(corsConfig));
apiApp.use(express.json());

import { authRoutes } from '#routes/auth.routes';
apiApp.use('/auth', authRoutes);

// --- FRONT PRINCIPAL ---
const mainApp = express();
mainApp.use(express.static(publicDir));

mainApp.get('/', userOnly, (req, res) => res.sendFile(path.join(viewsDir, 'index.html')));
mainApp.get('/register', (req, res) => res.sendFile(path.join(viewsDir, 'register.html')));
mainApp.get('/login', (req, res) => res.sendFile(path.join(viewsDir, 'login.html')));

// --- FRONT ADMINISTRATIVO ---
const adminApp = express();
adminApp.use(adminOnly)
adminApp.use(express.static(publicDir));

adminApp.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'admin.html')))

// --- DISPATCHER ---
app.use((req, res, next) => {
    switch (req.hostname){
        case apiHost:
            return apiApp(req, res, next);
        case adminHost:
            return adminApp(req, res, next);
        default:
            return mainApp(req, res, next)
    }
})

// --- PRENDER SERVER ---
app.listen(PORT, SERVER_HOST, () => {
    console.log('server escuchando en el puerto: ' + PORT);
    console.log(FRONT_URL);
})