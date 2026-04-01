const express = require("express");
const { body, param } = require("express-validator");

const router = express.Router();
const { requireAuth } = require("../middlewares/authMiddleware");
const { validateRequest } = require("../middlewares/validateRequest");
const { addItem, removeItem, updateQuantity, summary } = require("../controllers/cartController");

router.get("/summary", requireAuth, summary);

router.post(
  "/items",
  requireAuth,
  [
    body("productId").isInt({ min: 1 }).withMessage("productId must be a positive integer"),
    body("quantity").isInt({ min: 1, max: 9999 }).withMessage("quantity must be >= 1"),
  ],
  validateRequest,
  addItem
);

router.patch(
  "/items/:productId",
  requireAuth,
  [param("productId").isInt({ min: 1 }), body("quantity").isInt({ min: 0, max: 9999 })],
  validateRequest,
  updateQuantity
);

router.delete(
  "/items/:productId",
  requireAuth,
  [param("productId").isInt({ min: 1 })],
  validateRequest,
  removeItem
);

module.exports = router;

