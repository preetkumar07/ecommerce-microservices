'use strict';

const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const inventorySchema = new mongoose.Schema(
  {
    quantity: { type: Number, required: true, min: 0, default: 0 },
    reserved: { type: Number, required: true, min: 0, default: 0 },
    // available = quantity - reserved (virtual)
  },
  { _id: false }
);

inventorySchema.virtual('available').get(function () {
  return Math.max(0, this.quantity - this.reserved);
});

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, maxlength: 200, index: true },
    slug:        { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 5000 },
    price:       { type: Number, required: true, min: 0 },
    comparePrice:{ type: Number, min: 0, default: null },   // original price for "sale" display
    sku:         { type: String, trim: true, unique: true, sparse: true },
    category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images:      [{ url: String, alt: String }],
    attributes:  { type: mongoose.Schema.Types.Mixed, default: {} }, // flexible per category
    tags:        [{ type: String, trim: true, lowercase: true }],
    inventory:   { type: inventorySchema, default: () => ({ quantity: 0, reserved: 0 }) },
    isActive:    { type: Boolean, default: true, index: true },
    isFeatured:  { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto slug from name
productSchema.pre('save', function (next) {
  if (this.isModified('name')) this.slug = slugify(this.name);
  next();
});

// Compound indexes for the most common read patterns
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ tags: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // full-text search

module.exports = mongoose.model('Product', productSchema);