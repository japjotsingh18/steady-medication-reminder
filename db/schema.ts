import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const caregivers = sqliteTable("caregivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const seniors = sqliteTable("seniors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  caregiverId: integer("caregiver_id").notNull(),
  inviteCode: text("invite_code").notNull(),
});

export const medications = sqliteTable("medications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  seniorId: integer("senior_id").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  scheduleTimes: text("schedule_times").notNull(),
  instructions: text("instructions").notNull().default(""),
  requiresPhoto: integer("requires_photo", { mode: "boolean" }).notNull().default(true),
  color: text("color").notNull().default("sage"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  daysOfWeek: text("days_of_week").notNull().default("[0,1,2,3,4,5,6]"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const doseLogs = sqliteTable("dose_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicationId: integer("medication_id").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  confirmedAt: text("confirmed_at"),
  photoKey: text("photo_key"),
  status: text("status", { enum: ["taken", "missed", "pending"] }).notNull(),
});
