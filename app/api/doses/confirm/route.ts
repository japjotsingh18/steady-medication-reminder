import { env } from "cloudflare:workers";
import { ensureDemoData } from "../../../../db/runtime";

export async function POST(request: Request) {
  try {
    await ensureDemoData();
    const form = await request.formData();
    const doseId = Number(form.get("doseId"));
    if (!Number.isInteger(doseId) || doseId < 1) return Response.json({ error: "A valid dose is required" }, { status: 400 });
    await env.DB.prepare("UPDATE dose_logs SET status = 'taken', confirmed_at = ?, photo_key = NULL WHERE id = ?")
      .bind(new Date().toISOString(), doseId).run();
    return Response.json({ ok: true, photoStoredOnDevice: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to confirm dose" }, { status: 500 });
  }
}
