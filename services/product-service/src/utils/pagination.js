'use strict';

/**
 * Build a Mongoose-compatible pagination object from query params.
 * @param {{ page?: string, limit?: string }} query
 * @returns {{ skip: number, limit: number, page: number }}
 */
const paginate = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page  || '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  return { skip: (page - 1) * limit, limit, page };
};

/**
 * Build the standard paginated response envelope.
 */
const paginatedResponse = (data, total, { page, limit }) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});

module.exports = { paginate, paginatedResponse };