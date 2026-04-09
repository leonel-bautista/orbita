import multer from "multer";
import path from "node:path";

const FILE_MAX_SIZE = 1024 * 1024 * 1 // 1MB

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const route = req.path.split('/').filter(Boolean);
        const routeId = route[0] === 'tables' ? route[1] : route[0];

        let uploadPath;
        switch (routeId) {
            case 'games':
                uploadPath = 'src/uploads/games'; break;
            case 'users':
            case 'auth':
                uploadPath = 'src/uploads/users'; break;
            default:
                uploadPath = 'src/uploads';
        }

        callback(null, uploadPath);
    },
    filename: (req, file, callback) => {
        const route = req.path.split('/').filter(Boolean);
        const routeId = route[0] === 'tables' ? route[1] : route[0];

        let prefix;
        switch (routeId) {
            case 'games':
                prefix = 'g-'; break;
            case 'users':
            case 'auth':
                prefix = 'u-'; break;
            default:
                prefix = 'f-';
        }

        callback(null, prefix + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, callback) => {
        const fileTypes = /jpg|jpeg|png|webp/;
        const mimetype = fileTypes.test(file.mimetype);
        const extname = fileTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        if (mimetype && extname) return callback(null, true);

        callback("(❌) ERROR: Tipo de archivo no soportado");
    },

    limits: { fileSize: FILE_MAX_SIZE }
});

export const fileUploadHandler = (req, res, next) => {
    upload.single('image')(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            return res
                    .status(400)
                    .json({ error: error.message });
        }
        else if (error) {
            return res
                    .status(400)
                    .json({ error })
        }

        next()
    })
}

export const normalizeUploadPath = () => {
    const rawBase = process.env.BASE_PATH ?? '';
    const cleanBase = String(rawBase).replace(/^\/+|\/+$/g, '');
    const base = cleanBase ? '/' + cleanBase : null;
    if (!base) return (req, res, next) => next();

    const match = base + '/uploads';
    return (req, res, next) => {
        try {
            if (req.url === match || req.url.startsWith(match + '/'))
                req.url = req.url.slice(base.length);
        }
        catch (error) {}

        next();
    }
}