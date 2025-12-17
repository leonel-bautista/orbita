import express from 'express'

import * as controller from '#controllers/areas.controller';

const router = express.Router();

router.get('/', controller.getEveryArea);
router.post('/create', controller.createArea);
router.put('/update/:id', controller.updateArea);
router.delete('/delete/:id', controller.deleteArea);

export const areasRoutes = router;