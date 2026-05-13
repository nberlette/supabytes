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

  const { fileIds, folderIds, targetFolderId } = await request.json();

  // Validate targetFolderId belongs to user (if not root)
  if (targetFolderId !== null) {
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

  // Move files
  if (fileIds && fileIds.length > 0) {
    const { error } = await supabase
      .from("files")
      .update({ folder_id: targetFolderId })
      .in("id", fileIds)
      .eq("user_id", user.id);

    if (error) {
      errors.push(`Failed to move files: ${error.message}`);
    }
  }

  // Move folders (prevent moving folder into itself or its children)
  if (folderIds && folderIds.length > 0) {
    for (const folderId of folderIds) {
      // Don't allow moving a folder into itself
      if (folderId === targetFolderId) {
        errors.push("Cannot move a folder into itself");
        continue;
      }

      // Check if target is a child of the folder being moved
      if (targetFolderId) {
        let currentId: string | null = targetFolderId;
        let isChild = false;

        while (currentId) {
          if (currentId === folderId) {
            isChild = true;
            break;
          }
          const { data: parent } = await supabase.from("folders").select(
            "parent_id",
          ).eq("id", currentId).single();
          currentId = parent?.parent_id || null;
        }

        if (isChild) {
          errors.push("Cannot move a folder into its own subfolder");
          continue;
        }
      }

      const { error } = await supabase
        .from("folders")
        .update({ parent_id: targetFolderId })
        .eq("id", folderId)
        .eq("user_id", user.id);

      if (error) {
        errors.push(`Failed to move folder: ${error.message}`);
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 207 });
  }

  return NextResponse.json({ success: true });
}
