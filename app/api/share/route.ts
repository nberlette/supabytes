import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { file_id, expires_in_days } = await request.json();

  if (!file_id) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  }

  // Verify user owns the file
  const { data: file } = await supabase.from("files").select("id").eq(
    "id",
    file_id,
  ).eq("user_id", user.id).single();

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const token = crypto.randomUUID();
  const expiresAt = expires_in_days
    ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: sharedLink, error } = await supabase
    .from("shared_links")
    .insert({
      file_id,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    link: sharedLink,
    url: `/shared/${token}`,
  });
}
