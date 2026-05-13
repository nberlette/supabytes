import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId, folderId, isFavorite } = await request.json();

  if (fileId) {
    const { error } = await supabase
      .from("files")
      .update({ is_favorite: isFavorite })
      .eq("id", fileId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (folderId) {
    const { error } = await supabase
      .from("folders")
      .update({ is_favorite: isFavorite })
      .eq("id", folderId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
