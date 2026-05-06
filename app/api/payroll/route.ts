import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { PayrollRecord } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let sql = `
      SELECT pr.*, e.name AS employee_name
      FROM payroll_records pr
      JOIN employees e ON e.id = pr.employee_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (employeeId) {
      sql += " AND pr.employee_id = ?";
      params.push(employeeId);
    }
    if (month && year) {
      sql += " AND MONTH(pr.week_ending) = ? AND YEAR(pr.week_ending) = ?";
      params.push(month, year);
    }
    sql += " ORDER BY pr.week_ending DESC";

    const records = await query<PayrollRecord[]>(sql, params);

    // Fetch services for each record
    for (const record of records) {
      record.services = await query(
        "SELECT * FROM payroll_services WHERE payroll_id = ?",
        [record.id]
      );
    }

    return NextResponse.json(records);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const {
      employee_id,
      week_ending,
      week_label,
      base_pay,
      deductions,
      total_commission,
      gross_pay,
      net_pay,
      services,
    } = await req.json();

    // Upsert: if record for this employee+week exists, update it
    const existing = await query<PayrollRecord[]>(
      "SELECT id FROM payroll_records WHERE employee_id = ? AND week_ending = ?",
      [employee_id, week_ending]
    );

    let payrollId: number;

    if (existing.length > 0) {
      payrollId = existing[0].id;
      await query(
        `UPDATE payroll_records SET
          week_label=?, base_pay=?, deductions=?,
          total_commission=?, gross_pay=?, net_pay=?
         WHERE id=?`,
        [week_label, base_pay, deductions, total_commission, gross_pay, net_pay, payrollId]
      );
      await query("DELETE FROM payroll_services WHERE payroll_id = ?", [payrollId]);
    } else {
      const result = await query<{ insertId: number }>(
        `INSERT INTO payroll_records
          (employee_id, week_ending, week_label, base_pay, deductions, total_commission, gross_pay, net_pay)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [employee_id, week_ending, week_label, base_pay, deductions, total_commission, gross_pay, net_pay]
      );
      payrollId = result.insertId;
    }

    // Insert service lines
    if (services?.length) {
      for (const s of services) {
        await query(
          `INSERT INTO payroll_services (payroll_id, service_name, price, qty, commission_rate, commission_amount)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [payrollId, s.service_name, s.price, s.qty, s.commission_rate, s.commission_amount]
        );
      }
    }

    const [record] = await query<PayrollRecord[]>(
      `SELECT pr.*, e.name AS employee_name
       FROM payroll_records pr JOIN employees e ON e.id = pr.employee_id
       WHERE pr.id = ?`,
      [payrollId]
    );
    record.services = await query(
      "SELECT * FROM payroll_services WHERE payroll_id = ?",
      [payrollId]
    );

    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
