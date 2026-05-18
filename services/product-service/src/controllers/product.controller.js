'use strict';

const ProductService = require('../services/product.service');

const ProductController = {
  async list(req, res, next) {
    try { res.json(await ProductService.list(req.query)); }
    catch (err) { next(err); }
  },

  async search(req, res, next) {
    try { res.json(await ProductService.search(req.query.q, req.query)); }
    catch (err) { next(err); }
  },

  async getOne(req, res, next) {
    try { res.json({ product: await ProductService.getById(req.params.id) }); }
    catch (err) { next(err); }
  },

  async getBySlug(req, res, next) {
    try { res.json({ product: await ProductService.getBySlug(req.params.slug) }); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try { res.status(201).json({ product: await ProductService.create(req.body) }); }
    catch (err) { next(err); }
  },

  async update(req, res, next) {
    try { res.json({ product: await ProductService.update(req.params.id, req.body) }); }
    catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try { await ProductService.remove(req.params.id); res.status(204).send(); }
    catch (err) { next(err); }
  },

  async updateStock(req, res, next) {
    try {
      const product = await ProductService.updateStock(req.params.id, req.body.quantity);
      res.json({ product });
    } catch (err) { next(err); }
  },
};

module.exports = ProductController;