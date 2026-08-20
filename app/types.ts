export type Medication = {
  id: number;
  seniorId: number;
  name: string;
  dosage: string;
  scheduleTimes: string[];
  instructions: string;
  requiresPhoto: boolean;
  color: string;
  startDate: string | null;
  endDate: string | null;
  daysOfWeek: number[];
  active: boolean;
};

export type Dose = {
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

export type DashboardData = {
  senior: { id: number; name: string; inviteCode: string };
  caregiver: { name: string };
  medications: Medication[];
  doses: Dose[];
};

const date = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

export const fallbackData: DashboardData = {
  senior: { id: 1, name: "Evelyn", inviteCode: "EVELYN-STEADY" },
  caregiver: { name: "Maya" },
  medications: [
    { id: 1, seniorId: 1, name: "Lisinopril", dosage: "10 mg · 1 tablet", scheduleTimes: ["8:00 AM"], instructions: "Take with a glass of water", requiresPhoto: true, color: "sage", startDate: date, endDate: null, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], active: true },
    { id: 2, seniorId: 1, name: "Vitamin D3", dosage: "1,000 IU · 1 softgel", scheduleTimes: ["2:00 PM"], instructions: "Take with food", requiresPhoto: true, color: "gold", startDate: date, endDate: null, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], active: true },
    { id: 3, seniorId: 1, name: "Atorvastatin", dosage: "20 mg · 1 tablet", scheduleTimes: ["8:00 PM"], instructions: "Take in the evening", requiresPhoto: false, color: "clay", startDate: date, endDate: null, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], active: true },
  ],
  doses: [
    { id: 1, medicationId: 1, medicationName: "Lisinopril", dosage: "10 mg · 1 tablet", scheduledDate: date, scheduledTime: "8:00 AM", confirmedAt: `${date}T08:07:00`, photoKey: null, status: "taken" },
    { id: 2, medicationId: 2, medicationName: "Vitamin D3", dosage: "1,000 IU · 1 softgel", scheduledDate: date, scheduledTime: "2:00 PM", confirmedAt: null, photoKey: null, status: "pending" },
    { id: 3, medicationId: 3, medicationName: "Atorvastatin", dosage: "20 mg · 1 tablet", scheduledDate: date, scheduledTime: "8:00 PM", confirmedAt: null, photoKey: null, status: "pending" },
    { id: 4, medicationId: 1, medicationName: "Lisinopril", dosage: "10 mg · 1 tablet", scheduledDate: yesterday, scheduledTime: "8:00 AM", confirmedAt: `${yesterday}T08:04:00`, photoKey: null, status: "taken" },
    { id: 5, medicationId: 2, medicationName: "Vitamin D3", dosage: "1,000 IU · 1 softgel", scheduledDate: yesterday, scheduledTime: "2:00 PM", confirmedAt: null, photoKey: null, status: "missed" },
    { id: 6, medicationId: 3, medicationName: "Atorvastatin", dosage: "20 mg · 1 tablet", scheduledDate: yesterday, scheduledTime: "8:00 PM", confirmedAt: `${yesterday}T20:12:00`, photoKey: null, status: "taken" },
  ],
};
