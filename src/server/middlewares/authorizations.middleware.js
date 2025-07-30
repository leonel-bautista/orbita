import jwt from "jsonwebtoken";

const {
     JWT_SECRET,
     FRONT_URL,
     COOKIE_NAME,
     ADMIN_URL
} = process.env;

function extractToken(req){
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')){
        return authHeader.slice(7);
    }
    return req.cookies?.[COOKIE_NAME]
}
function buildNextAbsolute(req) {
    const host = (req.get('X-Forwarded-Host') || req.get('Host')).split(':')[0];
    const origin = `${req.protocol}://${host}`;
    return encodeURIComponent(origin + req.originalUrl);
}

export const checkAuth = (req, res, next) => {
    const token = extractToken(req);
    if (!token) return next();

    jwt.verify(token, JWT_SECRET, (error, payload) => {
        if (error){
            res.clearCookie(COOKIE_NAME, { path: '/' });
            return next();
        }
        req.user = payload;
        next();
    })
}

export const userOnly = (req, res, next) => {
    if (!req.user){
        if (req.accepts('html')){
            const nextUrl = buildNextAbsolute(req);
            const loginThenNext = `${FRONT_URL}/login?next=${nextUrl}`;

            return res.redirect(loginThenNext)
        }
        return res
            .status(401)
            .json({ error: "(❌) Debe iniciar sesión para seguir." })
    }
    next();
}

export const adminOnly = (req, res, next) => {
    if (!req.user){
        if (req.accepts('html')){
            const nextUrl = buildNextAbsolute(req);
            const loginThenNext = `${FRONT_URL}/login?next=${nextUrl}`;

            return res.redirect(loginThenNext)
        }
        return res
            .status(401)
            .json({ error: "(❌) Debe iniciar sesión para seguir." })
    }

    const host = (req.get('X-Forwarded-Host') || req.get('Host') || '').split(":")[0];
    const adminHost = new URL(ADMIN_URL).hostname;
    
    if (host !== adminHost || req.user.auth !== 'admin'){
        console.error("(❌) Acceso denegado.");
        return res.redirect(FRONT_URL);
    }
    next();
}