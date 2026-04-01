const express = require("express");
const { body, param } = require("express-validator");

const router = express.Router();
const { requireAuth } = require("../middlewares/authMiddleware");
const { validateRequest } = require("../middlewares/validateRequest");
const reviewsController = require("../controllers/reviewsController");

router.post(
  "/:productId",
  requireAuth,
  [
    param("productId").isInt({ min: 1 }),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be 1-5"),
    body("reviewText").isString().isLength({ min: 1, max: 500 }).withMessage("reviewText required"),
  ],
  validateRequest,
  reviewsController.upsert
);

router.patch(
  "/:productId",
  requireAuth,
  [
    param("productId").isInt({ min: 1 }),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be 1-5"),
    body("reviewText").isString().isLength({ min: 1, max: 500 }).withMessage("reviewText required"),
  ],
  validateRequest,
  reviewsController.upsert
);

router.delete(
  "/:productId",
  requireAuth,
  [param("productId").isInt({ min: 1 })],
  validateRequest,
  reviewsController.del
);

module.exports = router;

