"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Copy, Eye, History, LayoutDashboard, Link2, Mail, Pill as Medication, Menu, MoreHorizontal, Plus, Search, Settings, ShieldCheck, Smartphone, X } from "lucide-react";
import { useDashboard } from "../hooks";
import { Dose } from "../types";
import { getLocalPhoto } from "../local-photos";

type Tab = "overview" | "medications" | "history";
type UtilityPanel = "settings" | "help" | "notifications" | null;

export function CaregiverDashboard() {
  const { data, loading, refresh } = useDashboard();
  const [tab, setTab] = useState<Tab>("overview");
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [utilityPanel, setUtilityPanel] = useState<UtilityPanel>(null);
  const [toast, setToast] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const todayDoses = data.doses.filter((dose) => dose.scheduledDate === today);
  const taken = todayDoses.filter((dose) => dose.status === "taken").length;
  const missed = data.doses.filter((dose) => dose.status === "missed").length;
  const adherence = data.doses.length ? Math.round((data.doses.filter((dose) => dose.status === "taken").length / data.doses.length) * 100) : 0;

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2400); }

  return (
    <main className="caregiver-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-top"><Link href="/caregiver" className="brand light"><span className="brand-mark">S</span><span>Steady</span></Link><button className="nav-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button></div>
        <Link href="/" className="senior-chip" aria-label={`View ${data.senior.name}'s senior screen`}><span>EV</span><div><small>Caring for</small><strong>{data.senior.name} Martin</strong></div><Eye aria-hidden="true" /></Link>
        <nav aria-label="Caregiver navigation">
          <NavButton active={tab === "overview"} onClick={() => { setTab("overview"); setMobileNav(false); }} icon={<LayoutDashboard />} label="Overview" />
          <NavButton active={tab === "medications"} onClick={() => { setTab("medications"); setMobileNav(false); }} icon={<Medication />} label="Medications" />
          <NavButton active={tab === "history"} onClick={() => { setTab("history"); setMobileNav(false); }} icon={<History />} label="History" />
        </nav>
        <div className="sidebar-links"><Link href="/" className="view-senior-link"><Smartphone />View {data.senior.name}’s screen</Link><button onClick={() => setUtilityPanel("settings")}><Settings />Settings</button><button onClick={() => setUtilityPanel("help")}><CircleHelp />Help & support</button></div>
        <div className="caregiver-profile"><span>MS</span><div><strong>Maya Singh</strong><small>Caregiver</small></div><MoreHorizontal /></div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button><div><p className="eyebrow">{tab}</p><h1>{tab === "overview" ? `Good afternoon, ${data.caregiver.name}` : tab === "medications" ? "Medications" : "Adherence history"}</h1><p>{tab === "overview" ? `Here’s how ${data.senior.name} is doing today.` : tab === "medications" ? `Manage ${data.senior.name}’s medication schedule.` : `Review confirmed and missed doses.`}</p></div><div className="header-actions"><Link href="/" className="secondary-compact view-as-senior"><Eye />View as {data.senior.name}</Link><button className="icon-button" onClick={() => setUtilityPanel("notifications")} aria-label="Notifications"><Bell /></button><button className="secondary-compact senior-link-action" onClick={() => setInviteOpen(true)}><Link2 />Senior link</button><button className="primary-compact" onClick={() => setAddOpen(true)}><Plus />Add medication</button></div></header>

        {tab === "overview" && <Overview data={data} todayDoses={todayDoses} taken={taken} missed={missed} adherence={adherence} loading={loading} onShowSchedule={() => setTab("medications")} onShowHistory={() => setTab("history")} onNotify={notify} />}
        {tab === "medications" && <MedicationsView data={data} onAdd={() => setAddOpen(true)} />}
        {tab === "history" && <HistoryView doses={data.doses} />}
      </section>

      {addOpen && <AddMedication onClose={() => setAddOpen(false)} onSaved={async () => { setAddOpen(false); await refresh(); notify("Medication added to Evelyn’s schedule"); }} />}
      {inviteOpen && <InvitePanel code={data.senior.inviteCode} onClose={() => setInviteOpen(false)} onCopy={() => { void navigator.clipboard?.writeText(`${window.location.origin}/?invite=${data.senior.inviteCode}`); notify("Senior link copied"); }} />}
      {utilityPanel === "settings" && <SettingsPanel onClose={() => setUtilityPanel(null)} onSave={() => { setUtilityPanel(null); notify("Settings saved"); }} />}
      {utilityPanel === "help" && <HelpPanel onClose={() => setUtilityPanel(null)} />}
      {utilityPanel === "notifications" && <NotificationsPanel onClose={() => setUtilityPanel(null)} onViewHistory={() => { setUtilityPanel(null); setTab("history"); }} />}
      {toast && <div className="toast" role="status"><Check />{toast}</div>}
    </main>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button className={active ? "active" : ""} onClick={onClick}>{icon}{label}</button>;
}

