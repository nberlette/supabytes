import { ApiRouteError } from "@/lib/api/server";
import {
  validateLogicalPathSegment,
  type DashboardView,
  type ShareTargetSummary,
  type ShareTargetType,
} from "@/lib/api/contracts";
import type { FileItem, Folder, SharedLink } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;
type AdminSupabase = ReturnType<typeof createAdminClient>;
type AnySupabase = ServerSupabase | AdminSupabase;

type DbFolder = Omit<Folder, "path">;
type DbFile = Omit<FileItem, "path">;
type DbSharedLink = Omit<SharedLink, "short_token" | "target_type" | "folder_id" | "path" | "url"> & {
  file_id: string | null;
  folder_id: string | null;
  target_type: ShareTargetType;
  short_token: string;
};

const SHORT_TOKEN_ALPHABET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const MAX_TOKEN_GENERATION_ATTEMPTS = 10;

export interface FolderResolution {
  folder: DbFolder | null;
  trail: DbFolder[];
  path: string | null;
}

function queryByOptionalParent<T extends "folders" | "files">(
  supabase: AnySupabase,
  table: T,
  column: string,
  value: string | null,
) {
  const query = supabase.from(table).select("*");
  return value === null ? query.is(column, null) : query.eq(column, value);
}

export function normalizePathSegments(segments?: string[] | null) {
  return (segments || [])
    .map((segment) => {
      try {
        return decodeURIComponent(segment).trim();
      } catch {
        throw new ApiRouteError(400, "invalid_path", "Invalid path segment.");
      }
    })
    .filter(Boolean)
    .map((segment) => {
      if (segment.includes("/")) {
        throw new ApiRouteError(400, "invalid_path", "Invalid path segment.");
      }
      try {
        return validateLogicalPathSegment(segment);
      } catch {
        throw new ApiRouteError(400, "invalid_path", "Invalid path segment.");
      }
    });
}

export function joinPath(...parts: Array<string | null | undefined>) {
  return parts
    .flatMap((part) => (part || "").split("/"))
    .filter(Boolean)
    .join("/");
}

export async function resolveFolderPath(
  supabase: AnySupabase,
  userId: string,
  pathSegments: string[],
  options?: { includeTrashed?: boolean },
): Promise<FolderResolution> {
  let parentId: string | null = null;
  const trail: DbFolder[] = [];

  for (const segment of pathSegments) {
    let query = supabase.from("folders").select("*").eq("user_id", userId).eq(
      "name",
      segment,
    );

    query = parentId === null ? query.is("parent_id", null) : query.eq(
      "parent_id",
      parentId,
    );

    if (!options?.includeTrashed) {
      query = query.eq("is_trashed", false);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      throw new ApiRouteError(404, "folder_not_found", "Folder not found.", {
        path: pathSegments.join("/"),
      });
    }

    const folder = data as DbFolder;
    trail.push(folder);
    parentId = folder.id;
  }

  return {
    folder: trail.at(-1) ?? null,
    trail,
    path: pathSegments.length > 0 ? pathSegments.join("/") : null,
  };
}

export async function resolveFilePath(
  supabase: AnySupabase,
  userId: string,
  pathSegments: string[],
  options?: { includeTrashed?: boolean },
) {
  if (pathSegments.length === 0) {
    throw new ApiRouteError(400, "invalid_path", "File path is required.");
  }

  const fileName = pathSegments.at(-1)!;
  const parentSegments = pathSegments.slice(0, -1);
  const parent = await resolveFolderPath(supabase, userId, parentSegments, options);

  let query = supabase.from("files").select("*").eq("user_id", userId).eq(
    "name",
    fileName,
  );
  query = parent.folder
    ? query.eq("folder_id", parent.folder.id)
    : query.is("folder_id", null);

  if (!options?.includeTrashed) {
    query = query.eq("is_trashed", false);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new ApiRouteError(404, "file_not_found", "File not found.", {
      path: pathSegments.join("/"),
    });
  }

  return {
    file: data as DbFile,
    parent,
    path: pathSegments.join("/"),
  };
}

