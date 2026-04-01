const express = require("express");
const { body } = require("express-validator");

const { register, login, forgotPassword } = require("../controllers/authController");
const { validateRequest } = require("express-validator");
const { validateRequest: validateReq } = require("../middlewares/validateRequest");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").isString().isLength({ min: 1, max: 60 }).withMessage("Name is required"),
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .isString()
      .isLength({ min: 8, max: 100 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
      .withMessage("Password must include upper/lowercase and a number"),
  ],
  validateReq,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password").isString().notEmpty().withMessage("Password is required"),
  ],
  validateReq,
  login
);

router.post(
  "/forgot",
  [body("email").isEmail().withMessage("Email must be valid")],
  validateReq,
  forgotPassword
);

module.exports = router;

