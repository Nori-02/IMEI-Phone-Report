import pkg from "pg";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const isPostgres = !!process.env.DATABASE_URL;

let db;

export async function initDB() {
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

export async function query(sql, params = []) {
  if (isPostgres) {
    const result = await db.query(sql, params);
    return result.rows;
  } else {
    const isSelect = sql.trim().toLowerCase().startsWith("select");
    return isSelect ? await db.all(sql, params) : await db.run(sql, params);
  }
}
