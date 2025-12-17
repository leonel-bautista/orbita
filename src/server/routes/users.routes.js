import express from 'express';
import path from 'node:path';
import multer from 'multer';

import * as controller from '#controllers/users.controller';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'src/uploads/users');
    },
    filename: (req, file, callback) => {
        callback(null, "u-" + Date.now() + path.extname(file.originalname));
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

        if (mimetype && path.extname) return callback(null, true);

        callback("(❌) ERROR: Tipo de archivo no soportado");
    },

    limits: { fileSize: 1024 * 1024 * 1 } // 1MB
});

router.get('/', controller.getEveryUser);
router.post('/create', upload.single('image'), controller.createUser);
router.put('/update/:id', upload.single('image'), controller.updateUser);
router.delete('/delete/:id', controller.deleteUser);

export const usersRoutes = router;