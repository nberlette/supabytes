import { NextRequest } from "next/server";
import {
  ApiRouteError,
  handleRouteError,
  jsonResponse,
  requireUser,
} from "@/lib/api/server";
import {
  getFolderDescendantIds,
  isFolderDescendantOf,
  permanentlyDeleteFolderTree,
  restoreFolderTree,
  trashFolderTree,
} from "@/lib/api/resources";

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const body = await request.json();
    const action = body.action as string;
    const fileIds = (body.fileIds || []) as string[];
    const folderIds = (body.folderIds || []) as string[];
    const now = new Date().toISOString();

    if (action === "restore") {
      if (fileIds.length > 0) {
        const { error } = await supabase.from("files").update({
          is_trashed: false,
          trashed_at: null,
          updated_at: now,
        }).in("id", fileIds).eq("user_id", user.id);
        if (error) throw new ApiRouteError(500, "restore_failed", error.message);
      }
      for (const folderId of folderIds) {
        await restoreFolderTree(supabase, user.id, folderId);
      }
      return jsonResponse({ success: true });
    }

    if (action === "move") {
      const targetFolderId = body.targetFolderId as string | null;
      if (targetFolderId) {
        const { data: targetFolder } = await supabase.from("folders").select("id").eq(
          "id",
          targetFolderId,
        ).eq("user_id", user.id).single();
        if (!targetFolder) {
          throw new ApiRouteError(404, "folder_not_found", "Target folder not found.");
        }
      }

      if (fileIds.length > 0) {
        const { error } = await supabase.from("files").update({
          folder_id: targetFolderId,
          updated_at: now,
        }).in("id", fileIds).eq("user_id", user.id);
        if (error) throw new ApiRouteError(500, "move_failed", error.message);
      }

      for (const folderId of folderIds) {
        if (
          targetFolderId &&
          await isFolderDescendantOf(supabase, user.id, folderId, targetFolderId)
        ) {
          throw new ApiRouteError(400, "invalid_move", "Cannot move a folder into its descendant.");
        }
        const { error } = await supabase.from("folders").update({
          parent_id: targetFolderId,
          updated_at: now,
        }).eq("id", folderId).eq("user_id", user.id);
        if (error) throw new ApiRouteError(500, "move_failed", error.message);
      }

      return jsonResponse({ success: true });
    }

    if (action === "favorite") {
      if (fileIds.length > 0) {
        const { error } = await supabase.from("files").update({
          is_favorite: Boolean(body.favorite),
          updated_at: now,
        }).in("id", fileIds).eq("user_id", user.id);
        if (error) throw new ApiRouteError(500, "favorite_failed", error.message);
      }

      if (folderIds.length > 0) {
        const { error } = await supabase.from("folders").update({
          is_favorite: Boolean(body.favorite),
          updated_at: now,
        }).in("id", folderIds).eq("user_id", user.id);
        if (error) throw new ApiRouteError(500, "favorite_failed", error.message);
      }

      return jsonResponse({ success: true });
    }

    throw new ApiRouteError(400, "invalid_action", "Unsupported bulk action.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const body = await request.json();
    const fileIds = (body.fileIds || []) as string[];
    const folderIds = (body.folderIds || []) as string[];
    const permanent = Boolean(body.permanent);
    const now = new Date().toISOString();

    if (permanent) {
      if (fileIds.length > 0) {
        const { data: files } = await supabase.from("files").select(
          "id, storage_path",
        ).in("id", fileIds).eq("user_id", user.id);
        const paths = (files || []).map((file) => file.storage_path);
        if (paths.length > 0) {
          const { error } = await supabase.storage.from("files").remove(paths);
          if (error) throw new ApiRouteError(500, "delete_failed", error.message);
        }
        const { error } = await supabase.from("files").delete().in(
          "id",
          fileIds,
        ).eq("user_id", user.id);
        if (error) throw new ApiRouteError(500, "delete_failed", error.message);
      }

      for (const folderId of folderIds) {
        await permanentlyDeleteFolderTree(supabase, user.id, folderId);
      }

      return jsonResponse({ success: true });
    }

    if (fileIds.length > 0) {
      const { error } = await supabase.from("files").update({
        is_trashed: true,
        trashed_at: now,
        updated_at: now,
      }).in("id", fileIds).eq("user_id", user.id);
      if (error) throw new ApiRouteError(500, "trash_failed", error.message);
    }

    for (const folderId of folderIds) {
      await trashFolderTree(supabase, user.id, folderId);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
