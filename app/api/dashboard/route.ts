import { env } from "cloudflare:workers";
import { ensureDemoData, getDoses, getMedications } from "../../../db/runtime";

export async function GET() {
  try {
    await ensureDemoData();
    const [medications, doses] = await Promise.all([getMedications(), getDoses()]);
    return Response.json({ senior: { id: 1, name: "Evelyn", inviteCode: "EVELYN-STEADY" }, caregiver: { name: "Maya" }, medications, doses });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load dashboard" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDemoData();
    const body = await request.json() as { name?: string; dosage?: string; times?: string[]; instructions?: string; requiresPhoto?: boolean };
    if (!body.name?.trim() || !body.dosage?.trim() || !body.times?.length) return Response.json({ error: "Name, dosage, and a time are required." }, { status: 400 });
    const inserted = await env.DB.prepare("INSERT INTO medications (senior_id, name, dosage, schedule_times, instructions, requires_photo, color) VALUES (1, ?, ?, ?, ?, ?, 'sage') RETURNING id")
      .bind(body.name.trim(), body.dosage.trim(), JSON.stringify(body.times), body.instructions?.trim() ?? "", body.requiresPhoto === false ? 0 : 1).first<{ id: number }>();
    const date = new Date().toISOString().slice(0, 10);
    await env.DB.batch(body.times.map((time) => env.DB.prepare("INSERT INTO dose_logs (medication_id, scheduled_date, scheduled_time, status) VALUES (?, ?, ?, 'pending')").bind(inserted!.id, date, time)));
    return Response.json({ ok: true, id: inserted?.id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to add medication" }, { status: 500 });
  }
}
