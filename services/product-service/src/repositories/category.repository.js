'use strict';

const Category = require('../models/category.model');

const CategoryRepository = {
  findAll(filter = {}) {
    return Category.find({ isActive: true, ...filter }).sort({ name: 1 }).lean();
  },

  findById(id) {
    return Category.findById(id).lean();
  },

  findBySlug(slug) {
    return Category.findOne({ slug }).lean();
  },

  create(data) {
    return Category.create(data);
  },

  update(id, data) {
    return Category.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
  },

  softDelete(id) {
    return Category.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
  },

  countProducts(categoryId) {
    const Product = require('../models/product.model');
    return Product.countDocuments({ category: categoryId, isActive: true });
  },
};

module.exports = CategoryRepository;