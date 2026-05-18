'use strict';

const CategoryRepository = require('../repositories/category.repository');
const CacheService = require('./cache.service');
const AppError = require('../errors/AppError');
const logger = require('../config/logger');

const CategoryService = {
  async list() {
    const cached = await CacheService.getCategories();
    if (cached) return cached;

    const categories = await CategoryRepository.findAll();
    await CacheService.setCategories(categories);
    return categories;
  },

  async getById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    return category;
  },

  async create(data) {
    const existing = await CategoryRepository.findBySlug(
      require('../utils/slugify')(data.name)
    );
    if (existing) throw new AppError('Category name already exists', 409, 'CATEGORY_EXISTS');

    const category = await CategoryRepository.create(data);
    await CacheService.invalidateCategories();
    logger.info('Category created', { id: category._id, name: category.name });
    return category;
  },

  async update(id, data) {
    const category = await CategoryRepository.update(id, data);
    if (!category) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    await CacheService.invalidateCategories();
    return category;
  },

  async remove(id) {
    const productCount = await CategoryRepository.countProducts(id);
    if (productCount > 0)
      throw new AppError(
        `Cannot delete category with ${productCount} active products`,
        409, 'CATEGORY_HAS_PRODUCTS'
      );

    const category = await CategoryRepository.softDelete(id);
    if (!category) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    await CacheService.invalidateCategories();
    logger.info('Category soft-deleted', { id });
  },
};

module.exports = CategoryService;