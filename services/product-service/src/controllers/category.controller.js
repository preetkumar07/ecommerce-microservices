'use strict';

const CategoryService = require('../services/category.service');

const CategoryController = {
  async list(req, res, next) {
    try { res.json({ categories: await CategoryService.list() }); }
    catch (err) { next(err); }
  },

  async getOne(req, res, next) {
    try { res.json({ category: await CategoryService.getById(req.params.id) }); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try { res.status(201).json({ category: await CategoryService.create(req.body) }); }
    catch (err) { next(err); }
  },

  async update(req, res, next) {
    try { res.json({ category: await CategoryService.update(req.params.id, req.body) }); }
    catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try { await CategoryService.remove(req.params.id); res.status(204).send(); }
    catch (err) { next(err); }
  },
};

module.exports = CategoryController;