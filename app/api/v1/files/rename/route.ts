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

  const { targetFileId, targetFolderId, name } = await request.json();

  // Validate targetFolderId belongs to user (if not root)
  if (targetFolderId != null) {
    const { data: targetFolder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", targetFolderId)
      .eq("user_id", user.id)
      .single();

    if (!targetFolder) {
      return NextResponse.json({ error: "Target folder not found" }, {
        status: 404,
      });
    }
  }

  const errors: string[] = [];

  // Rename files
  if (targetFileId != null) {
    const { error } = await supabase
      .from("files")
      .update({ name })
      .eq("id", targetFileId)
      .eq("user_id", user.id);

    if (error) {
      errors.push(`Failed to rename file: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 207 });
  }

  return NextResponse.json({ success: true });
}
