'use strict';

const ProductRepository = require('../repositories/product.repository');
const CategoryRepository = require('../repositories/category.repository');
const CacheService = require('./cache.service');
const AppError = require('../errors/AppError');
const { paginate, paginatedResponse } = require('../utils/pagination');
const logger = require('../config/logger');

const buildFilter = ({ category, minPrice, maxPrice, tags, isFeatured, isActive = true }) => {
  const filter = { isActive };
  if (category)             filter.category = category;
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = minPrice;
    if (maxPrice != null) filter.price.$lte = maxPrice;
  }
  if (tags?.length)         filter.tags = { $in: tags };
  if (isFeatured != null)   filter.isFeatured = isFeatured;
  return filter;
};

const buildSort = (sortBy) => {
  const map = {
    price_asc:  { price: 1  },
    price_desc: { price: -1 },
    newest:     { createdAt: -1 },
    oldest:     { createdAt: 1  },
    name_asc:   { name: 1   },
  };
  return map[sortBy] || { createdAt: -1 };
};

const ProductService = {
  async list(query = {}) {
    const { skip, limit, page } = paginate(query);
    const filter = buildFilter(query);
    const sort   = buildSort(query.sortBy);
    const { products, total } = await ProductRepository.findAll({ filter, skip, limit, sort });
    return paginatedResponse(products, total, { page, limit });
  },

  async search(queryStr, query = {}) {
    if (!queryStr?.trim()) throw new AppError('Search query is required', 400, 'MISSING_QUERY');
    const { skip, limit, page } = paginate(query);
    const { products, total } = await ProductRepository.search(queryStr, { skip, limit });
    return paginatedResponse(products, total, { page, limit });
  },

  async getById(id) {
    const cached = await CacheService.getProduct(id);
    if (cached) return cached;
    const product = await ProductRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    await CacheService.setProduct(id, product);
    return product;
  },

  async getBySlug(slug) {
    const cached = await CacheService.getProductBySlug(slug);
    if (cached) return cached;
    const product = await ProductRepository.findBySlug(slug);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    await CacheService.setProductBySlug(slug, product);
    return product;
  },

  async create(data) {
    // Verify category exists
    const category = await CategoryRepository.findById(data.category);
    if (!category) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    if (!category.isActive) throw new AppError('Category is inactive', 422, 'CATEGORY_INACTIVE');

    // Prevent duplicate SKU
    if (data.sku) {
      const existing = await ProductRepository.findBySku(data.sku);
      if (existing) throw new AppError('SKU already in use', 409, 'SKU_EXISTS');
    }

    const product = await ProductRepository.create(data);
    await CacheService.invalidateProduct(product._id.toString());
    logger.info('Product created', { id: product._id, name: product.name });
    return product;
  },

  async update(id, data) {
    // Verify new category if being changed
    if (data.category) {
      const category = await CategoryRepository.findById(data.category);
      if (!category) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const product = await ProductRepository.update(id, data);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    await CacheService.invalidateProduct(id);
    logger.info('Product updated', { id });
    return product;
  },

  async remove(id) {
    const product = await ProductRepository.softDelete(id);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    await CacheService.invalidateProduct(id);
    logger.info('Product soft-deleted', { id });
  },

  // ── Inventory operations — called by order-service events ─────────────────

  async reserveStock(productId, qty) {
    const product = await ProductRepository.reserveStock(productId, qty);
    if (!product)
      throw new AppError(`Insufficient stock for product ${productId}`, 422, 'INSUFFICIENT_STOCK');
    await CacheService.invalidateProduct(productId);
    return product;
  },

  async releaseStock(productId, qty) {
    const product = await ProductRepository.releaseStock(productId, qty);
    if (!product)
      throw new AppError(`Could not release stock for product ${productId}`, 500, 'RELEASE_STOCK_ERROR');
    await CacheService.invalidateProduct(productId);
    return product;
  },

  async updateStock(id, quantity) {
    const product = await ProductRepository.update(id, { 'inventory.quantity': quantity });
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    await CacheService.invalidateProduct(id);
    logger.info('Stock updated', { id, quantity });
    return product;
  },
};

module.exports = ProductService;