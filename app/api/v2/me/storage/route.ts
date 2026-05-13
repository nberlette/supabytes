import { ApiRouteError, handleRouteError, jsonResponse, requireUser } from "@/lib/api/server";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const [filesResult, preferencesResult] = await Promise.all([
      supabase.from("files").select("size").eq("user_id", user.id).eq(
        "is_trashed",
        false,
      ),
      supabase.from("user_preferences").select("storage_quota_bytes").eq(
        "user_id",
        user.id,
      ).single(),
    ]);

    if (preferencesResult.error && preferencesResult.error.code !== "PGRST116") {
      throw new ApiRouteError(500, "storage_lookup_failed", preferencesResult.error.message);
    }

    const used = (filesResult.data || []).reduce(
      (total, file) => total + (file.size || 0),
      0,
    );
    const quota = preferencesResult.data?.storage_quota_bytes || 5368709120;

    return jsonResponse({
      used,
      quota,
      percent: Math.min((used / quota) * 100, 100),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
