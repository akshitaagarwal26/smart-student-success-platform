
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const sslConfig =
  process.env.DB_SSL === "true"
    ? {
        ca: process.env.DB_SSL_CA
          ? process.env.DB_SSL_CA.replace(/\\n/g, "\n")
          : fs.readFileSync(
              path.join(__dirname, "../certs/isrgrootx1.pem"),
              "utf8"
            ),
        rejectUnauthorized: true
      }
    : undefined;

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_student_success",
  ssl: sslConfig,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log("MySQL Database Connected Successfully!");
    connection.release();
  } catch (error) {
    console.error("MySQL Connection Failed:", error.message);
  }
}

module.exports = { db, testConnection };