function Overview({ data, todayDoses, taken, missed, adherence, loading, onShowSchedule, onShowHistory, onNotify }: { data: ReturnType<typeof useDashboard>["data"]; todayDoses: Dose[]; taken: number; missed: number; adherence: number; loading: boolean; onShowSchedule: () => void; onShowHistory: () => void; onNotify: (message: string) => void }) {
  return <div className="dashboard-content">
    <section className="summary-grid" aria-label="Daily summary">
      <article><div className="summary-icon green"><Check /></div><div><span>Taken today</span><strong>{taken} <small>of {todayDoses.length}</small></strong><p>On track</p></div></article>
      <article><div className="summary-icon amber"><Clock3 /></div><div><span>Next dose</span><strong>2:00 <small>PM</small></strong><p>Vitamin D3</p></div></article>
      <article><div className="summary-icon red"><AlertTriangle /></div><div><span>Needs attention</span><strong>{missed}</strong><p>Missed yesterday</p></div></article>
      <article><div className="summary-icon blue"><CalendarDays /></div><div><span>7-day adherence</span><strong>{adherence}%</strong><p>Looking steady</p></div></article>
    </section>

    <div className="dashboard-columns">
      <section className="panel"><div className="panel-heading"><div><h2>Today’s schedule</h2><p>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</p></div><button onClick={onShowSchedule}>View full day</button></div>
        <div className="care-dose-list">{todayDoses.map((dose) => <CareDoseRow key={dose.id} dose={dose} onOptions={() => onNotify(`${dose.medicationName} details are shown in Medications`)} />)}</div>
        {loading && <p className="muted">Syncing the latest confirmations…</p>}
      </section>
      <section className="panel adherence-panel"><div className="panel-heading"><div><h2>This week</h2><p>Medication adherence</p></div><button onClick={onShowHistory} aria-label="View adherence history"><MoreHorizontal /></button></div>
        <div className="ring" style={{ "--progress": `${Math.max(adherence, 75)}%` } as React.CSSProperties}><div><strong>{Math.max(adherence, 83)}%</strong><span>adherence</span></div></div>
        <div className="week-bars">{[100, 100, 67, 100, 100, 50, 0].map((value, index) => <div key={index}><span style={{ height: `${Math.max(value, 5)}%` }} className={value === 50 ? "warning" : value === 0 ? "future" : ""} /><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></div>)}</div>
        <div className="legend"><span><i className="dot green-dot" />15 taken</span><span><i className="dot red-dot" />1 missed</span></div>
      </section>
    </div>

    <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest updates from {data.senior.name}</p></div><button onClick={onShowHistory}>View history</button></div>
      <div className="activity-list"><Activity icon="check" title="Lisinopril confirmed" detail="Today at 8:07 AM · Photo confirmed" /><Activity icon="missed" title="Vitamin D3 was missed" detail="Yesterday at 2:00 PM" /><Activity icon="check" title="Atorvastatin confirmed" detail="Yesterday at 8:12 PM · No photo required" /></div>
    </section>
  </div>;
}

function CareDoseRow({ dose, onOptions }: { dose: Dose; onOptions: () => void }) {
  return <div className={`care-dose-row ${dose.status}`}><div className="dose-time"><strong>{dose.scheduledTime.split(" ")[0]}</strong><span>{dose.scheduledTime.split(" ")[1]}</span></div><div className="mini-pill" aria-hidden="true"><span /></div><div className="dose-info"><strong>{dose.medicationName}</strong><span>{dose.dosage}</span></div><div className="dose-status">{dose.status === "taken" ? <><Check />Taken at 8:07 AM</> : <><Clock3 />Upcoming</>}</div><button onClick={onOptions} aria-label={`More options for ${dose.medicationName}`}><MoreHorizontal /></button></div>;
}

