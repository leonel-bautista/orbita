import express from 'express'

import * as controller from '#controllers/platforms.controller';

const router = express.Router();

router.get('/', controller.getEveryPlatform);
router.post('/create', controller.createPlatform);
router.put('/update/:id', controller.updatePlatform);
router.delete('/delete/:id', controller.deletePlatform);

export const platformsRoutes = router;