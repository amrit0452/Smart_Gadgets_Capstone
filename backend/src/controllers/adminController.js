const { getPool } = require("../models/db");

const {
  createProduct,
  updateProduct,
  deleteProduct,
  listOrdersAdmin,
  getOrderForAdmin,
  restoreStockForOrder,
  updateOrderStatusAndPayment,
  listUsersAdmin,
  setUserActive,
  revenueReport,
} = require("../models/storeModel");

async function createProductHandler(req, res) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const id = await createProduct(connection, {
      categoryId: Number(req.body.categoryId),
      name: req.body.name,
      brand: req.body.brand,
      description: req.body.description || "",
      price: Number(req.body.price),
      stockQuantity: Number(req.body.stockQuantity),
      isAvailable: Number(req.body.isAvailable) === 1,
      imageUrls: req.body.imageUrls || [],
    });
    await connection.commit();
    return res.status(201).json({ success: true, productId: id });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Product creation failed" } });
  } finally {
    connection.release();
  }
}

async function updateProductHandler(req, res) {
  const productId = Number(req.params.id);
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await updateProduct(connection, productId, {
      categoryId: Number(req.body.categoryId),
      name: req.body.name,
      brand: req.body.brand,
      description: req.body.description || "",
      price: Number(req.body.price),
      stockQuantity: Number(req.body.stockQuantity),
      isAvailable: Number(req.body.isAvailable) === 1,
      imageUrls: req.body.imageUrls || [],
    });
    await connection.commit();
    return res.status(200).json({ success: true, message: "Product updated" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Product update failed" } });
  } finally {
    connection.release();
  }
}

async function deleteProductHandler(req, res) {
  const productId = Number(req.params.id);
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await deleteProduct(connection, productId);
    await connection.commit();
    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Product delete failed" } });
  } finally {
    connection.release();
  }
}

async function listOrders(req, res) {
  const rows = await listOrdersAdmin();
  return res.status(200).json({ success: true, orders: rows });
}

async function cancelOrderAdmin(req, res) {
  const orderId = Number(req.params.id);
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query("SELECT order_status FROM orders WHERE order_id = ? LIMIT 1", [orderId]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: "Order not found" } });
    }
    const orderStatus = rows[0].order_status;

    if (orderStatus === "CANCELLED") {
      await connection.rollback();
      return res.status(200).json({ success: true, message: "Already cancelled" });
    }
    if (orderStatus !== "CREATED") {
      await connection.rollback();
      return res.status(409).json({ success: false, error: { message: "Order not cancellable" } });
    }

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
    return res.status(500).json({ success: false, error: { message: "Admin cancel failed" } });
  } finally {
    connection.release();
  }
}

async function markDelivered(req, res) {
  const orderId = Number(req.params.id);
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT order_status FROM orders WHERE order_id = ? LIMIT 1",
      [orderId]
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: "Order not found" } });
    }
    const current = rows[0].order_status;
    if (current !== "CREATED") {
      await connection.rollback();
      return res.status(409).json({ success: false, error: { message: "Order not deliverable" } });
    }
    await connection.query("UPDATE orders SET order_status = 'DELIVERED' WHERE order_id = ?", [orderId]);
    await connection.commit();
    return res.status(200).json({ success: true, message: "Order marked as delivered" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Mark delivered failed" } });
  } finally {
    connection.release();
  }
}

async function returnOrderAdmin(req, res) {
  const orderId = Number(req.params.id);
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query("SELECT order_status FROM orders WHERE order_id = ? LIMIT 1", [
      orderId,
    ]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: "Order not found" } });
    }
    const orderStatus = rows[0].order_status;
    if (orderStatus === "RETURNED") {
      await connection.rollback();
      return res.status(200).json({ success: true, message: "Already returned" });
    }
    if (orderStatus !== "DELIVERED") {
      await connection.rollback();
      return res.status(409).json({ success: false, error: { message: "Order not return eligible" } });
    }

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
    return res.status(500).json({ success: false, error: { message: "Admin return failed" } });
  } finally {
    connection.release();
  }
}

async function listUsers(req, res) {
  const rows = await listUsersAdmin();
  return res.status(200).json({ success: true, users: rows });
}

async function setUserActiveHandler(req, res) {
  const userId = Number(req.params.id);
  const isActive = Number(req.body.isActive) === 1;
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await setUserActive(connection, userId, isActive);
    await connection.commit();
    return res.status(200).json({ success: true, message: "User updated" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "User update failed" } });
  } finally {
    connection.release();
  }
}

async function revenue(req, res) {
  const { fromDate, toDate } = req.query || {};
  const rows = await revenueReport({ fromDate: fromDate || null, toDate: toDate || null });
  return res.status(200).json({ success: true, revenue: rows });
}

module.exports = {
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  listOrders,
  cancelOrderAdmin,
  markDelivered,
  returnOrderAdmin,
  listUsers,
  setUserActiveHandler,
  revenue,
};