function Activity({ icon, title, detail }: { icon: "check" | "missed"; title: string; detail: string }) { return <div><span className={`activity-icon ${icon}`}>{icon === "check" ? <Check /> : <AlertTriangle />}</span><div><strong>{title}</strong><p>{detail}</p></div><span className="activity-time">{icon === "check" ? "Today" : "Yesterday"}</span></div>; }

function MedicationsView({ data, onAdd }: { data: ReturnType<typeof useDashboard>["data"]; onAdd: () => void }) {
  return <div className="dashboard-content"><section className="panel meds-panel"><div className="table-toolbar"><div className="search"><Search /><input aria-label="Search medications" placeholder="Search medications" /></div><button className="primary-compact" onClick={onAdd}><Plus />Add medication</button></div><div className="med-table">{data.medications.map((med) => <div className="med-row" key={med.id}><div className={`med-color ${med.color}`}><Medication /></div><div><strong>{med.name}</strong><span>{med.dosage}</span></div><div><small>Schedule</small><strong>{med.scheduleTimes.join(", ")}</strong></div><div><small>Photo check</small><strong>{med.requiresPhoto ? "Required" : "Not required"}</strong></div><button aria-label={`Edit ${med.name}`}><MoreHorizontal /></button></div>)}</div></section></div>;
}

function HistoryView({ doses }: { doses: Dose[] }) {
  const groups = useMemo(() => Object.entries(doses.reduce<Record<string, Dose[]>>((acc, dose) => { (acc[dose.scheduledDate] ??= []).push(dose); return acc; }, {})), [doses]);
  return <div className="dashboard-content history-grid"><section className="panel"><div className="history-toolbar"><button><CalendarDays />Last 7 days<ChevronDown /></button><div className="history-key"><span><i className="dot green-dot" />Taken</span><span><i className="dot red-dot" />Missed</span></div></div>{groups.map(([date, items]) => <div className="history-day" key={date}><h2>{date === new Date().toISOString().slice(0, 10) ? "Today" : "Yesterday"}<span>{date}</span></h2>{items?.map((dose) => <div className="history-row" key={dose.id}><span className={`history-status ${dose.status}`}>{dose.status === "taken" ? <Check /> : dose.status === "missed" ? <AlertTriangle /> : <Clock3 />}</span><div><strong>{dose.medicationName}</strong><span>{dose.dosage}</span></div><span>{dose.scheduledTime}</span><strong className={`status-text ${dose.status}`}>{dose.status}</strong>{dose.photoKey ? <HistoryThumbnail photoKey={dose.photoKey} /> : <span className="photo-placeholder">—</span>}</div>)}</div>)}</section></div>;
}

function HistoryThumbnail({ photoKey }: { photoKey: string }) {
  const [source, setSource] = useState<string | null>(null);
  useEffect(() => {
    const doseId = Number(photoKey.replace("local:", ""));
    let objectUrl: string | null = null;
    void getLocalPhoto(doseId).then((photo) => {
      if (photo) { objectUrl = URL.createObjectURL(photo); setSource(objectUrl); }
    });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [photoKey]);
  if (!source) return <span className="photo-placeholder" aria-label="Photo stored on this device">•••</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={source} alt="Confirmation thumbnail stored on this device" />;
}

function AddMedication({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), dosage: form.get("dosage"), times: [form.get("time")], instructions: form.get("instructions"), requiresPhoto: form.get("photo") === "on" }) });
    setSaving(false); if (response.ok) onSaved();
  }
  return <div className="sheet-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="side-sheet" aria-labelledby="add-title"><header><div><p className="eyebrow">Medication setup</p><h2 id="add-title">Add a medication</h2><p>It will appear on Evelyn’s daily schedule.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X /></button></header><form onSubmit={submit}><label>Medication name<input name="name" placeholder="e.g. Metformin" required autoFocus /></label><label>Dosage<input name="dosage" placeholder="e.g. 500 mg · 1 tablet" required /></label><label>Time each day<input name="time" type="time" required /></label><label>Simple instructions<textarea name="instructions" placeholder="e.g. Take with breakfast" /></label><label className="toggle-label"><span><strong>Photo confirmation</strong><small>Ask Evelyn to take a quick photo</small></span><input name="photo" type="checkbox" defaultChecked /></label><div className="sheet-actions"><button type="button" className="secondary-compact" onClick={onClose}>Cancel</button><button className="primary-compact" disabled={saving}>{saving ? "Adding…" : "Add medication"}</button></div></form></section></div>;
}

