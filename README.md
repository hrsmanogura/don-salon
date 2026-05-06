# ✂️ Salon Payroll — Next.js + MySQL

Full-stack salon payroll system built with **Next.js 14 App Router** + **MySQL**.

---

## 🗂 Project Structure

```
salon-payroll/
├── app/
│   ├── api/
│   │   ├── employees/        # GET, POST /api/employees
│   │   │   └── [id]/         # GET, PUT, DELETE /api/employees/:id
│   │   ├── services/         # GET, POST /api/services
│   │   │   └── [id]/         # PUT, DELETE /api/services/:id
│   │   └── payroll/          # GET (filter by employee/month), POST
│   │       └── [id]/         # PUT, DELETE /api/payroll/:id
│   ├── employees/page.tsx    # Employee management UI
│   ├── services/page.tsx     # Service catalog UI
│   ├── page.tsx              # Payroll entry + history UI
│   ├── AppShell.tsx          # Tab navigation shell
│   ├── layout.tsx            # Root layout
│   └── globals.css
├── components/
│   └── ui.tsx                # Shared UI components
├── lib/
│   ├── db.ts                 # MySQL connection pool
│   └── types.ts              # TypeScript interfaces
├── scripts/
│   └── init-db.js            # DB initialization script
├── .env.local.example
└── package.json
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your MySQL connection
```bash
cp .env.local.example .env.local
```
Edit `.env.local`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=salon_payroll
```

### 3. Initialize the database
```bash
npm run db:init
```
This creates the database, all tables, and seeds default employees (Alex, Sam) and services (Haircut, Hair Color, Styling).

### 4. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🗃 Database Schema

```sql
employees
  id, name, role, base_pay, commission_rate, active, created_at

services
  id, name, category, default_price, commission_rate, active, created_at

payroll_records
  id, employee_id (FK), week_ending, week_label,
  base_pay, deductions, total_commission, gross_pay, net_pay, created_at

payroll_services
  id, payroll_id (FK), service_name, price, qty, commission_rate, commission_amount
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Add employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| GET | `/api/services` | List all services |
| POST | `/api/services` | Add service |
| PUT | `/api/services/:id` | Update service |
| DELETE | `/api/services/:id` | Delete service |
| GET | `/api/payroll?employee_id=&month=&year=` | List payroll records |
| POST | `/api/payroll` | Save/upsert payroll week |
| PUT | `/api/payroll/:id` | Edit payroll record |
| DELETE | `/api/payroll/:id` | Delete payroll record |

---

## 🛠 Tech Stack

- **Next.js 14** (App Router, server components + client components)
- **TypeScript**
- **Tailwind CSS**
- **MySQL2** (connection pool)
- **SheetJS (xlsx)** for Excel export

---

## 📦 Production Build

```bash
npm run build
npm start
```
