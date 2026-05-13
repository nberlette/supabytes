"use client";

import type {
  ApiResponse,
  ApiSharedLink,
  DashboardView,
  FolderListingData,
  FolderListingMeta,
  StorageSummary,
} from "@/lib/api/contracts";
import type { UserPreferences } from "@/lib/types";
import { encodeApiPath } from "@/lib/api/contracts";

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      throw new Error(payload.error?.message || "Request failed");
    }

    throw new Error("Request failed");
  }

  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  throw new Error("Unexpected response type");
}

export function buildFileApiPath(path: string) {
  return `/api/v2/files/${encodeApiPath(path)}`;
}

export function buildFolderApiPath(path?: string | null) {
  const encoded = encodeApiPath(path);
  return encoded ? `/api/v2/folders/${encoded}` : "/api/v2/folders";
}

export function buildDownloadUrl(path: string) {
  return buildFileApiPath(path);
}

export async function fetchFolderView(
  path: string | null,
  view: DashboardView,
) {
  const base = buildFolderApiPath(path);
  const query = view === "files" ? "" : `?view=${encodeURIComponent(view)}`;
  return apiFetch<ApiResponse<FolderListingData, FolderListingMeta>>(`${base}${query}`);
}

export async function fetchFolderChoices(
  path: string | null,
  excludeFolderIds: string[] = [],
) {
  const params = new URLSearchParams();
  if (excludeFolderIds.length > 0) {
    params.set("excludeFolderIds", excludeFolderIds.join(","));
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiFetch<ApiResponse<FolderListingData & { breadcrumbs: FolderListingMeta["breadcrumbs"] }>>(
    `${buildFolderApiPath(path)}${suffix}`,
  );
}

export async function createFolder(path: string | null, name: string) {
  return apiFetch<ApiResponse<{ folder: { path: string } }>>(buildFolderApiPath(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function updateFolder(
  path: string,
  body: Record<string, unknown>,
) {
  return apiFetch<ApiResponse<{ folder: { path: string } }>>(buildFolderApiPath(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteFolder(path: string, permanent = false) {
  const query = permanent ? "?permanent=true" : "";
  return apiFetch<ApiResponse<{ success: true }>>(`${buildFolderApiPath(path)}${query}`, {
    method: "DELETE",
  });
}

export async function uploadFile(
  path: string,
  file: File,
  method: "POST" | "PUT" = "POST",
) {
  const formData = new FormData();
  formData.set("file", file);
  return apiFetch<ApiResponse<{ file: { path: string } }>>(buildFileApiPath(path), {
    method,
    body: formData,
  });
}

export async function updateFile(
  path: string,
  body: Record<string, unknown>,
) {
  return apiFetch<ApiResponse<{ file: { path: string } }>>(buildFileApiPath(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteFile(path: string, permanent = false) {
  const query = permanent ? "?permanent=true" : "";
  return apiFetch<ApiResponse<{ success: true }>>(`${buildFileApiPath(path)}${query}`, {
    method: "DELETE",
  });
}

export async function runBulkOperation(body: Record<string, unknown>) {
  return apiFetch<ApiResponse<{ success: true }>>("/api/v2/operations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function bulkDelete(body: Record<string, unknown>) {
  return apiFetch<ApiResponse<{ success: true }>>("/api/v2/operations", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function listShares() {
  return apiFetch<ApiResponse<{ shares: ApiSharedLink[] }>>("/api/v2/shares");
}

export async function createShare(body: Record<string, unknown>) {
  return apiFetch<ApiResponse<{ share: ApiSharedLink }>>("/api/v2/shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteShare(token: string) {
  return apiFetch<ApiResponse<{ success: true }>>(`/api/v2/shares/${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}

export async function fetchStorageSummary() {
  return apiFetch<ApiResponse<StorageSummary>>("/api/v2/me/storage");
}

export async function savePreferences(payload: {
  view_mode: "grid" | "list";
  theme: "light" | "dark" | "system";
}) {
  return apiFetch<ApiResponse<{ preferences: UserPreferences }>>("/api/v2/me/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchPublicShare(token: string) {
  return apiFetch<ApiResponse<{ share: ApiSharedLink }>>(`/api/v2/shares/${encodeURIComponent(token)}`);
}