export async function createFolderPathCache(
  supabase: AnySupabase,
  userId: string,
) {
  const { data, error } = await supabase.from("folders").select(
    "id, name, parent_id",
  ).eq("user_id", userId);

  if (error) {
    throw new ApiRouteError(500, "folder_lookup_failed", error.message);
  }

  const folders = (data || []) as Array<Pick<DbFolder, "id" | "name" | "parent_id">>;
  const folderMap = new Map(folders.map((folder) => [folder.id, folder]));
  const cache = new Map<string, string>();

  const resolvePath = (folderId: string | null): string => {
    if (!folderId) return "";
    if (cache.has(folderId)) return cache.get(folderId)!;

    const folder = folderMap.get(folderId);
    if (!folder) return "";

    const path = joinPath(resolvePath(folder.parent_id), folder.name);
    cache.set(folderId, path);
    return path;
  };

  return {
    resolveFolderPath: resolvePath,
    resolveFilePath(file: Pick<DbFile, "folder_id" | "name">) {
      return joinPath(resolvePath(file.folder_id), file.name);
    },
  };
}

type FolderPathCache = Awaited<ReturnType<typeof createFolderPathCache>>;

export async function getFolderPathById(
  supabase: AnySupabase,
  userId: string,
  folderId: string,
) {
  const cache = await createFolderPathCache(supabase, userId);
  return cache.resolveFolderPath(folderId);
}

export async function listOwnedSharedLinks(
  supabase: AnySupabase,
) {
  const { data, error } = await supabase.from("shared_links").select("*").order(
    "created_at",
    { ascending: false },
  );

  if (error) {
    throw new ApiRouteError(500, "share_lookup_failed", error.message);
  }

  return (data || []) as DbSharedLink[];
}

/**
 * Deduplicates rows returned from join-based shared resource queries.
 * Duplicate ids keep the first row encountered so the result stays stable for
 * already-ordered query output.
 *
 * @param items Rows that may contain duplicate ids after joining through shared_links.
 * @returns A single row per id, with the first occurrence preserved.
 */
function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function toApiFolder(folder: DbFolder, path: string): Folder {
  return {
    ...folder,
    path,
  };
}

export function toApiFile(file: DbFile, path: string): FileItem {
  return {
    ...file,
    path,
  };
}

export function folderToBreadcrumbs(trail: DbFolder[]) {
  return [
    { id: null, name: "My Files", path: null },
    ...trail.map((folder, index) => ({
      id: folder.id,
      name: folder.name,
      path: trail.slice(0, index + 1).map((item) => item.name).join("/"),
    })),
  ];
}

export async function ensureFolderNameAvailable(
  supabase: AnySupabase,
  userId: string,
  name: string,
  parentId: string | null,
  excludeId?: string,
) {
  let query = supabase.from("folders").select("id").eq("user_id", userId).eq(
    "name",
    name,
  ).eq("is_trashed", false);
  query = parentId === null ? query.is("parent_id", null) : query.eq(
    "parent_id",
    parentId,
  );

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query.limit(1);
  if (data && data.length > 0) {
    throw new ApiRouteError(
      409,
      "folder_conflict",
      `A folder named "${name}" already exists in that location.`,
    );
  }
}

export async function ensureFileNameAvailable(
  supabase: AnySupabase,
  userId: string,
  name: string,
  folderId: string | null,
  excludeId?: string,
) {
  let query = supabase.from("files").select("id").eq("user_id", userId).eq(
    "name",
    name,
  ).eq("is_trashed", false);
  query = folderId === null ? query.is("folder_id", null) : query.eq(
    "folder_id",
    folderId,
  );

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query.limit(1);
  if (data && data.length > 0) {
    throw new ApiRouteError(
      409,
      "file_conflict",
      `A file named "${name}" already exists in that location.`,
    );
  }
}

