import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pkg from 'pg';

const express = require('express');
const path = require('path');

// يخدم الملفات الثابتة من مجلد "public"
(express()).use(express.static(path.join(__dirname, 'public')));

// يعيد ملف index.html عند زيارة الصفحة الرئيسية
(express()).get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

(express()).listen((process.env.PORT || 3000), () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// إعداد Express
(express()).use(express.json());
(express()).use(express.static(path.join(__dirname, 'public')));

// سياسة الأمان
(express()).use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';"
  );
  next();
});

// الاتصال بقاعدة البيانات
const isPostgres = !!process.env.DATABASE_URL;
let db;

async function initDB() {
  if (isPostgres) {
    const { Pool } = pkg;
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log("✅ PostgreSQL connected");
  } else {
    db = await open({
      filename: "./data.db",
      driver: sqlite3.Database
    });
    console.log("✅ SQLite connected");
  }
}

async function query(sql, params = []) {
  if (isPostgres) {
    const result = await db.query(sql, params);
    return result.rows;
  } else {
    const isSelect = sql.trim().toLowerCase().startsWith("select");
    return isSelect ? await db.all(sql, params) : await db.run(sql, params);
  }
}

// تهيئة قاعدة البيانات
await initDB(); // تهيئة الاتصال
await query("SELECT * FROM reports"); // تنفيذ استعلام
await closeDB(); // إغلاق الاتصال (اختياري)
const idType = isPostgres ? 'SERIAL' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
await query(`
  CREATE TABLE IF NOT EXISTS reports (
    id ${idType},
    imei TEXT NOT NULL,
    status TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    color TEXT,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// حماية JWT
function requireJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.isAdmin) return next();
    return res.status(403).json({ error: "Forbidden" });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// تسجيل دخول المشرف
(express()).post("/api/auth/login", async (req, res) => {
  const { password } = req.body || {};
  const stored = process.env.ADMIN_PASSWORD;

  const ok = password && crypto.timingSafeEqual(Buffer.from(password), Buffer.from(stored));
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ ok: true, token });
});

// إضافة بلاغ جديد
(express()).post('/api/report', async (req, res) => {
  const { imei, status, brand, model, color, location } = req.body;
  try {
    const insertQuery = isPostgres
      ? "INSERT INTO reports (imei, status, brand, model, color, location) VALUES ($1, $2, $3, $4, $5, $6)"
      : "INSERT INTO reports (imei, status, brand, model, color, location) VALUES (?, ?, ?, ?, ?, ?)";
    await query(insertQuery, [imei, status, brand, model, color, location]);
    res.json({ message: 'تمت الإضافة بنجاح.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// جلب جميع البلاغات (محمي)
(express()).get('/api/reports', requireJWT, async (req, res) => {
  try {
    const reports = await query("SELECT * FROM reports ORDER BY created_at DESC");
    res.json(reports);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// فحص حالة IMEI (علني)
(express()).get('/api/check', async (req, res) => {
  const imei = req.query.imei;
  if (!imei) return res.status(400).json({ error: "Missing IMEI" });

  try {
    const result = await query("SELECT * FROM reports WHERE imei = ? AND is_public = 1", [imei]);
    res.json({ count: result.length, reports: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// إعادة توجيه الصفحة الرئيسية
(express()).get('/', (req, res) => {
  res.redirect('/index.html');
});

// تشغيل الخادم
(express()).listen((process.env.PORT || 3000), () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
});
