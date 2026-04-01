const express = require("express");
const { body, param, query } = require("express-validator");

const router = express.Router();

const { requireAuth, requireRole } = require("../middlewares/authMiddleware");
const { validateRequest } = require("../middlewares/validateRequest");
const adminController = require("../controllers/adminController");

router.use(requireAuth, requireRole(["admin"]));

router.post(
  "/products",
  [
    body("categoryId").isInt({ min: 1 }),
    body("name").isString().isLength({ min: 1, max: 140 }),
    body("brand").isString().isLength({ min: 1, max: 80 }),
    body("description").optional().isString().isLength({ max: 2000 }),
    body("price").isFloat({ min: 0.01 }),
    body("stockQuantity").isInt({ min: 0, max: 100000 }),
    body("isAvailable").isInt({ min: 0, max: 1 }),
    body("imageUrls").optional().isArray(),
  ],
  validateRequest,
  adminController.createProductHandler
);

router.put(
  "/products/:id",
  [
    param("id").isInt({ min: 1 }),
    body("categoryId").isInt({ min: 1 }),
    body("name").isString().isLength({ min: 1, max: 140 }),
    body("brand").isString().isLength({ min: 1, max: 80 }),
    body("description").optional().isString().isLength({ max: 2000 }),
    body("price").isFloat({ min: 0.01 }),
    body("stockQuantity").isInt({ min: 0, max: 100000 }),
    body("isAvailable").isInt({ min: 0, max: 1 }),
    body("imageUrls").optional().isArray(),
  ],
  validateRequest,
  adminController.updateProductHandler
);

router.delete(
  "/products/:id",
  [param("id").isInt({ min: 1 })],
  validateRequest,
  adminController.deleteProductHandler
);

router.get("/orders", adminController.listOrders);
router.post("/orders/:id/cancel", [param("id").isInt({ min: 1 })], validateRequest, adminController.cancelOrderAdmin);
router.post("/orders/:id/return", [param("id").isInt({ min: 1 })], validateRequest, adminController.returnOrderAdmin);
router.post("/orders/:id/mark-delivered", [param("id").isInt({ min: 1 })], validateRequest, adminController.markDelivered);

router.get("/users", adminController.listUsers);
router.patch("/users/:id", [param("id").isInt({ min: 1 }), body("isActive").isInt({ min: 0, max: 1 })], validateRequest, adminController.setUserActiveHandler);

router.get(
  "/revenue",
  [
    query("fromDate").optional().isISO8601(),
    query("toDate").optional().isISO8601(),
  ],
  validateRequest,
  adminController.revenue
);

module.exports = router;

