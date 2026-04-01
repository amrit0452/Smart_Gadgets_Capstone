const express = require("express");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const { requireAuth } = require("../middlewares/authMiddleware");
const { validateRequest } = require("../middlewares/validateRequest");
const { placeOrder } = require("../controllers/checkoutController");

router.post(
  "/place",
  requireAuth,
  [
    body("line1").isString().isLength({ min: 2, max: 120 }).withMessage("line1 length invalid"),
    body("city").isString().isLength({ min: 2, max: 60 }).withMessage("city length invalid"),
    body("state").isString().isLength({ min: 2, max: 60 }).withMessage("state length invalid"),
    body("zip").isString().isLength({ min: 3, max: 12 }).withMessage("zip length invalid"),
    body("country").isString().isLength({ min: 2, max: 60 }).withMessage("country length invalid"),

    body("paymentMethod").isIn(["CREDIT", "DEBIT", "UPI"]).withMessage("paymentMethod invalid"),

    // Credit/Debit fields
    body("cardNumber").custom((v, { req }) => {
      if (req.body.paymentMethod === "CREDIT" || req.body.paymentMethod === "DEBIT") {
        if (!v) throw new Error("cardNumber is required");
      }
      return true;
    }),
    body("expiry").custom((v, { req }) => {
      if (req.body.paymentMethod === "CREDIT" || req.body.paymentMethod === "DEBIT") {
        if (!v) throw new Error("expiry is required");
      }
      return true;
    }),
    body("cvv").custom((v, { req }) => {
      if (req.body.paymentMethod === "CREDIT" || req.body.paymentMethod === "DEBIT") {
        if (!v) throw new Error("cvv is required");
      }
      return true;
    }),

    // UPI fields
    body("upiId").custom((v, { req }) => {
      if (req.body.paymentMethod === "UPI") {
        if (!v) throw new Error("upiId is required");
      }
      return true;
    }),
  ],
  validateRequest,
  placeOrder
);

module.exports = router;

