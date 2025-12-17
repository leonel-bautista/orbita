import express from 'express'

import * as controller from '#controllers/tiers.controller';

const router = express.Router();

router.get('/', controller.getEveryTier);
router.post('/create', controller.createTier);
router.put('/update/:id', controller.updateTier);
router.delete('/delete/:id', controller.deleteTier);

export const tiersRoutes = router;