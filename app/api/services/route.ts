import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Service } from "@/lib/types";

export async function GET() {
  try {
    const services = await query<Service[]>(
      "SELECT * FROM services ORDER BY category, name"
    );
    return NextResponse.json(services);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, category, default_price, commission_rate } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const result = await query<{ insertId: number }>(
      "INSERT INTO services (name, category, default_price, commission_rate) VALUES (?, ?, ?, ?)",
      [name.trim(), category || "Hair", default_price ?? 300, commission_rate ?? 40]
    );
    const [service] = await query<Service[]>(
      "SELECT * FROM services WHERE id = ?",
      [result.insertId]
    );
    return NextResponse.json(service, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
