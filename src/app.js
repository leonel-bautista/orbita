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
const HOST = SERVER_HOST || '0.0.0.0';

const getHostname = (url) => new URL(url).hostname;
const apiHost = getHostname(API_URL);
const adminHost = getHostname(ADMIN_URL);

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
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// --- APIS ---
const apiApp = express();
apiApp.use(express.json());
// apiApp.use(cors(corsConfig));

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

mainApp.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'index.html')));
mainApp.get('/register', (req, res) => res.sendFile(path.join(viewsDir, 'register.html')));
mainApp.get('/login', (req, res) => res.sendFile(path.join(viewsDir, 'login.html')));
mainApp.get('/juegos', (req, res) => res.sendFile(path.join(viewsDir, 'games-list.html')));
mainApp.get('/juegos/:id', (req, res) => res.sendFile(path.join(viewsDir, 'game.html')));
mainApp.get('/aplicaciones', (req, res) => res.sendFile(path.join(viewsDir, 'apps-list.html')));
mainApp.get('/planes', (req, res) => res.sendFile(path.join(viewsDir, 'subscriptions.html')));
mainApp.get('/acerca-de', (req, res) => res.sendFile(path.join(viewsDir, 'about.html')));
mainApp.get('/cuenta', userOnly, (req, res) => res.sendFile(path.join(viewsDir, 'account.html')));

// --- FRONT ADMINISTRATIVO ---
const adminApp = express();
adminApp.use(adminOnly)
adminApp.use(express.static(publicDir));

adminApp.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'dashboard.html')));

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
app.listen(PORT, HOST, () => {
    console.log('server escuchando en el puerto: ' + PORT);
    console.log(FRONT_URL);
})