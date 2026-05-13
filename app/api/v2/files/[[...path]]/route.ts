import { NextRequest } from "next/server";
import {
  downloadStorageObject,
  ensureFileNameAvailable,
  joinPath,
  makeStoragePath,
  normalizePathSegments,
  removeStorageObject,
  resolveFilePath,
  resolveFolderPath,
  toApiFile,
  uploadFileBlob,
} from "@/lib/api/resources";
import {
  ApiRouteError,
  applyMetadataHeaders,
  buildAttachmentContentDisposition,
  handleRouteError,
  jsonResponse,
  requireUser,
  withNoContent,
} from "@/lib/api/server";

interface RouteContext {
  params: Promise<{ path?: string[] }>;
}

async function readUploadRequest(request: NextRequest, routePath?: string[]) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new ApiRouteError(400, "missing_file", "A file upload is required.");
  }

  const fallbackPath = formData.get("path");
  const pathSegments = normalizePathSegments(
    routePath && routePath.length > 0
      ? routePath
      : typeof fallbackPath === "string"
      ? fallbackPath.split("/")
      : [file.name],
  );

  if (pathSegments.length === 0) {
    throw new ApiRouteError(400, "invalid_path", "A file path is required.");
  }

  return {
    file,
    pathSegments,
    path: pathSegments.join("/"),
  };
}

