// Run with: node scripts/init-db.js
// This creates all tables and seeds default data

require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");

async function init() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  const db = process.env.DB_NAME || "salon_payroll";

  console.log(`Creating database '${db}' if not exists...`);
  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${db}\``);
  await conn.execute(`USE \`${db}\``);

  console.log("Creating tables...");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(100) DEFAULT '',
      base_pay DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
      commission_rate DECIMAL(5,2) NOT NULL DEFAULT 40.00,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) DEFAULT 'Hair',
      default_price DECIMAL(10,2) NOT NULL DEFAULT 300.00,
      commission_rate DECIMAL(5,2) NOT NULL DEFAULT 40.00,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS payroll_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      week_ending DATE NOT NULL,
      week_label VARCHAR(100) NOT NULL,
      base_pay DECIMAL(10,2) NOT NULL,
      deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
      gross_pay DECIMAL(10,2) NOT NULL,
      net_pay DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE KEY unique_week_employee (employee_id, week_ending)
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS payroll_services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payroll_id INT NOT NULL,
      service_name VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      qty INT NOT NULL DEFAULT 0,
      commission_rate DECIMAL(5,2) NOT NULL,
      commission_amount DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (payroll_id) REFERENCES payroll_records(id) ON DELETE CASCADE
    )
  `);

  // Seed employees
  const [empRows] = await conn.execute("SELECT COUNT(*) as cnt FROM employees");
  if (empRows[0].cnt === 0) {
    console.log("Seeding default employees...");
    await conn.execute(
      "INSERT INTO employees (name, role, base_pay, commission_rate) VALUES (?, ?, ?, ?), (?, ?, ?, ?)",
      ["Alex", "Senior Stylist", 2500, 40, "Sam", "Stylist", 2500, 40]
    );
  }

  // Seed services
  const [svcRows] = await conn.execute("SELECT COUNT(*) as cnt FROM services");
  if (svcRows[0].cnt === 0) {
    console.log("Seeding default services...");
    await conn.execute(
      `INSERT INTO services (name, category, default_price, commission_rate) VALUES
       ('Haircut', 'Hair', 300, 40),
       ('Hair Color', 'Hair', 1500, 40),
       ('Styling', 'Hair', 800, 40)`
    );
  }

  await conn.end();
  console.log("✅ Database initialized successfully!");
  console.log(`   Database: ${db}`);
  console.log("   Tables: employees, services, payroll_records, payroll_services");
}

init().catch((err) => {
  console.error("❌ Init failed:", err.message);
  process.exit(1);
});
