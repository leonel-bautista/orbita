import express from 'express'

import * as controller from '#controllers/roles.controller';

const router = express.Router();

router.get('/', controller.getEveryRole);
router.post('/create', controller.createRole);
router.put('/update/:id', controller.updateRole);
router.delete('/delete/:id', controller.deleteRole);

export const rolesRoutes = router;