function createFileHeaders(file: {
  id: string;
  name: string;
  mime_type: string | null;
  size: number;
  updated_at: string;
}, path: string) {
  const headers = new Headers();
  applyMetadataHeaders(headers, {
    "Content-Type": file.mime_type || "application/octet-stream",
    "Content-Disposition": buildAttachmentContentDisposition(file.name),
    "X-Supabytes-Entry-Type": "file",
    "X-Supabytes-Entry-Id": file.id,
    "X-Supabytes-Entry-Path": path,
    "X-Supabytes-File-Size": file.size,
    ETag: file.updated_at,
  });
  return headers;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const { path } = await params;
    const pathSegments = normalizePathSegments(path);
    const resolved = await resolveFilePath(supabase, user.id, pathSegments);
    const blob = await downloadStorageObject(supabase, resolved.file.storage_path);

    return new Response(blob, {
      status: 200,
      headers: createFileHeaders(resolved.file, resolved.path),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function HEAD(_request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const { path } = await params;
    const pathSegments = normalizePathSegments(path);
    const resolved = await resolveFilePath(supabase, user.id, pathSegments);
    return withNoContent(createFileHeaders(resolved.file, resolved.path));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const upload = await readUploadRequest(request, (await params).path);
    const parentSegments = upload.pathSegments.slice(0, -1);
    const fileName = upload.pathSegments.at(-1)!;
    const parent = await resolveFolderPath(supabase, user.id, parentSegments);

    await ensureFileNameAvailable(
      supabase,
      user.id,
      fileName,
      parent.folder?.id ?? null,
    );

    const storagePath = makeStoragePath(user.id, fileName);
    await uploadFileBlob(supabase, upload.file, storagePath, false);

    const now = new Date().toISOString();
    const { data, error } = await supabase.from("files").insert({
      name: fileName,
      folder_id: parent.folder?.id ?? null,
      user_id: user.id,
      storage_path: storagePath,
      mime_type: upload.file.type || null,
      size: upload.file.size,
      updated_at: now,
    }).select().single();

    if (error || !data) {
      await removeStorageObject(supabase, storagePath);
      throw new ApiRouteError(500, "file_create_failed", error?.message || "Failed to create file.");
    }

    return jsonResponse({ file: toApiFile(data, upload.path) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const upload = await readUploadRequest(request, (await params).path);

    try {
      const existing = await resolveFilePath(supabase, user.id, upload.pathSegments);
      await uploadFileBlob(supabase, upload.file, existing.file.storage_path, true);
      const now = new Date().toISOString();
      const { data, error } = await supabase.from("files").update({
        mime_type: upload.file.type || null,
        size: upload.file.size,
        updated_at: now,
        is_trashed: false,
        trashed_at: null,
      }).eq("id", existing.file.id).eq("user_id", user.id).select().single();

      if (error || !data) {
        throw new ApiRouteError(500, "file_replace_failed", error?.message || "Failed to replace file.");
      }

      return jsonResponse({ file: toApiFile(data, upload.path) });
    } catch (error) {
      if (!(error instanceof ApiRouteError) || error.code !== "file_not_found") {
        throw error;
      }
      const parentSegments = upload.pathSegments.slice(0, -1);
      const fileName = upload.pathSegments.at(-1)!;
      const parent = await resolveFolderPath(supabase, user.id, parentSegments);
      await ensureFileNameAvailable(
        supabase,
        user.id,
        fileName,
        parent.folder?.id ?? null,
      );

      const storagePath = makeStoragePath(user.id, fileName);
      await uploadFileBlob(supabase, upload.file, storagePath, false);

      const now = new Date().toISOString();
      const { data, error: insertError } = await supabase.from("files").insert({
        name: fileName,
        folder_id: parent.folder?.id ?? null,
        user_id: user.id,
        storage_path: storagePath,
        mime_type: upload.file.type || null,
        size: upload.file.size,
        updated_at: now,
      }).select().single();

      if (insertError || !data) {
        await removeStorageObject(supabase, storagePath);
        throw new ApiRouteError(
          500,
          "file_create_failed",
          insertError?.message || "Failed to create file.",
        );
      }

      return jsonResponse({ file: toApiFile(data, upload.path) }, { status: 201 });
    }
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const { path } = await params;
    const pathSegments = normalizePathSegments(path);
    const resolved = await resolveFilePath(supabase, user.id, pathSegments, {
      includeTrashed: true,
    });
    const body = await request.json();
    const action = body.action as string;
    const file = resolved.file;
    const now = new Date().toISOString();

    if (action === "favorite") {
      const { data, error } = await supabase.from("files").update({
        is_favorite: Boolean(body.favorite),
        updated_at: now,
      }).eq("id", file.id).eq("user_id", user.id).select().single();

      if (error || !data) {
        throw new ApiRouteError(500, "file_update_failed", error?.message || "Failed to update file.");
      }

      return jsonResponse({ file: toApiFile(data, resolved.path) });
    }

    if (action === "restore") {
      const destinationPath = body.destinationPath == null
        ? resolved.parent.path
        : String(body.destinationPath);
      const destination = await resolveFolderPath(
        supabase,
        user.id,
        normalizePathSegments(destinationPath ? destinationPath.split("/") : []),
        { includeTrashed: true },
      );

      await ensureFileNameAvailable(
        supabase,
        user.id,
        file.name,
        destination.folder?.id ?? null,
        file.id,
      );

      const { data, error } = await supabase.from("files").update({
        folder_id: destination.folder?.id ?? null,
        is_trashed: false,
        trashed_at: null,
        updated_at: now,
      }).eq("id", file.id).eq("user_id", user.id).select().single();

      if (error || !data) {
        throw new ApiRouteError(500, "file_restore_failed", error?.message || "Failed to restore file.");
      }

      return jsonResponse({ file: toApiFile(data, joinPath(destination.path, file.name)) });
    }

    if (action === "rename") {
      const newName = String(body.name || "").trim();
      if (!newName) {
        throw new ApiRouteError(400, "invalid_name", "A new file name is required.");
      }

      await ensureFileNameAvailable(
        supabase,
        user.id,
        newName,
        file.folder_id,
        file.id,
      );

      const { data, error } = await supabase.from("files").update({
        name: newName,
        updated_at: now,
      }).eq("id", file.id).eq("user_id", user.id).select().single();

      if (error || !data) {
        throw new ApiRouteError(500, "file_update_failed", error?.message || "Failed to rename file.");
      }

      return jsonResponse({
        file: toApiFile(
          data,
          joinPath(resolved.parent.path, newName),
        ),
      });
    }

    if (action === "move") {
      const destinationPath = body.destinationPath == null
        ? ""
        : String(body.destinationPath);
      const destination = await resolveFolderPath(
        supabase,
        user.id,
        normalizePathSegments(destinationPath ? destinationPath.split("/") : []),
      );

      await ensureFileNameAvailable(
        supabase,
        user.id,
        file.name,
        destination.folder?.id ?? null,
        file.id,
      );

      const { data, error } = await supabase.from("files").update({
        folder_id: destination.folder?.id ?? null,
        updated_at: now,
      }).eq("id", file.id).eq("user_id", user.id).select().single();

      if (error || !data) {
        throw new ApiRouteError(500, "file_move_failed", error?.message || "Failed to move file.");
      }

      return jsonResponse({ file: toApiFile(data, joinPath(destination.path, file.name)) });
    }

    throw new ApiRouteError(400, "invalid_action", "Unsupported file action.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    const { path } = await params;
    const pathSegments = normalizePathSegments(path);
    const resolved = await resolveFilePath(supabase, user.id, pathSegments, {
      includeTrashed: true,
    });

    if (request.nextUrl.searchParams.get("permanent") === "true") {
      await removeStorageObject(supabase, resolved.file.storage_path);
      const { error } = await supabase.from("files").delete().eq(
        "id",
        resolved.file.id,
      ).eq("user_id", user.id);

      if (error) {
        throw new ApiRouteError(500, "file_delete_failed", error.message);
      }
    } else {
      const now = new Date().toISOString();
      const { error } = await supabase.from("files").update({
        is_trashed: true,
        trashed_at: now,
        updated_at: now,
      }).eq("id", resolved.file.id).eq("user_id", user.id);

      if (error) {
        throw new ApiRouteError(500, "file_delete_failed", error.message);
      }
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
