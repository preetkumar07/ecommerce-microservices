'use strict';

const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const categorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    slug:        { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 500 },
    parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive:    { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Auto-generate slug from name before saving
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) this.slug = slugify(this.name);
  next();
});

categorySchema.index({ parent: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);