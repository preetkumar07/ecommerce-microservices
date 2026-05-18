'use strict';

const { Router } = require('express');
const CategoryController = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const { authenticate, requireRole } = require('../middlewares/authenticate');
const schemas = require('../validators/category.validator');

const router = Router();

router.get('/',    CategoryController.list);
router.get('/:id', CategoryController.getOne);

// Admin-only mutations
router.post('/',    authenticate, requireRole('admin'), validate(schemas.create), CategoryController.create);
router.patch('/:id', authenticate, requireRole('admin'), validate(schemas.update), CategoryController.update);
router.delete('/:id',authenticate, requireRole('admin'), CategoryController.remove);

module.exports = router;