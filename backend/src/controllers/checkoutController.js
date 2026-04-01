const { getPool } = require("../models/db");

const {
  getCartSummary,
  getOrCreateCart,
  createOrder,
  createOrderItems,
  createPayment,
  clearCartItems,
} = require("../models/storeModel");

const { simulatePayment } = require("../services/paymentValidationService");
const stockService = require("../services/stockService");

function sanitizeAddress(body) {
  return {
    line1: body.line1,
    city: body.city,
    state: body.state,
    zip: body.zip,
    country: body.country,
  };
}

async function placeOrder(req, res) {
  const address = sanitizeAddress(req.body);
  const paymentMethod = req.body.paymentMethod;

  // 1) Payment validation first: prevents stock/order creation on failure.
  const paymentResult = simulatePayment({
    method: paymentMethod,
    cardNumber: req.body.cardNumber,
    expiry: req.body.expiry,
    cvv: req.body.cvv,
    upiId: req.body.upiId,
  });

  if (!paymentResult.ok) {
    return res.status(402).json({
      success: false,
      error: { message: "Payment failed", reason: paymentResult.reason, status: paymentResult.status },
    });
  }

  // 2) Load cart and totals
  const cart = await getCartSummary(req.user.userId);
  if (!cart.items.length) {
    return res.status(400).json({ success: false, error: { message: "Cart is empty" } });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 3) Stock validation + atomic decrement
    for (const it of cart.items) {
      const ok = await stockService.decrementStock(connection, it.productId, it.quantity);
      if (!ok) {
        await connection.rollback();
        return res.status(409).json({ success: false, error: { message: "Out of stock during checkout" } });
      }
    }

    const subtotal = cart.subtotal;
    const total = subtotal; // Keep simple; shipping/tax can be added later.

    const orderId = await createOrder(connection, {
      userId: req.user.userId,
      address,
      subtotal,
      total,
      paymentMethod,
      paymentStatus: "SUCCESS",
    });

    await createOrderItems(connection, orderId, cart.items.map((x) => ({
      productId: x.productId,
      quantity: x.quantity,
      unitPrice: x.unitPrice,
    })));

    await createPayment(connection, {
      orderId,
      method: paymentMethod,
      status: "SUCCESS",
      meta: {
        // Store non-sensitive identifiers for auditing
        last4: req.body.cardNumber ? req.body.cardNumber.toString().slice(-4) : null,
        upiId: req.body.upiId || null,
        validation: paymentResult,
      },
    });

    // Clear cart after a successful checkout so subsequent flows start clean.
    await clearCartItems(connection, req.user.userId);

    await connection.commit();
    return res.status(201).json({ success: true, message: "Order placed", orderId });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Checkout failed" } });
  } finally {
    connection.release();
  }
}

module.exports = { placeOrder };

