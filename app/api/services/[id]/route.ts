import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Service } from "@/lib/types";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, category, default_price, commission_rate, active } = await req.json();
    await query(
      "UPDATE services SET name=?, category=?, default_price=?, commission_rate=?, active=? WHERE id=?",
      [name, category, default_price, commission_rate, active ? 1 : 0, params.id]
    );
    const [service] = await query<Service[]>(
      "SELECT * FROM services WHERE id = ?",
      [params.id]
    );
    return NextResponse.json(service);
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
    await query("DELETE FROM services WHERE id = ?", [params.id]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
