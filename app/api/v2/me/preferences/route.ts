import { NextRequest } from "next/server";
import { ApiRouteError, handleRouteError, jsonResponse, requireUser } from "@/lib/api/server";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("user_preferences").select("*").eq(
      "user_id",
      user.id,
    ).single();

    if (error && error.code !== "PGRST116") {
      throw new ApiRouteError(500, "preferences_lookup_failed", error.message);
    }

    return jsonResponse({ preferences: data || null });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const body = await request.json();
    const viewMode = body.view_mode;
    const theme = body.theme;

    const { data, error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      view_mode: viewMode,
      theme,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" }).select().single();

    if (error || !data) {
      throw new ApiRouteError(500, "preferences_save_failed", error?.message || "Failed to save preferences.");
    }

    return jsonResponse({ preferences: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
