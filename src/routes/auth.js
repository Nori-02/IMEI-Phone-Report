import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { password } = req.body || {};
  const stored = process.env.ADMIN_PASSWORD;

  const ok = password && crypto.timingSafeEqual(Buffer.from(password), Buffer.from(stored));
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ ok: true, token });
});

export default router;
