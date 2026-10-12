import type { NextRequest } from "next/server";
import { databaseError, guardAdmin, jsonOk, parseJsonBody } from "@/lib/api/http";
import { getStoreSettings } from "@/lib/data/public";
import { revalidateSettings } from "@/lib/data/revalidate";
import { storeSettingsSchema } from "@/lib/validations/settings";

/** GET /api/settings — public store information. */
export async function GET() {
  const settings = await getStoreSettings();
  return Response.json(
    { settings },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

/** PATCH /api/settings — update store information (admin only). */
export async function PATCH(request: NextRequest) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard.admin;

  const body = await parseJsonBody(request, storeSettingsSchema);
  if (!body.ok) return body.response;

  const { data: existing, error: readError } = await supabase
    .from("store_settings")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (readError) return databaseError(readError, "settings-read");

  const { error } = existing
    ? await supabase.from("store_settings").update(body.data).eq("id", existing.id)
    : await supabase.from("store_settings").insert(body.data);
  if (error) return databaseError(error, "settings-save");

  revalidateSettings();
  return jsonOk({ ok: true });
}
