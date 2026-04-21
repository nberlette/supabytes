import type {
  BreadcrumbItem,
  FileItem,
  Folder,
  SharedLink,
  UserPreferences,
} from "@/lib/types";

export type DashboardView = "files" | "shared" | "trash" | "favorites";
export type ShareTargetType = "file" | "folder";

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T, M = Record<string, never>, I = undefined> {
  data: T;
  meta?: M;
  included?: I;
}

export interface ShareTargetSummary {
  id: string;
  type: ShareTargetType;
  name: string;
  path: string;
  mime_type?: string | null;
  size?: number;
}

export type ApiSharedLink = SharedLink & {
  target: ShareTargetSummary;
  url: string;
};

export interface FolderListingData {
  folder: Folder | null;
  files: FileItem[];
  folders: Folder[];
}

export interface FolderListingMeta {
  view: DashboardView;
  breadcrumbs: BreadcrumbItem[];
  counts: {
    files: number;
    folders: number;
    total: number;
  };
}

export interface StorageSummary {
  used: number;
  quota: number;
  percent: number;
}

export interface PreferencesPayload {
  preferences: UserPreferences | null;
}

export function validateLogicalPathSegment(segment: string) {
  if (segment === "." || segment === "..") {
    throw new Error("Invalid path segment.");
  }
  return segment;
}

export function encodeApiPath(path: string | null | undefined) {
  if (!path) return "";
  return path.split("/").filter(Boolean).map((segment) =>
    encodeURIComponent(validateLogicalPathSegment(segment))
  ).join("/");
}

export function joinLogicalPath(...parts: Array<string | null | undefined>) {
  return parts
    .flatMap((part) => (part || "").split("/"))
    .filter(Boolean)
    .join("/");
}
