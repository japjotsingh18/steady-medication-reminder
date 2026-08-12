import { env } from "cloudflare:workers";
import { ensureDemoData } from "../../../../db/runtime";

export async function POST(request: Request) {
  try {
    await ensureDemoData();
    const form = await request.formData();
    const doseId = Number(form.get("doseId"));
    const photo = form.get("photo");
    let photoKey: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      photoKey = `confirmations/${doseId}-${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      await env.PHOTOS.put(photoKey, photo.stream(), { httpMetadata: { contentType: photo.type || "image/jpeg" } });
    }
    await env.DB.prepare("UPDATE dose_logs SET status = 'taken', confirmed_at = ?, photo_key = ? WHERE id = ?")
      .bind(new Date().toISOString(), photoKey, doseId).run();
    return Response.json({ ok: true, photoKey });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to confirm dose" }, { status: 500 });
  }
}
