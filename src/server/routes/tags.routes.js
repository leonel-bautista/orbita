import express from 'express'

import * as controller from '#controllers/tags.controller';

const router = express.Router();

router.get('/', controller.getEveryTag);
router.post('/create', controller.createTag);
router.put('/update/:id', controller.updateTag);
router.delete('/delete/:id', controller.deleteTag);

export const tagsRoutes = router;