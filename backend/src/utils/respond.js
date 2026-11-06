/** One consistent JSON envelope for every success response. */
export function ok(res, data, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.json(body);
}

export function created(res, data, message) {
  return res.status(201).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
}

export function paginated(res, items, { page, limit, total }) {
  return res.json({
    success: true,
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