export async function listFolderChildren(
  supabase: AnySupabase,
  userId: string,
  pathSegments: string[],
  view: DashboardView,
) {
  if (view === "files") {
    const resolved = await resolveFolderPath(supabase, userId, pathSegments);
    const parentId = resolved.folder?.id ?? null;
    const currentPath = resolved.path || "";

    const [filesResult, foldersResult] = await Promise.all([
      queryByOptionalParent(supabase, "files", "folder_id", parentId)
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .order("name"),
      queryByOptionalParent(supabase, "folders", "parent_id", parentId)
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .order("name"),
    ]);

    const files = (filesResult.data || []).map((file) =>
      toApiFile(file as DbFile, joinPath(currentPath, file.name))
    );
    const folders = (foldersResult.data || []).map((folder) =>
      toApiFolder(folder as DbFolder, joinPath(currentPath, folder.name))
    );
    const folder = resolved.folder
      ? toApiFolder(resolved.folder, currentPath)
      : null;

    return {
      folder,
      files,
      folders,
      breadcrumbs: folderToBreadcrumbs(resolved.trail),
    };
  }

  const pathCache = await createFolderPathCache(supabase, userId);

  if (view === "trash") {
    const [filesResult, foldersResult] = await Promise.all([
      supabase.from("files").select("*").eq("user_id", userId).eq(
        "is_trashed",
        true,
      ).order("updated_at", { ascending: false }),
      supabase.from("folders").select("*").eq("user_id", userId).eq(
        "is_trashed",
        true,
      ).order("updated_at", { ascending: false }),
    ]);

    return {
      folder: null,
      files: (filesResult.data || []).map((file) =>
        toApiFile(file as DbFile, pathCache.resolveFilePath(file as DbFile))
      ),
      folders: (foldersResult.data || []).map((folder) =>
        toApiFolder(
          folder as DbFolder,
          pathCache.resolveFolderPath((folder as DbFolder).id),
        )
      ),
      breadcrumbs: [{ id: null, name: "Trash", path: null }],
    };
  }

  if (view === "favorites") {
    const [filesResult, foldersResult] = await Promise.all([
      supabase.from("files").select("*").eq("user_id", userId).eq(
        "is_favorite",
        true,
      ).eq("is_trashed", false).order("name"),
      supabase.from("folders").select("*").eq("user_id", userId).eq(
        "is_favorite",
        true,
      ).eq("is_trashed", false).order("name"),
    ]);

    return {
      folder: null,
      files: (filesResult.data || []).map((file) =>
        toApiFile(file as DbFile, pathCache.resolveFilePath(file as DbFile))
      ),
      folders: (foldersResult.data || []).map((folder) =>
        toApiFolder(
          folder as DbFolder,
          pathCache.resolveFolderPath((folder as DbFolder).id),
        )
      ),
      breadcrumbs: [{ id: null, name: "Favorites", path: null }],
    };
  }

  const [filesResult, foldersResult] = await Promise.all([
    supabase.from("files").select("*, shared_links!inner(id)").eq("user_id", userId).eq(
      "is_trashed",
      false,
    ).order("name"),
    supabase.from("folders").select("*, shared_links!inner(id)").eq("user_id", userId).eq(
      "is_trashed",
      false,
    ).order("name"),
  ]);

  if (filesResult.error || foldersResult.error) {
    throw new ApiRouteError(
      500,
      "share_lookup_failed",
      filesResult.error?.message || foldersResult.error?.message ||
        "Failed to load shared resources.",
    );
  }

  const files = uniqueById(
    ((filesResult.data || []) as Array<DbFile & { shared_links?: Array<{ id: string }> }>)
      .map(({ shared_links: _sharedLinks, ...file }) => file as DbFile),
  );
  const folders = uniqueById(
    ((foldersResult.data || []) as Array<DbFolder & { shared_links?: Array<{ id: string }> }>)
      .map(({ shared_links: _sharedLinks, ...folder }) => folder as DbFolder),
  );

  return {
    folder: null,
    files: files.map((file) =>
      toApiFile(file, pathCache.resolveFilePath(file))
    ),
    folders: folders.map((folder) =>
      toApiFolder(
        folder,
        pathCache.resolveFolderPath(folder.id),
      )
    ),
    breadcrumbs: [{ id: null, name: "Shared", path: null }],
  };
}

