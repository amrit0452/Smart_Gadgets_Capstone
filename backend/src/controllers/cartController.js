const { validationResult } = require("express-validator");

const { getPool } = require("../models/db");
const {
  getProductStockById,
  getOrCreateCart,
  getCartItem,
  upsertCartItem,
  removeCartItem,
  getCartSummary,
} = require("../models/storeModel");

async function addItem(req, res) {
  const { productId, quantity } = req.body;
  const qty = Number(quantity);
  const pid = Number(productId);
  if (!pid || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ success: false, error: { message: "Invalid quantity/productId" } });
  }

  const pool = getPool();
  const product = await getProductStockById(pid);
  if (!product) return res.status(404).json({ success: false, error: { message: "Product not found" } });
  if (product.stock_quantity <= 0 || product.is_available !== 1) {
    return res.status(409).json({ success: false, error: { message: "Product out of stock" } });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const cartId = await getOrCreateCart(connection, req.user.userId);
    const existing = await getCartItem(connection, cartId, pid);
    const existingQty = existing ? Number(existing.quantity) : 0;

    const newQty = existingQty + qty;
    if (newQty > product.stock_quantity) {
      await connection.rollback();
      return res.status(409).json({ success: false, error: { message: "Requested quantity exceeds stock" } });
    }

    // Snapshot unit price for existing items.
    const unitPrice = existing ? existing.unit_price : Number(product.price);
    await upsertCartItem(connection, {
      cartId,
      productId: pid,
      quantity: newQty,
      unitPrice,
    });

    await connection.commit();
    return res.status(200).json({ success: true, message: "Cart updated" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Cart update failed" } });
  } finally {
    connection.release();
  }
}

async function removeItem(req, res) {
  const productId = Number(req.params.productId);
  if (!productId) return res.status(400).json({ success: false, error: { message: "Invalid productId" } });

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const cartId = await getOrCreateCart(connection, req.user.userId);
    await removeCartItem(connection, { cartId, productId });
    await connection.commit();
    return res.status(200).json({ success: true, message: "Item removed" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Remove failed" } });
  } finally {
    connection.release();
  }
}

async function updateQuantity(req, res) {
  const productId = Number(req.params.productId);
  const qty = Number(req.body.quantity);
  if (!productId || !Number.isFinite(qty)) {
    return res.status(400).json({ success: false, error: { message: "Invalid productId/quantity" } });
  }

  const pool = getPool();
  const product = await getProductStockById(productId);
  if (!product) return res.status(404).json({ success: false, error: { message: "Product not found" } });
  if (product.stock_quantity <= 0 || product.is_available !== 1) {
    return res.status(409).json({ success: false, error: { message: "Product out of stock" } });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const cartId = await getOrCreateCart(connection, req.user.userId);

    if (qty === 0) {
      await removeCartItem(connection, { cartId, productId });
      await connection.commit();
      return res.status(200).json({ success: true, message: "Item removed" });
    }

    if (qty > product.stock_quantity) {
      await connection.rollback();
      return res.status(409).json({ success: false, error: { message: "Requested quantity exceeds stock" } });
    }

    const existing = await getCartItem(connection, cartId, productId);
    const unitPrice = existing ? existing.unit_price : Number(product.price);
    await upsertCartItem(connection, { cartId, productId, quantity: qty, unitPrice });

    await connection.commit();
    return res.status(200).json({ success: true, message: "Quantity updated" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Update failed" } });
  } finally {
    connection.release();
  }
}

async function summary(req, res) {
  const data = await getCartSummary(req.user.userId);
  return res.status(200).json({ success: true, ...data, total: data.subtotal });
}

module.exports = { addItem, removeItem, updateQuantity, summary };