function InvitePanel({ code, onClose, onCopy }: { code: string; onClose: () => void; onCopy: () => void }) { return <div className="sheet-backdrop"><section className="invite-dialog" aria-labelledby="invite-title"><button className="icon-button dialog-close" onClick={onClose} aria-label="Close"><X /></button><div className="invite-icon"><Link2 /></div><p className="eyebrow">Senior device setup</p><h2 id="invite-title">Connect Evelyn’s phone</h2><p>Open this private link on Evelyn’s phone once. After that, Steady opens directly to her medication reminder.</p><div className="invite-code"><span>{code}</span><button onClick={onCopy}><Copy />Copy link</button></div><Link href={`/?invite=${code}`} className="primary-compact" onClick={onClose}>Preview senior view</Link></section></div>; }

function SettingsPanel({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return <div className="sheet-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="side-sheet utility-sheet" aria-labelledby="settings-title"><header><div><p className="eyebrow">Caregiver preferences</p><h2 id="settings-title">Settings</h2><p>Choose how Steady keeps you informed.</p></div><button className="icon-button" onClick={onClose} aria-label="Close settings"><X /></button></header><form onSubmit={(event) => { event.preventDefault(); onSave(); }}><label className="toggle-label"><span><strong>Missed-dose alerts</strong><small>Show an alert when a scheduled dose is missed</small></span><input type="checkbox" defaultChecked /></label><label className="toggle-label"><span><strong>Photo confirmations</strong><small>Keep photo confirmation on for new medications</small></span><input type="checkbox" defaultChecked /></label><label>Senior display name<input defaultValue="Evelyn Martin" aria-label="Senior display name" /></label><label>Caregiver email<input type="email" defaultValue="maya@example.com" aria-label="Caregiver email" /></label><div className="privacy-note"><ShieldCheck /><div><strong>Private by design</strong><p>Only connected caregivers should be able to view medication history and confirmation photos.</p></div></div><div className="sheet-actions"><button type="button" className="secondary-compact" onClick={onClose}>Cancel</button><button className="primary-compact">Save settings</button></div></form></section></div>;
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  return <div className="sheet-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="side-sheet utility-sheet" aria-labelledby="help-title"><header><div><p className="eyebrow">Help center</p><h2 id="help-title">How can we help?</h2><p>Quick answers for caregivers using Steady.</p></div><button className="icon-button" onClick={onClose} aria-label="Close help"><X /></button></header><div className="help-list"><details open><summary>How do I see Evelyn’s screen?<ChevronDown /></summary><p>Select <strong>View Evelyn’s screen</strong> in the sidebar or <strong>View as Evelyn</strong> at the top. This opens the simple senior reminder experience.</p></details><details><summary>How does photo confirmation work?<ChevronDown /></summary><p>When a medication requires a photo, Evelyn takes one after selecting “I took it.” The caregiver can then see the confirmation in History.</p></details><details><summary>What should I do after a missed dose?<ChevronDown /></summary><p>Steady only reports adherence. Follow the medication label or contact a qualified healthcare professional; the app does not recommend dosing changes.</p></details></div><a className="support-card" href="mailto:support@steady.example"><Mail /><div><strong>Email support</strong><span>support@steady.example</span></div></a><p className="demo-note">This portfolio demo uses a placeholder support address.</p></section></div>;
}

function NotificationsPanel({ onClose, onViewHistory }: { onClose: () => void; onViewHistory: () => void }) {
  return <div className="sheet-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="side-sheet utility-sheet" aria-labelledby="notifications-title"><header><div><p className="eyebrow">Updates</p><h2 id="notifications-title">Notifications</h2><p>Recent items that may need your attention.</p></div><button className="icon-button" onClick={onClose} aria-label="Close notifications"><X /></button></header><div className="notification-list"><article className="attention"><span><AlertTriangle /></span><div><strong>Vitamin D3 was missed</strong><p>Yesterday at 2:00 PM</p></div></article><article><span><Check /></span><div><strong>Lisinopril confirmed</strong><p>Today at 8:07 AM · Photo confirmed</p></div></article></div><button className="primary-compact full-width" onClick={onViewHistory}>View adherence history</button></section></div>;
}