export async function listFoldersAtPath(
  supabase: AnySupabase,
  userId: string,
  pathSegments: string[],
  excludeFolderIds: string[] = [],
) {
  const resolved = await resolveFolderPath(supabase, userId, pathSegments);
  const parentId = resolved.folder?.id ?? null;
  const currentPath = resolved.path || "";
  const result = await queryByOptionalParent(supabase, "folders", "parent_id", parentId)
    .eq("user_id", userId)
    .eq("is_trashed", false)
    .order("name");

  return {
    current: resolved.folder ? toApiFolder(resolved.folder, currentPath) : null,
    breadcrumbs: folderToBreadcrumbs(resolved.trail),
    folders: (result.data || [])
      .filter((folder) => !excludeFolderIds.includes(folder.id))
      .map((folder) =>
        toApiFolder(folder as DbFolder, joinPath(currentPath, folder.name))
      ),
  };
}

export async function getFolderDescendantIds(
  supabase: AnySupabase,
  userId: string,
  folderId: string,
): Promise<{ folderIds: string[]; fileIds: string[]; filePaths: string[] }> {
  const folderIds = new Set<string>([folderId]);
  const fileIds = new Set<string>();
  const filePaths = new Set<string>();
  const queue = [folderId];

  while (queue.length > 0) {
    const currentFolderId = queue.shift()!;
    const [{ data: folders }, { data: files }] = await Promise.all([
      supabase.from("folders").select("id").eq("user_id", userId).eq(
        "parent_id",
        currentFolderId,
      ),
      supabase.from("files").select("id, storage_path").eq("user_id", userId).eq(
        "folder_id",
        currentFolderId,
      ),
    ]);

    for (const child of folders || []) {
      if (!folderIds.has(child.id)) {
        folderIds.add(child.id);
        queue.push(child.id);
      }
    }

    for (const file of files || []) {
      fileIds.add(file.id);
      filePaths.add(file.storage_path);
    }
  }

  return {
    folderIds: Array.from(folderIds),
    fileIds: Array.from(fileIds),
    filePaths: Array.from(filePaths),
  };
}

export async function trashFolderTree(
  supabase: AnySupabase,
  userId: string,
  folderId: string,
) {
  const now = new Date().toISOString();
  const descendants = await getFolderDescendantIds(supabase, userId, folderId);

  if (descendants.fileIds.length > 0) {
    const { error } = await supabase.from("files").update({
      is_trashed: true,
      trashed_at: now,
      updated_at: now,
    }).in("id", descendants.fileIds).eq("user_id", userId);

    if (error) {
      throw new ApiRouteError(500, "trash_failed", error.message);
    }
  }

  const { error } = await supabase.from("folders").update({
    is_trashed: true,
    trashed_at: now,
    updated_at: now,
  }).in("id", descendants.folderIds).eq("user_id", userId);

  if (error) {
    throw new ApiRouteError(500, "trash_failed", error.message);
  }
}

export async function restoreFolderTree(
  supabase: AnySupabase,
  userId: string,
  folderId: string,
) {
  const now = new Date().toISOString();
  const descendants = await getFolderDescendantIds(supabase, userId, folderId);

  if (descendants.fileIds.length > 0) {
    const { error } = await supabase.from("files").update({
      is_trashed: false,
      trashed_at: null,
      updated_at: now,
    }).in("id", descendants.fileIds).eq("user_id", userId);

    if (error) {
      throw new ApiRouteError(500, "restore_failed", error.message);
    }
  }

  const { error } = await supabase.from("folders").update({
    is_trashed: false,
    trashed_at: null,
    updated_at: now,
  }).in("id", descendants.folderIds).eq("user_id", userId);

  if (error) {
    throw new ApiRouteError(500, "restore_failed", error.message);
  }
}

export async function permanentlyDeleteFolderTree(
  supabase: AnySupabase,
  userId: string,
  folderId: string,
) {
  const descendants = await getFolderDescendantIds(supabase, userId, folderId);

  if (descendants.filePaths.length > 0) {
    const { error } = await supabase.storage.from("files").remove(
      descendants.filePaths,
    );

    if (error) {
      throw new ApiRouteError(500, "delete_failed", error.message);
    }
  }

  const { error } = await supabase.from("folders").delete().eq("user_id", userId)
    .eq("id", folderId);

  if (error) {
    throw new ApiRouteError(500, "delete_failed", error.message);
  }
}

