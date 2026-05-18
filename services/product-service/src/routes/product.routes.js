'use strict';

const { Router } = require('express');
const ProductController = require('../controllers/product.controller');
const validate = require('../middlewares/validate');
const { authenticate, requireRole } = require('../middlewares/authenticate');
const cache = require('../middlewares/cache');
const schemas = require('../validators/product.validator');

const router = Router();

// Public reads — cached
router.get('/search', validate(schemas.searchQuery, 'query'), cache(60), ProductController.search);
router.get('/',       validate(schemas.listQuery,   'query'), cache(),    ProductController.list);
router.get('/slug/:slug',                                     cache(),    ProductController.getBySlug);
router.get('/:id',                                            cache(),    ProductController.getOne);

// Admin mutations — no cache
router.post('/',                authenticate, requireRole('admin'), validate(schemas.create),      ProductController.create);
router.patch('/:id',            authenticate, requireRole('admin'), validate(schemas.update),      ProductController.update);
router.delete('/:id',           authenticate, requireRole('admin'),                                ProductController.remove);
router.patch('/:id/stock',      authenticate, requireRole('admin'), validate(schemas.updateStock), ProductController.updateStock);

module.exports = router;