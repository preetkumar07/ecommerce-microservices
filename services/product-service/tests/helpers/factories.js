'use strict';

const Category = require('../../src/models/category.model');
const Product  = require('../../src/models/product.model');

let n = 0;
const uid = () => ++n;

const createCategory = (overrides = {}) =>
  Category.create({ name: `Category ${uid()}`, description: 'Test category', ...overrides });

const createProduct = async (overrides = {}) => {
  let category = overrides.category;
  if (!category) {
    const cat = await createCategory();
    category = cat._id;
  }
  return Product.create({
    name: `Product ${uid()}`,
    price: 9.99,
    category,
    inventory: { quantity: 100, reserved: 0 },
    ...overrides,
  });
};

module.exports = { createCategory, createProduct };