import express from 'express'

import * as controller from '#controllers/admins.controller';

const router = express.Router();

router.get('/', controller.getEveryAdmin);
router.post('/create', controller.createAdmin);
router.put('/update/:id', controller.updateAdmin);
router.delete('/delete/:id', controller.deleteAdmin);

export const adminsRoutes = router;