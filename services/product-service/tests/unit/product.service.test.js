'use strict';

process.env.NODE_ENV = 'test';

const ProductService    = require('../../src/services/product.service');
const ProductRepository = require('../../src/repositories/product.repository');
const CategoryRepository= require('../../src/repositories/category.repository');
const CacheService      = require('../../src/services/cache.service');

jest.mock('../../src/repositories/product.repository');
jest.mock('../../src/repositories/category.repository');
jest.mock('../../src/services/cache.service');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const mockCategory = { _id: 'cat1', name: 'Electronics', isActive: true };
const mockProduct  = { _id: 'p1', name: 'Widget', price: 9.99, category: mockCategory, inventory: { quantity: 50, reserved: 0 } };

beforeEach(() => {
  jest.clearAllMocks();
  CacheService.getProduct.mockResolvedValue(null);
  CacheService.getProductBySlug.mockResolvedValue(null);
  CacheService.setProduct.mockResolvedValue(null);
  CacheService.invalidateProduct.mockResolvedValue(null);
});

describe('ProductService.getById', () => {
  it('returns product from DB on cache miss', async () => {
    ProductRepository.findById.mockResolvedValue(mockProduct);
    const result = await ProductService.getById('p1');
    expect(result).toEqual(mockProduct);
    expect(CacheService.setProduct).toHaveBeenCalledWith('p1', mockProduct);
  });

  it('returns from cache on cache hit', async () => {
    CacheService.getProduct.mockResolvedValue(mockProduct);
    const result = await ProductService.getById('p1');
    expect(result).toEqual(mockProduct);
    expect(ProductRepository.findById).not.toHaveBeenCalled();
  });

  it('throws 404 when not found', async () => {
    ProductRepository.findById.mockResolvedValue(null);
    await expect(ProductService.getById('p999'))
      .rejects.toMatchObject({ statusCode: 404, code: 'PRODUCT_NOT_FOUND' });
  });
});

describe('ProductService.create', () => {
  it('creates product and invalidates cache', async () => {
    CategoryRepository.findById.mockResolvedValue(mockCategory);
    ProductRepository.findBySku.mockResolvedValue(null);
    ProductRepository.create.mockResolvedValue(mockProduct);

    const result = await ProductService.create({ name: 'Widget', price: 9.99, category: 'cat1' });
    expect(result).toEqual(mockProduct);
    expect(CacheService.invalidateProduct).toHaveBeenCalled();
  });

  it('throws 404 when category does not exist', async () => {
    CategoryRepository.findById.mockResolvedValue(null);
    await expect(ProductService.create({ name: 'X', price: 1, category: 'bad' }))
      .rejects.toMatchObject({ statusCode: 404, code: 'CATEGORY_NOT_FOUND' });
  });

  it('throws 409 on duplicate SKU', async () => {
    CategoryRepository.findById.mockResolvedValue(mockCategory);
    ProductRepository.findBySku.mockResolvedValue(mockProduct);
    await expect(ProductService.create({ name: 'X', price: 1, category: 'cat1', sku: 'TAKEN' }))
      .rejects.toMatchObject({ statusCode: 409, code: 'SKU_EXISTS' });
  });
});

describe('ProductService.reserveStock', () => {
  it('reserves stock successfully', async () => {
    ProductRepository.reserveStock.mockResolvedValue({ ...mockProduct, inventory: { reserved: 5 } });
    const result = await ProductService.reserveStock('p1', 5);
    expect(result.inventory.reserved).toBe(5);
  });

  it('throws 422 on insufficient stock', async () => {
    ProductRepository.reserveStock.mockResolvedValue(null);
    await expect(ProductService.reserveStock('p1', 999))
      .rejects.toMatchObject({ statusCode: 422, code: 'INSUFFICIENT_STOCK' });
  });
});

describe('ProductService.list', () => {
  it('returns paginated results', async () => {
    ProductRepository.findAll.mockResolvedValue({ products: [mockProduct], total: 1 });
    const result = await ProductService.list({ page: '1', limit: '10' });
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });
});