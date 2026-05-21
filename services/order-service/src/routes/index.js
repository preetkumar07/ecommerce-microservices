'use strict';

const { Router }  = require('express');
const orderRoutes = require('./order.routes');

const router = Router();
router.use('/orders', orderRoutes);

module.exports = router;