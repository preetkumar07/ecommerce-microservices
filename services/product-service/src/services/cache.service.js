'use strict';

const redis = require('../config/redis');
const config = require('../config/env');

const TTL = config.redis.cacheTtl;

const keys = {
  product:    (id)   => `product:${id}`,
  productSlug:(slug) => `product:slug:${slug}`,
  products:   ()     => 'products:list:*',
  category:   (id)   => `category:${id}`,
  categories: ()     => 'categories:*',
};

const CacheService = {
  getProduct:    (id)   => redis.get(keys.product(id)),
  setProduct:    (id, v) => redis.set(keys.product(id), v, TTL),
  getProductBySlug: (slug) => redis.get(keys.productSlug(slug)),
  setProductBySlug: (slug, v) => redis.set(keys.productSlug(slug), v, TTL),

  getCategories: ()    => redis.get('categories:all'),
  setCategories: (v)   => redis.set('categories:all', v, TTL * 2), // categories change rarely

  /** Bust all product-list and single-product caches when a product is mutated. */
  async invalidateProduct(id) {
    await Promise.all([
      redis.del(keys.product(id)),
      redis.delPattern('products:list:*'),
      redis.delPattern('cache:product-service:*'),
    ]);
  },

  async invalidateCategories() {
    await redis.delPattern('categories:*');
    await redis.delPattern('cache:product-service:*');
  },
};

module.exports = CacheService;