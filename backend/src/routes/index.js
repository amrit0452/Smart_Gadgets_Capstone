const express = require("express");

const authRoutes = require("./authRoutes");
const catalogRoutes = require("./catalogRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const checkoutRoutes = require("./checkoutRoutes");
const ordersRoutes = require("./ordersRoutes");
const reviewsRoutes = require("./reviewsRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", ordersRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/admin", adminRoutes);

module.exports = router;

