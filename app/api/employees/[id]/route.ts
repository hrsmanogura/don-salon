import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Employee } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [employee] = await query<Employee[]>(
      "SELECT * FROM employees WHERE id = ?",
      [params.id]
    );
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(employee);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, role, base_pay, commission_rate, active } = await req.json();
    await query(
      "UPDATE employees SET name=?, role=?, base_pay=?, commission_rate=?, active=? WHERE id=?",
      [name, role || "", base_pay, commission_rate, active ? 1 : 0, params.id]
    );
    const [employee] = await query<Employee[]>(
      "SELECT * FROM employees WHERE id = ?",
      [params.id]
    );
    return NextResponse.json(employee);
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
    await query("DELETE FROM employees WHERE id = ?", [params.id]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
