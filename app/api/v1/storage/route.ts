import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: files } = await supabase.from("files").select("size").eq(
    "user_id",
    user.id,
  ).eq("is_trashed", false);

  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("storage_quota_bytes")
    .eq("user_id", user.id)
    .single();

  const totalUsed = files?.reduce((acc, file) => acc + (file.size || 0), 0) ||
    0;
  const quota = preferences?.storage_quota_bytes || 5368709120;

  return NextResponse.json({
    used: totalUsed,
    quota,
    percent: Math.min((totalUsed / quota) * 100, 100),
  });
}
