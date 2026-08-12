import { env } from "cloudflare:workers";

export type MedicationRecord = {
  id: number;
  seniorId: number;
  name: string;
  dosage: string;
  scheduleTimes: string[];
  instructions: string;
  requiresPhoto: boolean;
  color: string;
};

export type DoseRecord = {
  id: number;
  medicationId: number;
  medicationName: string;
  dosage: string;
  scheduledDate: string;
  scheduledTime: string;
  confirmedAt: string | null;
  photoKey: string | null;
  status: "taken" | "missed" | "pending";
};

const today = () => new Date().toISOString().slice(0, 10);

export async function ensureDemoData() {
  const db = env.DB;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS caregivers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS seniors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, caregiver_id INTEGER NOT NULL, invite_code TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS medications (id INTEGER PRIMARY KEY AUTOINCREMENT, senior_id INTEGER NOT NULL, name TEXT NOT NULL, dosage TEXT NOT NULL, schedule_times TEXT NOT NULL, instructions TEXT NOT NULL DEFAULT '', requires_photo INTEGER NOT NULL DEFAULT 1, color TEXT NOT NULL DEFAULT 'sage')"),
    db.prepare("CREATE TABLE IF NOT EXISTS dose_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, medication_id INTEGER NOT NULL, scheduled_date TEXT NOT NULL, scheduled_time TEXT NOT NULL, confirmed_at TEXT, photo_key TEXT, status TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS dose_logs_date_idx ON dose_logs (scheduled_date, scheduled_time)"),
  ]);

  const count = await db.prepare("SELECT COUNT(*) AS count FROM medications").first<{ count: number }>();
  if (Number(count?.count ?? 0) > 0) return;

  await db.batch([
    db.prepare("INSERT INTO caregivers (id, name, email) VALUES (1, 'Maya', 'maya@example.com')"),
    db.prepare("INSERT INTO seniors (id, name, caregiver_id, invite_code) VALUES (1, 'Evelyn', 1, 'EVELYN-STEADY')"),
    db.prepare("INSERT INTO medications (id, senior_id, name, dosage, schedule_times, instructions, requires_photo, color) VALUES (1, 1, 'Lisinopril', '10 mg · 1 tablet', '[\"8:00 AM\"]', 'Take with a glass of water', 1, 'sage')"),
    db.prepare("INSERT INTO medications (id, senior_id, name, dosage, schedule_times, instructions, requires_photo, color) VALUES (2, 1, 'Vitamin D3', '1,000 IU · 1 softgel', '[\"2:00 PM\"]', 'Take with food', 1, 'gold')"),
    db.prepare("INSERT INTO medications (id, senior_id, name, dosage, schedule_times, instructions, requires_photo, color) VALUES (3, 1, 'Atorvastatin', '20 mg · 1 tablet', '[\"8:00 PM\"]', 'Take in the evening', 0, 'clay')"),
    db.prepare("INSERT INTO dose_logs (medication_id, scheduled_date, scheduled_time, confirmed_at, status) VALUES (1, ?, '8:00 AM', ?, 'taken')").bind(today(), `${today()}T08:07:00`),
    db.prepare("INSERT INTO dose_logs (medication_id, scheduled_date, scheduled_time, status) VALUES (2, ?, '2:00 PM', 'pending')").bind(today()),
    db.prepare("INSERT INTO dose_logs (medication_id, scheduled_date, scheduled_time, status) VALUES (3, ?, '8:00 PM', 'pending')").bind(today()),
    db.prepare("INSERT INTO dose_logs (medication_id, scheduled_date, scheduled_time, confirmed_at, status) VALUES (1, date(?, '-1 day'), '8:00 AM', datetime(?, '-1 day', '+8 hours', '+4 minutes'), 'taken')").bind(today(), today()),
    db.prepare("INSERT INTO dose_logs (medication_id, scheduled_date, scheduled_time, status) VALUES (2, date(?, '-1 day'), '2:00 PM', 'missed')").bind(today()),
    db.prepare("INSERT INTO dose_logs (medication_id, scheduled_date, scheduled_time, confirmed_at, status) VALUES (3, date(?, '-1 day'), '8:00 PM', datetime(?, '-1 day', '+20 hours', '+12 minutes'), 'taken')").bind(today(), today()),
  ]);
}

export async function getMedications(): Promise<MedicationRecord[]> {
  const result = await env.DB.prepare("SELECT * FROM medications ORDER BY id").all<Record<string, unknown>>();
  return result.results.map((row) => ({
    id: Number(row.id),
    seniorId: Number(row.senior_id),
    name: String(row.name),
    dosage: String(row.dosage),
    scheduleTimes: JSON.parse(String(row.schedule_times)),
    instructions: String(row.instructions),
    requiresPhoto: Boolean(row.requires_photo),
    color: String(row.color),
  }));
}

export async function getDoses(): Promise<DoseRecord[]> {
  const result = await env.DB.prepare(`SELECT d.*, m.name AS medication_name, m.dosage FROM dose_logs d JOIN medications m ON m.id = d.medication_id ORDER BY d.scheduled_date DESC, d.scheduled_time ASC`).all<Record<string, unknown>>();
  return result.results.map((row) => ({
    id: Number(row.id), medicationId: Number(row.medication_id), medicationName: String(row.medication_name), dosage: String(row.dosage),
    scheduledDate: String(row.scheduled_date), scheduledTime: String(row.scheduled_time), confirmedAt: row.confirmed_at ? String(row.confirmed_at) : null,
    photoKey: row.photo_key ? String(row.photo_key) : null, status: String(row.status) as DoseRecord["status"],
  }));
}
