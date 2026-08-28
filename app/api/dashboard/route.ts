import { env } from "cloudflare:workers";
import { ensureDemoData, getDoses, getMedications, getProfile } from "../../../db/runtime";

type MedicationInput = {
  id?: number;
  name?: string;
  dosage?: string;
  times?: string[];
  instructions?: string;
  requiresPhoto?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  daysOfWeek?: number[];
  active?: boolean;
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function normalizeTime(value: string) {
  const twentyFourHour = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    return `${hour % 12 || 12}:${twentyFourHour[2]} ${hour >= 12 ? "PM" : "AM"}`;
  }
  const twelveHour = value.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (!twelveHour || Number(twelveHour[1]) > 12 || Number(twelveHour[1]) < 1) return null;
  return `${Number(twelveHour[1])}:${twelveHour[2]} ${twelveHour[3].toUpperCase()}`;
}

function validateMedication(body: MedicationInput) {
  const times = [...new Set((body.times ?? []).map(normalizeTime).filter((time): time is string => Boolean(time)))];
  const daysOfWeek = [...new Set(body.daysOfWeek ?? [])].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6).sort();
  const startDate = body.startDate || new Date().toISOString().slice(0, 10);
  const endDate = body.endDate || null;
  if (!body.name?.trim() || !body.dosage?.trim() || !times.length || !daysOfWeek.length) return { error: "Name, dosage, at least one time, and at least one day are required." } as const;
  if (!isoDate.test(startDate) || (endDate && !isoDate.test(endDate))) return { error: "Please provide valid schedule dates." } as const;
  if (endDate && endDate < startDate) return { error: "The end date must be on or after the start date." } as const;
  return { value: { name: body.name.trim(), dosage: body.dosage.trim(), times, daysOfWeek, startDate, endDate, instructions: body.instructions?.trim() ?? "", requiresPhoto: body.requiresPhoto !== false } } as const;
}

export async function GET() {
  try {
    await ensureDemoData();
    const [profile, medications, doses] = await Promise.all([getProfile(), getMedications(), getDoses()]);
    return Response.json({ ...profile, medications, doses });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load dashboard" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDemoData();
    const parsed = validateMedication(await request.json() as MedicationInput);
    if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
    const value = parsed.value;
    const inserted = await env.DB.prepare("INSERT INTO medications (senior_id, name, dosage, schedule_times, instructions, requires_photo, color, start_date, end_date, days_of_week, active) VALUES (1, ?, ?, ?, ?, ?, 'sage', ?, ?, ?, 1) RETURNING id")
      .bind(value.name, value.dosage, JSON.stringify(value.times), value.instructions, value.requiresPhoto ? 1 : 0, value.startDate, value.endDate, JSON.stringify(value.daysOfWeek)).first<{ id: number }>();
    await ensureDemoData();
    return Response.json({ ok: true, id: inserted?.id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to add medication" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureDemoData();
    const body = await request.json() as MedicationInput;
    if (!Number.isInteger(body.id) || Number(body.id) < 1) return Response.json({ error: "A valid medication is required." }, { status: 400 });

    if (typeof body.active === "boolean" && !body.name) {
      await env.DB.batch([
        env.DB.prepare("UPDATE medications SET active = ? WHERE id = ?").bind(body.active ? 1 : 0, body.id),
        env.DB.prepare("DELETE FROM dose_logs WHERE medication_id = ? AND status = 'pending' AND scheduled_date >= date('now')").bind(body.id),
      ]);
      await ensureDemoData();
      return Response.json({ ok: true });
    }

    const parsed = validateMedication(body);
    if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
    const value = parsed.value;
    await env.DB.batch([
      env.DB.prepare("UPDATE medications SET name = ?, dosage = ?, schedule_times = ?, instructions = ?, requires_photo = ?, start_date = ?, end_date = ?, days_of_week = ?, active = ? WHERE id = ?")
        .bind(value.name, value.dosage, JSON.stringify(value.times), value.instructions, value.requiresPhoto ? 1 : 0, value.startDate, value.endDate, JSON.stringify(value.daysOfWeek), body.active === false ? 0 : 1, body.id),
      env.DB.prepare("DELETE FROM dose_logs WHERE medication_id = ? AND status = 'pending' AND scheduled_date >= date('now')").bind(body.id),
    ]);
    await ensureDemoData();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update medication" }, { status: 500 });
  }
}
