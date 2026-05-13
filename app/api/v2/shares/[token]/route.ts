import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildShareTargetSummary,
  downloadStorageObject,
  getFolderPathById,
  joinPath,
  listFolderChildren,
  normalizePathSegments,
  resolveFilePath,
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
  params: Promise<{ token: string }>;
}

async function resolveShare(token: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("shared_links").select("*").or(
    `short_token.eq.${token},token.eq.${token}`,
  ).limit(1).maybeSingle();

  if (error || !data) {
    throw new ApiRouteError(404, "share_not_found", "Share link not found.");
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new ApiRouteError(410, "share_expired", "Share link has expired.");
  }

  return { supabase, link: data };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const { supabase, link } = await resolveShare(token);

    if (link.target_type === "folder" && link.folder_id) {
      const { data: folder } = await supabase.from("folders").select("*").eq(
        "id",
        link.folder_id,
      ).single();

      if (!folder) {
        throw new ApiRouteError(404, "folder_not_found", "Folder not found.");
      }

      const relativePath = request.nextUrl.searchParams.get("path") || "";
      const rootPath = await getFolderPathById(supabase, folder.user_id, folder.id);
      const fullPath = joinPath(rootPath, relativePath);

      if (request.nextUrl.searchParams.get("download") === "1") {
        if (!relativePath) {
          throw new ApiRouteError(
            400,
            "missing_path",
            "A relative file path is required to download from a shared folder.",
          );
        }

        const requestedFilePath = joinPath(
          rootPath,
          request.nextUrl.searchParams.get("path"),
        );
        const resolvedFile = await resolveFilePath(
          supabase,
          folder.user_id,
          normalizePathSegments(requestedFilePath.split("/")),
          { includeTrashed: true },
        );
        const blob = await downloadStorageObject(
          supabase,
          resolvedFile.file.storage_path,
        );
        const { error } = await supabase.from("shared_links").update({
          download_count: (link.download_count || 0) + 1,
        }).eq("id", link.id);
        if (error) {
          console.error(error);
        }

        return new Response(blob, {
          status: 200,
          headers: applyMetadataHeaders(new Headers(), {
            "Content-Type": resolvedFile.file.mime_type || "application/octet-stream",
            "Content-Disposition": buildAttachmentContentDisposition(resolvedFile.file.name),
            "X-Supabytes-Entry-Type": "file",
            "X-Supabytes-Entry-Path": resolvedFile.path,
          }),
        });
      }

      const listing = await listFolderChildren(
        supabase,
        folder.user_id,
        normalizePathSegments(fullPath ? fullPath.split("/") : rootPath.split("/")),
        "files",
      );

      return jsonResponse({
        share: {
          ...link,
          url: `/s/${link.short_token}`,
          target: await buildShareTargetSummary(supabase, folder.user_id, link),
        },
        folder: listing.folder,
        files: listing.files,
        folders: listing.folders,
      }, {
        meta: {
          breadcrumbs: listing.breadcrumbs,
        },
      });
    }

    if (!link.file_id) {
      throw new ApiRouteError(404, "file_not_found", "File not found.");
    }

    const { data: file } = await supabase.from("files").select("*").eq(
      "id",
      link.file_id,
    ).single();

    if (!file) {
      throw new ApiRouteError(404, "file_not_found", "File not found.");
    }

    if (request.nextUrl.searchParams.get("download") === "1") {
      const blob = await downloadStorageObject(supabase, file.storage_path);
      const { error } = await supabase.from("shared_links").update({
        download_count: (link.download_count || 0) + 1,
      }).eq("id", link.id);
      if (error) {
        console.error(error);
      }

      return new Response(blob, {
        status: 200,
        headers: applyMetadataHeaders(new Headers(), {
          "Content-Type": file.mime_type || "application/octet-stream",
          "Content-Disposition": buildAttachmentContentDisposition(file.name),
          "X-Supabytes-Entry-Type": "file",
          "X-Supabytes-Entry-Path": file.name,
        }),
      });
    }

    return jsonResponse({
      share: {
        ...link,
        url: `/s/${link.short_token}`,
        target: await buildShareTargetSummary(supabase, file.user_id, link),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function HEAD(_request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const { supabase, link } = await resolveShare(token);

    const ownerId = link.target_type === "folder" && link.folder_id
      ? (await supabase.from("folders").select("user_id").eq("id", link.folder_id).single())
        .data?.user_id
      : (await supabase.from("files").select("user_id").eq("id", link.file_id).single())
        .data?.user_id;

    const headers = applyMetadataHeaders(new Headers(), {
      "X-Supabytes-Share-Token": link.short_token,
      "X-Supabytes-Share-Type": link.target_type,
      ETag: link.created_at,
    });

    if (ownerId) {
      const target = await buildShareTargetSummary(supabase, ownerId, link);
      applyMetadataHeaders(headers, {
        "X-Supabytes-Entry-Path": target.path,
      });
    }

    return withNoContent(headers);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("shared_links").select("*").or(
      `short_token.eq.${token},token.eq.${token}`,
    ).maybeSingle();

    if (error) {
      throw new ApiRouteError(500, "share_lookup_failed", error.message);
    }

    if (!data) {
      throw new ApiRouteError(404, "share_not_found", "Share link not found.");
    }

    if (
      data.target_type === "folder" &&
      data.folder_id
    ) {
      const { data: folder } = await supabase.from("folders").select("user_id").eq(
        "id",
        data.folder_id,
      ).single();
      if (folder?.user_id !== user.id) {
        throw new ApiRouteError(403, "forbidden", "You do not own this share.");
      }
    }

    if (
      data.target_type === "file" &&
      data.file_id
    ) {
      const { data: file } = await supabase.from("files").select("user_id").eq(
        "id",
        data.file_id,
      ).single();
      if (file?.user_id !== user.id) {
        throw new ApiRouteError(403, "forbidden", "You do not own this share.");
      }
    }

    const { error: deleteError } = await supabase.from("shared_links").delete().eq(
      "id",
      data.id,
    );

    if (deleteError) {
      throw new ApiRouteError(500, "share_delete_failed", deleteError.message);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