export function makeStoragePath(userId: string, name: string) {
  const safeName = name.replace(/\.\.+/g, "-").replace(/[^\w-]+/g, "-") ||
    "file";
  return `${userId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}

export async function uploadFileBlob(
  supabase: AnySupabase,
  file: File,
  storagePath: string,
  upsert: boolean,
) {
  const { error } = await supabase.storage.from("files").upload(
    storagePath,
    file,
    {
      cacheControl: "3600",
      upsert,
      contentType: file.type || undefined,
    },
  );

  if (error) {
    throw new ApiRouteError(500, "upload_failed", error.message);
  }
}

export async function removeStorageObject(
  supabase: AnySupabase,
  storagePath: string,
) {
  const { error } = await supabase.storage.from("files").remove([storagePath]);

  if (error) {
    throw new ApiRouteError(500, "storage_delete_failed", error.message);
  }
}

export async function downloadStorageObject(
  supabase: AnySupabase,
  storagePath: string,
) {
  const { data, error } = await supabase.storage.from("files").download(storagePath);

  if (error || !data) {
    throw new ApiRouteError(
      500,
      "download_failed",
      error?.message || "Failed to download file.",
    );
  }

  return data;
}

export async function isFolderDescendantOf(
  supabase: AnySupabase,
  userId: string,
  folderId: string,
  possibleParentId: string | null,
) {
  let currentId = possibleParentId;

  while (currentId) {
    if (currentId === folderId) return true;

    const { data } = await supabase.from("folders").select("parent_id").eq(
      "user_id",
      userId,
    ).eq("id", currentId).single();

    currentId = data?.parent_id || null;
  }

  return false;
}

export async function generateShortShareToken(supabase: AnySupabase) {
  for (let attemptNumber = 0;
    attemptNumber < MAX_TOKEN_GENERATION_ATTEMPTS;
    attemptNumber++) {
    const tokenChars: string[] = [];
    const alphabetLength = SHORT_TOKEN_ALPHABET.length;
    const maxUnbiasedValue = Math.floor(256 / alphabetLength) * alphabetLength;

    while (tokenChars.length < 8) {
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      for (const value of bytes) {
        if (value >= maxUnbiasedValue) continue;
        tokenChars.push(SHORT_TOKEN_ALPHABET[value % alphabetLength]);
        if (tokenChars.length === 8) break;
      }
    }

    const token = tokenChars.join("");

    const { data } = await supabase.from("shared_links").select("id").eq(
      "short_token",
      token,
    ).maybeSingle();

    if (!data) {
      return token;
    }
  }

  throw new ApiRouteError(
    500,
    "share_token_generation_failed",
    "Failed to generate a unique share token.",
  );
}

export async function buildShareTargetSummary(
  supabase: AnySupabase,
  userId: string,
  link: DbSharedLink,
  pathCache?: FolderPathCache,
): Promise<ShareTargetSummary> {
  const resolvedPathCache = pathCache || await createFolderPathCache(supabase, userId);

  if (link.target_type === "folder" && link.folder_id) {
    const { data: folder } = await supabase.from("folders").select("*").eq(
      "id",
      link.folder_id,
    ).single();

    if (!folder) {
      throw new ApiRouteError(404, "share_target_not_found", "Share target not found.");
    }

    return {
      id: folder.id,
      type: "folder",
      name: folder.name,
      path: resolvedPathCache.resolveFolderPath(folder.id),
    };
  }

  const { data: file } = await supabase.from("files").select("*").eq(
    "id",
    link.file_id,
  ).single();

  if (!file) {
    throw new ApiRouteError(404, "share_target_not_found", "Share target not found.");
  }

  return {
    id: file.id,
    type: "file",
    name: file.name,
    path: resolvedPathCache.resolveFilePath(file as DbFile),
    mime_type: file.mime_type,
    size: file.size,
  };
}
