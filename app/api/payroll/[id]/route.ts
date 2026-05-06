import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { PayrollRecord } from "@/lib/types";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const {
      week_ending,
      week_label,
      base_pay,
      deductions,
      total_commission,
      gross_pay,
      net_pay,
      services,
    } = await req.json();

    await query(
      `UPDATE payroll_records SET
        base_pay=?, deductions=?, total_commission=?, gross_pay=?, net_pay=?
       WHERE id=?`,
      [base_pay, deductions, total_commission, gross_pay, net_pay, params.id]
    );

    await query("DELETE FROM payroll_services WHERE payroll_id = ?", [params.id]);

    if (services?.length) {
      for (const s of services) {
        await query(
          `INSERT INTO payroll_services (payroll_id, service_name, price, qty, commission_rate, commission_amount)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [params.id, s.service_name, s.price, s.qty, s.commission_rate, s.commission_amount]
        );
      }
    }

    const [record] = await query<PayrollRecord[]>(
      `SELECT pr.*, e.name AS employee_name
       FROM payroll_records pr JOIN employees e ON e.id = pr.employee_id
       WHERE pr.id = ?`,
      [params.id]
    );
    record.services = await query(
      "SELECT * FROM payroll_services WHERE payroll_id = ?",
      [params.id]
    );

    return NextResponse.json(record);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await query("DELETE FROM payroll_records WHERE id = ?", [params.id]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
