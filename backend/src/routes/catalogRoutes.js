const express = require("express");

const router = express.Router();
const { categories, products } = require("../controllers/catalogController");

router.get("/categories", categories);
router.get("/products", products);

module.exports = router;

