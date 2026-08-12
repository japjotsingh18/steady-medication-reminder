"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, ChevronRight, Clock3, HeartHandshake, RotateCcw, Volume2, X } from "lucide-react";
import { useDashboard } from "./hooks";
import { Dose } from "./types";
import { saveLocalPhoto } from "./local-photos";

type Step = "home" | "review" | "success";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timingLabel(dose: Dose, now: Date | null) {
  if (!now) return "Scheduled";
  const match = dose.scheduledTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "Scheduled";
  const [year, month, day] = dose.scheduledDate.split("-").map(Number);
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  const scheduled = new Date(year, month - 1, day, hour, Number(match[2]));
  const minutesUntil = (scheduled.getTime() - now.getTime()) / 60_000;
  if (minutesUntil > 30) return "Next dose";
  if (minutesUntil < -30) return "Overdue";
  return "Due now";
}

export function SeniorHome() {
  const { data, setData, loading } = useDashboard();
  const [step, setStep] = useState<Step>("home");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const todayDoses = data.doses.filter((dose) => dose.scheduledDate === today).slice(0, 3);
  const nextDose = todayDoses.find((dose) => dose.status === "pending") ?? todayDoses[todayDoses.length - 1];
  const nextMedication = data.medications.find((medication) => medication.id === nextDose?.medicationId);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(new Date()), 250);
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  function speakReminder() {
    if (!nextDose || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`It is time for ${nextDose.medicationName}. ${nextDose.dosage}. ${nextMedication?.instructions ?? ""}`));
  }

  function beginConfirmation() {
    if (!nextDose) return;
    if (nextMedication?.requiresPhoto) fileRef.current?.click();
    else void confirmDose(null);
  }

  function onPhotoSelected(file?: File) {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setStep("review");
  }

  async function confirmDose(selectedPhoto: File | null) {
    if (!nextDose) return;
    setSaving(true);
    const form = new FormData();
    form.append("doseId", String(nextDose.id));
    if (selectedPhoto) await saveLocalPhoto(nextDose.id, selectedPhoto).catch(() => undefined);
    try { await fetch("/api/doses/confirm", { method: "POST", body: form }); } catch { /* demo remains usable offline */ }
    setData((current) => ({ ...current, doses: current.doses.map((dose) => dose.id === nextDose.id ? { ...dose, status: "taken", confirmedAt: new Date().toISOString(), photoKey: selectedPhoto ? `local:${dose.id}` : dose.photoKey } : dose) }));
    setSaving(false);
    setStep("success");
  }

  if (step === "review") {
    return (
      <main className="senior-shell capture-step">
        <header className="step-header"><button className="icon-button" onClick={() => setStep("home")} aria-label="Cancel photo"><X aria-hidden="true" /></button><span>Photo check</span><span className="header-spacer" /></header>
        <section className="capture-content" aria-labelledby="photo-title">
          <div className="eyebrow"><Camera size={20} aria-hidden="true" /> One quick check</div>
          <h1 id="photo-title">Does this photo look clear?</h1>
          {/* User-captured object URLs cannot be served through the image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img className="photo-preview" src={preview} alt="Your medication confirmation" />}
          <p>Make sure your pill or medicine container can be seen.</p>
        </section>
        <div className="capture-actions">
          <button className="primary-button" onClick={() => void confirmDose(photo)} disabled={saving}><Check aria-hidden="true" />{saving ? "Saving…" : "Yes, use this photo"}</button>
          <button className="secondary-button" onClick={() => fileRef.current?.click()}><RotateCcw aria-hidden="true" />Take another photo</button>
        </div>
        <input ref={fileRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={(event) => onPhotoSelected(event.target.files?.[0])} />
      </main>
    );
  }

  if (step === "success") {
    return (
      <main className="senior-shell success-step">
        <div className="success-mark"><Check aria-hidden="true" /></div>
        <p className="eyebrow">All set</p>
        <h1>Nice work, {data.senior.name}.</h1>
        <p>Your {nextDose?.medicationName} was marked as taken.</p>
        <button className="primary-button" onClick={() => { setStep("home"); setPhoto(null); setPreview(null); }}>Done</button>
      </main>
    );
  }

  return (
    <main className="senior-shell senior-home-shell">
      <header className="senior-header">
        <Link href="/" className="brand" aria-label="Steady home"><span className="brand-mark">S</span><span>Steady</span></Link>
        <Link href="/caregiver" className="caregiver-link"><HeartHandshake aria-hidden="true" />Caregiver view</Link>
      </header>

      <section className="greeting"><p>{now ? greetingForHour(now.getHours()) : "Hello"}, {data.senior.name}</p><h1>{loading ? "Getting today ready…" : nextDose?.status === "pending" ? timingLabel(nextDose, now) === "Next dose" ? "Here’s what comes next." : "It’s time for your medicine." : "You’re all caught up."}</h1></section>

      {nextDose && <section className="next-card" aria-labelledby="next-medication">
        <div className={`next-time timing-${timingLabel(nextDose, now).toLowerCase().replace(" ", "-")}`}><span className="pulse-dot" aria-hidden="true" />{timingLabel(nextDose, now)} · {nextDose.scheduledTime}</div>
        <div className={`pill-illustration ${nextMedication?.color ?? "sage"}`} aria-hidden="true"><span /></div>
        <h2 id="next-medication">{nextDose.medicationName}</h2>
        <p className="dosage">{nextDose.dosage}</p>
        <p className="instruction">{nextMedication?.instructions}</p>
        <button className="listen-button" onClick={speakReminder}><Volume2 aria-hidden="true" />Read this aloud</button>
        <button className="primary-button took-button" onClick={beginConfirmation} disabled={nextDose.status === "taken"}><Check aria-hidden="true" />{nextDose.status === "taken" ? "Taken" : "I took it"}</button>
        <input ref={fileRef} className="visually-hidden" type="file" accept="image/*" capture="environment" aria-label="Take a medication confirmation photo" onChange={(event) => onPhotoSelected(event.target.files?.[0])} />
        {nextMedication?.requiresPhoto && nextDose.status !== "taken" && <p className="camera-note"><Camera aria-hidden="true" />You’ll take a quick photo next · kept on this device</p>}
      </section>}

      <section className="today-section" aria-labelledby="today-title">
        <div className="section-heading"><div><p className="eyebrow">Your day</p><h2 id="today-title">Today’s medicines</h2></div><span>{todayDoses.filter((dose) => dose.status === "taken").length} of {todayDoses.length} taken</span></div>
        <div className="schedule-list">{todayDoses.map((dose) => <ScheduleRow key={dose.id} dose={dose} />)}</div>
      </section>

      <footer className="senior-footer"><Clock3 aria-hidden="true" /><p>Steady will always show you what comes next.</p></footer>
    </main>
  );
}

function ScheduleRow({ dose }: { dose: Dose }) {
  return <div className={`schedule-row status-${dose.status}`}><span className="status-icon" aria-label={dose.status === "taken" ? "Taken" : "Not taken yet"}>{dose.status === "taken" ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}</span><div><strong>{dose.scheduledTime}</strong><span>{dose.medicationName}</span></div><span className="row-status">{dose.status === "taken" ? "Taken" : "Later"}</span><ChevronRight aria-hidden="true" /></div>;
}
