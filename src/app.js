import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { initDB, query } from "./db/index.js";
import authRoutes from "./routes/auth.js";
import { requireJWT } from "./middleware/requireJWT.js";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';"
  );
  next();
});

// تهيئة قاعدة البيانات
await initDB();
const isPostgres = !!process.env.DATABASE_URL;
const idType = isPostgres ? "SERIAL" : "INTEGER PRIMARY KEY AUTOINCREMENT";
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

// تسجيل الدخول
app.use("/api/auth", authRoutes);

// إضافة تقرير جديد
app.post("/api/report", async (req, res) => {
  const { imei, status, brand, model, color, location } = req.body;
  try {
    const insertQuery = isPostgres
      ? "INSERT INTO reports (imei, status, brand, model, color, location) VALUES ($1, $2, $3, $4, $5, $6)"
      : "INSERT INTO reports (imei, status, brand, model, color, location) VALUES (?, ?, ?, ?, ?, ?)";
    await query(insertQuery, [imei, status, brand, model, color, location]);
    res.json({ message: "تمت الإضافة بنجاح." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// جلب جميع التقارير (محمي بـ JWT)
app.get("/api/reports", requireJWT, async (req, res) => {
  try {
    const reports = await query("SELECT * FROM reports ORDER BY created_at DESC");
    res.json(reports);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// الصفحة الرئيسية (اختياري)
app.get("/", (req, res) => {
  res.send("IMEI Report API");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
