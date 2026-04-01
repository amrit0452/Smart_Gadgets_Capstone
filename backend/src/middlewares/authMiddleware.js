const jwt = require("jsonwebtoken");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
  }
}

function requireRole(roles = []) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { message: "Forbidden" } });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };

