const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { getUserByEmail, createUser } = require("../models/storeModel");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

function signToken({ userId, role }) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await getUserByEmail(email);
  if (existing) return res.status(409).json({ success: false, error: { message: "Email already in use" } });

  const passwordHash = await bcrypt.hash(password, 10);
  await createUser({ name, email, passwordHash, role: "customer" });

  return res.status(201).json({ success: true, message: "Registered successfully" });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);
  if (!user) return res.status(401).json({ success: false, error: { message: "Invalid credentials" } });
  if (!user.is_active) return res.status(403).json({ success: false, error: { message: "Account disabled" } });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ success: false, error: { message: "Invalid credentials" } });

  const token = signToken({ userId: user.user_id, role: user.role });
  return res.status(200).json({ success: true, token, user: { userId: user.user_id, role: user.role } });
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  // Simulation: return success even if email not found (common UX).
  // If you prefer strict behavior, change contract here and adjust tests/docs.
  await getUserByEmail(email).catch(() => null);

  return res.status(200).json({ success: true, message: "If the email exists, a reset link has been sent" });
}

module.exports = { register, login, forgotPassword };

