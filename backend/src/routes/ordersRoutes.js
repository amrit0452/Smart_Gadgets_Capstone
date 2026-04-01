const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/authMiddleware");
const { validateRequest } = require("../middlewares/validateRequest");
const { list, getById, cancelOrder, returnOrder } = require("../controllers/ordersController");
const { param } = require("express-validator");

router.get("/", requireAuth, list);
router.get("/:id", requireAuth, getById);

router.post(
  "/:id/cancel",
  requireAuth,
  [param("id").isInt({ min: 1 })],
  validateRequest,
  cancelOrder
);

router.post(
  "/:id/return",
  requireAuth,
  [param("id").isInt({ min: 1 })],
  validateRequest,
  returnOrder
);

module.exports = router;

