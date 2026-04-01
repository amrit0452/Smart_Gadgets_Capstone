const { getPool } = require("../models/db");

const {
  listOrdersByUser,
  getOrderByIdForUser,
  restoreStockForOrder,
  updateOrderStatusAndPayment,
} = require("../models/storeModel");

async function list(req, res) {
  const rows = await listOrdersByUser(req.user.userId);
  return res.status(200).json({ success: true, orders: rows });
}

async function getById(req, res) {
  const orderId = Number(req.params.id);
  const order = await getOrderByIdForUser(req.user.userId, orderId);
  if (!order) return res.status(404).json({ success: false, error: { message: "Order not found" } });
  return res.status(200).json({ success: true, order });
}

async function cancelOrder(req, res) {
  const orderId = Number(req.params.id);
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT order_status, payment_status FROM orders WHERE order_id = ? AND user_id = ? LIMIT 1",
      [orderId, req.user.userId]
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: "Order not found" } });
    }

    const { order_status: orderStatus, payment_status: paymentStatus } = rows[0];

    if (orderStatus === "CANCELLED") {
      await connection.rollback();
      return res.status(200).json({ success: true, message: "Order already cancelled" });
    }
    if (orderStatus !== "CREATED") {
      await connection.rollback();
      return res.status(409).json({ success: false, error: { message: "Order not cancellable" } });
    }

    // Restore stock and simulate refund.
    await restoreStockForOrder(connection, orderId);
    await updateOrderStatusAndPayment(connection, {
      orderId,
      newOrderStatus: "CANCELLED",
      newPaymentStatus: "REFUNDED",
    });

    await connection.commit();
    return res.status(200).json({ success: true, message: "Order cancelled" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Cancel failed" } });
  } finally {
    connection.release();
  }
}

async function returnOrder(req, res) {
  const orderId = Number(req.params.id);
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT order_status, payment_status FROM orders WHERE order_id = ? AND user_id = ? LIMIT 1",
      [orderId, req.user.userId]
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: "Order not found" } });
    }

    const { order_status: orderStatus, payment_status: paymentStatus } = rows[0];

    if (orderStatus === "RETURNED") {
      await connection.rollback();
      return res.status(200).json({ success: true, message: "Order already returned" });
    }
    if (orderStatus !== "DELIVERED") {
      await connection.rollback();
      return res.status(409).json({ success: false, error: { message: "Order not return eligible" } });
    }

    // Restore stock and simulate refund.
    await restoreStockForOrder(connection, orderId);
    await updateOrderStatusAndPayment(connection, {
      orderId,
      newOrderStatus: "RETURNED",
      newPaymentStatus: "REFUNDED",
    });

    await connection.commit();
    return res.status(200).json({ success: true, message: "Return processed" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Return failed" } });
  } finally {
    connection.release();
  }
}

module.exports = { list, getById, cancelOrder, returnOrder };

