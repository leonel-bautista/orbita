import 'dotenv/config'
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { adminOnly, checkAuth, userOnly } from '#middlewares/authorizations.middleware';
import { fileUploadHandler } from '#middlewares/uploads.middleware';
import { sendHtmlFile } from '#middlewares/files.middleware';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
    SERVER_PORT,
    SERVER_HOST,
    MAIN_URL,
    NODE_ENV
} = process.env;
const PORT = parseInt(SERVER_PORT) || 4000;
const HOST = SERVER_HOST || '0.0.0.0';
const allowedOrigins = MAIN_URL ? [ MAIN_URL ] : [];

const corsConfig = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};

if (NODE_ENV === 'production') app.set('trust proxy', true);
app.use(cors(corsConfig));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const publicDir = path.join(__dirname, '..', 'public');
const viewsDir = path.join(publicDir, 'views');
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use(checkAuth)

// --- APIS ---
const apiApp = express();
apiApp.use(express.json());
apiApp.use(fileUploadHandler);

import { authRoutes } from '#routes/auth.routes';
apiApp.use('/auth', authRoutes);
import { adminsRoutes } from '#routes/admins.routes';
apiApp.use('/tables/admins', adminsRoutes);
import { areasRoutes } from '#routes/areas.routes';
apiApp.use('/tables/areas', areasRoutes);
import { developersRoutes } from '#routes/developers.routes';
apiApp.use('/tables/developers', developersRoutes);
import { gamesRoutes } from '#routes/games.routes';
apiApp.use('/tables/games', gamesRoutes);
import { platformsRoutes } from '#routes/platforms.routes';
apiApp.use('/tables/platforms', platformsRoutes);
import { rolesRoutes } from '#routes/roles.routes';
apiApp.use('/tables/roles', rolesRoutes);
import { tagsRoutes } from '#routes/tags.routes';
apiApp.use('/tables/tags', tagsRoutes)
import { tiersRoutes } from '#routes/tiers.routes';
apiApp.use('/tables/tiers', tiersRoutes);
import { usersRoutes } from '#routes/users.routes';
apiApp.use('/tables/users', usersRoutes);

// --- FRONT PRINCIPAL ---
const mainApp = express();
mainApp.use(express.static(publicDir));

mainApp.get('/', sendHtmlFile(viewsDir, 'index.html'));
mainApp.get('/register', sendHtmlFile(viewsDir, 'register.html'));
mainApp.get('/login', sendHtmlFile(viewsDir, 'login.html'));
mainApp.get('/juegos', sendHtmlFile(viewsDir, 'games-list.html'));
mainApp.get('/juegos/:id', sendHtmlFile(viewsDir, 'game.html'));
mainApp.get('/aplicaciones', sendHtmlFile(viewsDir, 'apps-list.html'));
mainApp.get('/planes', sendHtmlFile(viewsDir, 'subscriptions.html'));
mainApp.get('/acerca-de', sendHtmlFile(viewsDir, 'about.html'));
mainApp.get('/cuenta', userOnly, sendHtmlFile(viewsDir, 'account.html'));

// --- FRONT ADMINISTRATIVO ---
const adminApp = express();
adminApp.use(adminOnly)
adminApp.use(express.static(publicDir));

adminApp.get('/', sendHtmlFile(viewsDir, 'dashboard.html'));

// --- DISPATCHER ---
app.use('/', mainApp);
app.use('/api', apiApp);
app.use('/admin', adminApp);

app.use(sendHtmlFile(viewsDir, '404.html'));

// --- PRENDER SERVER ---
app.listen(PORT, HOST, () => {
    console.log('server escuchando en el puerto: ' + PORT);
    console.log(MAIN_URL);
})