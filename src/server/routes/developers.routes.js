import express from 'express'

import * as controller from '#controllers/developers.controller';

const router = express.Router();

router.get('/', controller.getEveryDeveloper);
router.post('/create', controller.createDeveloper);
router.put('/update/:id', controller.updateDeveloper);
router.delete('/delete/:id', controller.deleteDeveloper);

export const developersRoutes = router;