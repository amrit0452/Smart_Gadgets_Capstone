const { getProductById } = require("../models/storeModel");

async function getById(req, res) {
  const productId = Number(req.params.id);
  if (!productId) return res.status(400).json({ success: false, error: { message: "Invalid product id" } });

  const product = await getProductById(productId);
  if (!product) return res.status(404).json({ success: false, error: { message: "Product not found" } });

  return res.status(200).json({ success: true, product });
}

module.exports = { getById };

