'use strict';

const { Router } = require('express');
const OrderController = require('../controllers/order.controller');
const { authenticate, requireRole, validate } = require('../middlewares');
const schemas = require('../validators/order.validator');

const router = Router();

// All order routes require a valid JWT
router.use(authenticate);

// ── Customer routes ──────────────────────────────────────────────────────────

/** Place a new order */
router.post('/',
  validate(schemas.placeOrder),
  OrderController.placeOrder
);

/** Get authenticated user's own order list */
router.get('/my',
  validate(schemas.listQuery, 'query'),
  OrderController.listMine
);

/** Get a single order by ID (customer sees only theirs; admin sees all) */
router.get('/:id',
  OrderController.getOne
);

/** Cancel an order (customer can cancel their own pending/confirmed orders) */
router.patch('/:id/cancel',
  validate(schemas.cancelOrder),
  OrderController.cancel
);

// ── Admin-only routes ────────────────────────────────────────────────────────

/** List all orders with filters */
router.get('/',
  requireRole('admin'),
  validate(schemas.listQuery, 'query'),
  OrderController.listAll
);

/** Move an order through the status lifecycle */
router.patch('/:id/status',
  requireRole('admin'),
  validate(schemas.updateStatus),
  OrderController.updateStatus
);

module.exports = router;