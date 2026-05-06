import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Employee } from "@/lib/types";

export async function GET() {
  try {
    const employees = await query<Employee[]>(
      "SELECT * FROM employees ORDER BY created_at ASC"
    );
    return NextResponse.json(employees);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, role, base_pay, commission_rate } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const result = await query<{ insertId: number }>(
      "INSERT INTO employees (name, role, base_pay, commission_rate) VALUES (?, ?, ?, ?)",
      [name.trim(), role || "", base_pay ?? 2500, commission_rate ?? 40]
    );
    const [employee] = await query<Employee[]>(
      "SELECT * FROM employees WHERE id = ?",
      [result.insertId]
    );
    return NextResponse.json(employee, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
