import { NextRequest } from "next/server";
import {
  buildShareTargetSummary,
  createFolderPathCache,
  generateShortShareToken,
  listOwnedSharedLinks,
  normalizePathSegments,
  resolveFilePath,
  resolveFolderPath,
} from "@/lib/api/resources";
import { ApiRouteError, handleRouteError, jsonResponse, requireUser } from "@/lib/api/server";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const data = await listOwnedSharedLinks(supabase);
    const pathCache = await createFolderPathCache(supabase, user.id);

    const shares = await Promise.all((data || []).map(async (link) => ({
      ...link,
      url: `/s/${link.short_token}`,
      target: await buildShareTargetSummary(supabase, user.id, link, pathCache),
    })));

    return jsonResponse({ shares });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const body = await request.json();
    const requestedType = body.type as "file" | "folder" | undefined;
    const targetType = requestedType ||
      (body.folderPath ? "folder" : "file");
    const expiresInDays = body.expiresInDays || body.expires_in_days;
    const expiresAt = expiresInDays
      ? new Date(
        Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000,
      ).toISOString()
      : null;

    if (targetType === "folder") {
      const folderPath = String(body.folderPath || body.path || "");
      const folder = await resolveFolderPath(
        supabase,
        user.id,
        normalizePathSegments(folderPath.split("/")),
      );

      if (!folder.folder) {
        throw new ApiRouteError(404, "folder_not_found", "Folder not found.");
      }

      const shortToken = await generateShortShareToken(supabase);
      const { data, error } = await supabase.from("shared_links").insert({
        folder_id: folder.folder.id,
        file_id: null,
        target_type: "folder",
        token: crypto.randomUUID(),
        short_token: shortToken,
        expires_at: expiresAt,
      }).select().single();

      if (error || !data) {
        throw new ApiRouteError(500, "share_create_failed", error?.message || "Failed to create share link.");
      }

      return jsonResponse({
        share: {
          ...data,
          url: `/s/${data.short_token}`,
          target: await buildShareTargetSummary(supabase, user.id, data),
        },
      }, { status: 201 });
    }

    const filePath = String(body.filePath || body.path || "");
    const file = await resolveFilePath(
      supabase,
      user.id,
      normalizePathSegments(filePath.split("/")),
    );
    const shortToken = await generateShortShareToken(supabase);
    const { data, error } = await supabase.from("shared_links").insert({
      file_id: file.file.id,
      folder_id: null,
      target_type: "file",
      token: crypto.randomUUID(),
      short_token: shortToken,
      expires_at: expiresAt,
    }).select().single();

    if (error || !data) {
      throw new ApiRouteError(500, "share_create_failed", error?.message || "Failed to create share link.");
    }

    return jsonResponse({
      share: {
        ...data,
        url: `/s/${data.short_token}`,
        target: await buildShareTargetSummary(supabase, user.id, data),
      },
    }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
