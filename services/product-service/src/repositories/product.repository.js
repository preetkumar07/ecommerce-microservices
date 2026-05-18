'use strict';

const Product = require('../models/product.model');

const ProductRepository = {
  async findAll({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    const [products, total] = await Promise.all([
      Product.find(filter).populate('category', 'name slug').sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    return { products, total };
  },

  findById(id) {
    return Product.findById(id).populate('category', 'name slug').lean();
  },

  findBySlug(slug) {
    return Product.findOne({ slug }).populate('category', 'name slug').lean();
  },

  findBySku(sku) {
    return Product.findOne({ sku }).lean();
  },

  create(data) {
    return Product.create(data);
  },

  update(id, data) {
    return Product.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .populate('category', 'name slug')
      .lean();
  },

  softDelete(id) {
    return Product.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
  },

  /**
   * Atomically decrement stock by `qty`, ensuring quantity never goes below 0.
   * Returns null if there's insufficient stock.
   */
  async decrementStock(id, qty) {
    return Product.findOneAndUpdate(
      { _id: id, 'inventory.quantity': { $gte: qty } },
      { $inc: { 'inventory.quantity': -qty } },
      { new: true }
    ).lean();
  },

  /**
   * Reserve stock (increment reserved counter) — used when order is placed.
   */
  async reserveStock(id, qty) {
    return Product.findOneAndUpdate(
      { _id: id, $expr: { $gte: [{ $subtract: ['$inventory.quantity', '$inventory.reserved'] }, qty] } },
      { $inc: { 'inventory.reserved': qty } },
      { new: true }
    ).lean();
  },

  /**
   * Release reserved stock — used when order is cancelled.
   */
  async releaseStock(id, qty) {
    return Product.findOneAndUpdate(
      { _id: id, 'inventory.reserved': { $gte: qty } },
      { $inc: { 'inventory.reserved': -qty } },
      { new: true }
    ).lean();
  },

  /**
   * Full-text search across name, description, and tags.
   */
  async search(query, { skip = 0, limit = 20 } = {}) {
    const filter = { $text: { $search: query }, isActive: true };
    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .lean(),
      Product.countDocuments(filter),
    ]);
    return { products, total };
  },
};

module.exports = ProductRepository;