# 📱 IMEI Phone Report

A web application for reporting lost or stolen phones using the IMEI number, with an admin dashboard, dual-language support, instant notifications, and JWT protection.

---

## 🚀 Features

- Submit lost/stolen reports via a simple interface
- Check device status using the IMEI number
- Support for Arabic and English
- Instant notifications for admins via BroadcastChannel
- Report details page on click
- Admin dashboard with live search
- Secure login using JWT
- PostgreSQL or SQLite database

---

## 📁 Project Structure

IMEI-Phone-Report/ ├── public/ ← Front-end files ├── src/ ← Server files (Express) ├── .env.example ← Required environment variables ├── package.json ← Project settings

---

## ⚙️ Run locally

```bash
npm install
cp .env.example .env # Then modify the values ​​inside it
npm run dev # Run the server during development


### 🗃️ Database

Automatically connects to PostgreSQL when a `DATABASE_URL` is available, or to SQLite locally when it is not.

- Connection file: `src/db.js`
- Available functions:
- `initDB()` – Initializes the connection
- `query(sql, params)` – Executes a unified query
- `closeDB()` – Closes the connection (optional)
