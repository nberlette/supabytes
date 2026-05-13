import { NextRequest } from "next/server";
import {
  ensureFolderNameAvailable,
  folderToBreadcrumbs,
  isFolderDescendantOf,
  joinPath,
  listFolderChildren,
  normalizePathSegments,
  permanentlyDeleteFolderTree,
  resolveFolderPath,
  restoreFolderTree,
  toApiFolder,
  trashFolderTree,
} from "@/lib/api/resources";
import {
  ApiRouteError,
  applyMetadataHeaders,
  handleRouteError,
  jsonResponse,
  requireUser,
  withNoContent,
} from "@/lib/api/server";
import type { DashboardView } from "@/lib/api/contracts";

interface RouteContext {
  params: Promise<{ path?: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const { path } = await params;
    const pathSegments = normalizePathSegments(path);
    const view = (request.nextUrl.searchParams.get("view") || "files") as
      DashboardView;
    const excludedFolderIds = request.nextUrl.searchParams.get("excludeFolderIds")
      ?.split(",")
      .filter(Boolean) || [];

    const listing = await listFolderChildren(supabase, user.id, pathSegments, view);
    const folders = listing.folders.filter((folder) =>
      !excludedFolderIds.includes(folder.id)
    );
    const { files, folder, breadcrumbs } = listing;
    return jsonResponse(
      { files, folder, breadcrumbs, folders },
      {
        meta: {
          view,
          breadcrumbs,
          counts: {
            files: files.length,
            folders: folders.length,
            total: files.length + folders.length,
          },
        },
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function HEAD(_request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const { path } = await params;
    const pathSegments = normalizePathSegments(path);
    const resolved = await resolveFolderPath(supabase, user.id, pathSegments);
    const headers = new Headers();

    applyMetadataHeaders(headers, {
      "X-Supabytes-Entry-Type": "folder",
      "X-Supabytes-Entry-Id": resolved.folder?.id || "root",
      "X-Supabytes-Entry-Path": resolved.path || "",
      ETag: resolved.folder?.updated_at || "root",
    });

    return withNoContent(headers);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const { path } = await params;
    const parentSegments = normalizePathSegments(path);
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      throw new ApiRouteError(
        400,
        "invalid_name",
        "A folder name is required.",
      );
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new ApiRouteError(
        400,
        "invalid_name",
        "A folder name is required.",
      );
    }

    const parent = await resolveFolderPath(supabase, user.id, parentSegments);
    await ensureFolderNameAvailable(
      supabase,
      user.id,
      trimmedName,
      parent.folder?.id ?? null,
    );

    const now = new Date().toISOString();
    const { data, error } = await supabase.from("folders").insert({
      name: trimmedName,
      parent_id: parent.folder?.id ?? null,
      user_id: user.id,
      updated_at: now,
    }).select().single();

    if (error || !data) {
      throw new ApiRouteError(
        500,
        "folder_create_failed",
        error?.message || "Failed to create folder.",
      );
    }

    const folder = toApiFolder(data, joinPath(parent.path, trimmedName));
    return jsonResponse({ folder }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const { path } = await params;
    const pathSegments = normalizePathSegments(path);
    if (pathSegments.length === 0) {
      throw new ApiRouteError(
        400,
        "invalid_path",
        "Root folder cannot be updated.",
      );
    }

    const resolved = await resolveFolderPath(supabase, user.id, pathSegments, {
      includeTrashed: true,
    });
    const folder = resolved.folder;
    if (!folder) {
      throw new ApiRouteError(404, "folder_not_found", "Folder not found.");
    }

    const body = await request.json();
    const action = body.action as string;
    const now = new Date().toISOString();

    if (action === "favorite") {
      const { data, error } = await supabase.from("folders").update({
        is_favorite: Boolean(body.favorite),
        updated_at: now,
      }).eq("id", folder.id).eq("user_id", user.id).select().single();

      if (error || !data) {
        throw new ApiRouteError(
          500,
          "folder_update_failed",
          error?.message || "Failed to update folder.",
        );
      }

      return jsonResponse({
        folder: toApiFolder(data, resolved.path || folder.name),
      });
    }

    if (action === "restore") {
      const destinationPath = body.destinationPath == null
        ? resolved.trail.slice(0, -1).map((item) => item.name).join("/")
        : String(body.destinationPath);
      const destinationSegments = normalizePathSegments(
        destinationPath ? destinationPath.split("/") : [],
      );
      const destination = await resolveFolderPath(
        supabase,
        user.id,
        destinationSegments,
        { includeTrashed: true },
      );
      await ensureFolderNameAvailable(
        supabase,
        user.id,
        folder.name,
        destination.folder?.id ?? null,
        folder.id,
      );
      const { error } = await supabase.from("folders").update({
        parent_id: destination.folder?.id ?? null,
        updated_at: now,
      }).eq("id", folder.id).eq("user_id", user.id);

      if (error) {
        throw new ApiRouteError(500, "folder_restore_failed", error.message);
      }

      await restoreFolderTree(supabase, user.id, folder.id);
      return jsonResponse({
        folder: toApiFolder(folder, joinPath(destination.path, folder.name)),
      });
    }

    if (action === "rename") {
      const newName = String(body.name || "").trim();
      if (!newName) {
        throw new ApiRouteError(400, "invalid_name", "A new folder name is required.");
      }

      await ensureFolderNameAvailable(
        supabase,
        user.id,
        newName,
        folder.parent_id,
        folder.id,
      );
      const { data, error } = await supabase.from("folders").update({
        name: newName,
        updated_at: now,
      }).eq("id", folder.id).eq("user_id", user.id).select().single();

      if (error || !data) {
        throw new ApiRouteError(500, "folder_update_failed", error?.message || "Failed to rename folder.");
      }

      const parentPath = resolved.trail.slice(0, -1).map((item) => item.name).join("/");
      return jsonResponse({
        folder: toApiFolder(data, joinPath(parentPath, newName)),
      });
    }

    if (action === "move") {
      const destinationPath = body.destinationPath == null
        ? ""
        : String(body.destinationPath);
      const destinationSegments = normalizePathSegments(
        destinationPath ? destinationPath.split("/") : [],
      );
      const destination = await resolveFolderPath(supabase, user.id, destinationSegments);

      if (
        destination.folder &&
        await isFolderDescendantOf(supabase, user.id, folder.id, destination.folder.id)
      ) {
        throw new ApiRouteError(
          400,
          "invalid_move",
          "A folder cannot be moved into itself or one of its descendants.",
        );
      }

      await ensureFolderNameAvailable(
        supabase,
        user.id,
        folder.name,
        destination.folder?.id ?? null,
        folder.id,
      );

      const { data, error } = await supabase.from("folders").update({
        parent_id: destination.folder?.id ?? null,
        updated_at: now,
      }).eq("id", folder.id).eq("user_id", user.id).select().single();

      if (error || !data) {
        throw new ApiRouteError(500, "folder_move_failed", error?.message || "Failed to move folder.");
      }

      return jsonResponse({
        folder: toApiFolder(data, joinPath(destination.path, folder.name)),
      });
    }

    throw new ApiRouteError(400, "invalid_action", "Unsupported folder action.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const { path } = await params;
    const pathSegments = normalizePathSegments(path);
    if (pathSegments.length === 0) {
      throw new ApiRouteError(
        400,
        "invalid_path",
        "Root folder cannot be deleted.",
      );
    }

    const resolved = await resolveFolderPath(supabase, user.id, pathSegments, {
      includeTrashed: true,
    });

    if (!resolved.folder) {
      throw new ApiRouteError(404, "folder_not_found", "Folder not found.");
    }

    if (request.nextUrl.searchParams.get("permanent") === "true") {
      await permanentlyDeleteFolderTree(supabase, user.id, resolved.folder.id);
    } else {
      await trashFolderTree(supabase, user.id, resolved.folder.id);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
