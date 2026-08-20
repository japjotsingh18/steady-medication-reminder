import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const seniorHomeUrl = new URL("../app/senior-home.tsx", import.meta.url);
const stylesUrl = new URL("../app/globals.css", import.meta.url);
const runtimeUrl = new URL("../db/runtime.ts", import.meta.url);

test("senior view uses the local clock for reminder wording", async () => {
  const source = await readFile(seniorHomeUrl, "utf8");

  assert.match(source, /function greetingForHour/);
  assert.match(source, /function timingLabel/);
  assert.match(source, /return "Next dose"/);
  assert.match(source, /return "Overdue"/);
  assert.match(source, /return "Due now"/);
  assert.match(source, /window\.setInterval\(\(\) => setNow\(new Date\(\)\), 60_000\)/);
  assert.match(source, /className="senior-shell senior-home-shell"/);
});

test("senior view expands on desktop and stays single-column on mobile", async () => {
  const css = await readFile(stylesUrl, "utf8");

  assert.match(css, /@media \(min-width:900px\)/);
  assert.match(css, /\.senior-home-shell\{[^}]*width:min\(calc\(100% - 48px\),1180px\)/);
  assert.match(css, /grid-template-columns:minmax\(0,1\.08fr\) minmax\(360px,\.92fr\)/);
  assert.match(css, /grid-template-areas:"header header" "greeting today" "card today" "footer today"/);
  assert.match(css, /@media \(max-width:480px\)/);
});

test("demo medication schedules roll forward instead of expiring", async () => {
  const source = await readFile(runtimeUrl, "utf8");

  assert.match(source, /async function ensureScheduledDoses\(daysAhead = 30\)/);
  assert.match(source, /offset <= daysAhead/);
  assert.match(source, /await ensureScheduledDoses\(\)/);
  assert.match(source, /scheduled_date BETWEEN date\('now', '-7 days'\) AND date\('now'\)/);
  assert.match(source, /minutes\(a\.scheduledTime\) - minutes\(b\.scheduledTime\)/);
});
