const { getCategories, listProducts } = require("../models/storeModel");

async function categories(req, res) {
  const rows = await getCategories();
  return res.status(200).json({ success: true, categories: rows });
}

async function products(req, res) {
  const q = req.query || {};

  const filters = {
    search: q.search || "",
    categoryId: q.category_id ? Number(q.category_id) : undefined,
    brand: q.brand || undefined,
    minPrice: q.minPrice !== undefined ? Number(q.minPrice) : undefined,
    maxPrice: q.maxPrice !== undefined ? Number(q.maxPrice) : undefined,
    minRating: q.minRating !== undefined ? Number(q.minRating) : undefined,
    availability: q.availability || undefined,
    sort: q.sort || "latest",
  };

  // Defensive: ignore NaN filters
  for (const k of ["minPrice", "maxPrice", "minRating"]) {
    if (filters[k] !== undefined && Number.isNaN(filters[k])) delete filters[k];
  }

  const rows = await listProducts(filters);
  return res.status(200).json({ success: true, products: rows, count: rows.length });
}

module.exports = { categories, products };

