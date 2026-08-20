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

const addUtcDays = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

async function ensureScheduledDoses(daysAhead = 30) {
  const db = env.DB;
  const startDate = today();
  const endDate = addUtcDays(startDate, daysAhead);
  const [medications, existingDoses] = await Promise.all([
    db.prepare("SELECT id, schedule_times FROM medications ORDER BY id").all<{ id: number; schedule_times: string }>(),
    db.prepare("SELECT medication_id, scheduled_date, scheduled_time FROM dose_logs WHERE scheduled_date BETWEEN ? AND ?")
      .bind(startDate, endDate)
      .all<{ medication_id: number; scheduled_date: string; scheduled_time: string }>(),
  ]);
  const existing = new Set(existingDoses.results.map((dose) => `${dose.medication_id}|${dose.scheduled_date}|${dose.scheduled_time}`));
  const inserts: D1PreparedStatement[] = [];

  for (const medication of medications.results) {
    const scheduleTimes = JSON.parse(medication.schedule_times) as string[];
    for (let offset = 0; offset <= daysAhead; offset += 1) {
      const scheduledDate = addUtcDays(startDate, offset);
      for (const scheduledTime of scheduleTimes) {
        const key = `${medication.id}|${scheduledDate}|${scheduledTime}`;
        if (existing.has(key)) continue;
        existing.add(key);
        inserts.push(db.prepare("INSERT INTO dose_logs (medication_id, scheduled_date, scheduled_time, status) VALUES (?, ?, ?, 'pending')")
          .bind(medication.id, scheduledDate, scheduledTime));
      }
    }
  }

  if (inserts.length) await db.batch(inserts);
}

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
  if (Number(count?.count ?? 0) === 0) {
    await db.batch([
      db.prepare("INSERT OR IGNORE INTO caregivers (id, name, email) VALUES (1, 'Maya', 'maya@example.com')"),
      db.prepare("INSERT OR IGNORE INTO seniors (id, name, caregiver_id, invite_code) VALUES (1, 'Evelyn', 1, 'EVELYN-STEADY')"),
      db.prepare("INSERT INTO medications (senior_id, name, dosage, schedule_times, instructions, requires_photo, color) VALUES (1, 'Lisinopril', '10 mg · 1 tablet', '[\"8:00 AM\"]', 'Take with a glass of water', 1, 'sage')"),
      db.prepare("INSERT INTO medications (senior_id, name, dosage, schedule_times, instructions, requires_photo, color) VALUES (1, 'Vitamin D3', '1,000 IU · 1 softgel', '[\"2:00 PM\"]', 'Take with food', 1, 'gold')"),
      db.prepare("INSERT INTO medications (senior_id, name, dosage, schedule_times, instructions, requires_photo, color) VALUES (1, 'Atorvastatin', '20 mg · 1 tablet', '[\"8:00 PM\"]', 'Take in the evening', 0, 'clay')"),
    ]);
  }

  // Keep a rolling month ready. Opening either dashboard extends the window,
  // so the demo continues to have a useful schedule without a paid cron job.
  await ensureScheduledDoses();
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
  const result = await env.DB.prepare(`SELECT d.*, m.name AS medication_name, m.dosage FROM dose_logs d JOIN medications m ON m.id = d.medication_id WHERE d.scheduled_date BETWEEN date('now', '-7 days') AND date('now') ORDER BY d.scheduled_date DESC, d.scheduled_time ASC`).all<Record<string, unknown>>();
  return result.results.map((row) => ({
    id: Number(row.id), medicationId: Number(row.medication_id), medicationName: String(row.medication_name), dosage: String(row.dosage),
    scheduledDate: String(row.scheduled_date), scheduledTime: String(row.scheduled_time), confirmedAt: row.confirmed_at ? String(row.confirmed_at) : null,
    photoKey: row.photo_key ? String(row.photo_key) : null, status: String(row.status) as DoseRecord["status"],
  })).sort((a, b) => {
    const dateOrder = b.scheduledDate.localeCompare(a.scheduledDate);
    if (dateOrder) return dateOrder;
    const minutes = (value: string) => {
      const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return Number.MAX_SAFE_INTEGER;
      const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
      return hour * 60 + Number(match[2]);
    };
    return minutes(a.scheduledTime) - minutes(b.scheduledTime);
  });
}
