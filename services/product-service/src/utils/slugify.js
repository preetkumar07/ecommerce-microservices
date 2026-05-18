'use strict';

/**
 * Convert a string to a URL-safe slug.
 * e.g. "Apple iPhone 15 Pro" → "apple-iphone-15-pro"
 */
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

module.exports = slugify;