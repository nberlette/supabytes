export interface FileItem {
  id: string;
  name: string;
  path: string;
  storage_path: string;
  size: number;
  mime_type: string | null;
  folder_id: string | null;
  user_id: string;
  is_public: boolean;
  is_trashed: boolean;
  is_favorite: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  parent_id: string | null;
  user_id: string;
  is_trashed: boolean;
  is_favorite: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SharedLinkBase {
  id: string;
  token: string;
  short_token: string;
  expires_at: string | null;
  download_count: number;
  created_at: string;
  url?: string;
}

export type SharedLink =
  | (SharedLinkBase & {
    file_id: string;
    folder_id: null;
    target_type: "file";
  })
  | (SharedLinkBase & {
    file_id: null;
    folder_id: string;
    target_type: "folder";
  });

export interface UserPreferences {
  id: string;
  user_id: string;
  view_mode: "grid" | "list";
  theme: "light" | "dark" | "system";
  storage_quota_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
  path: string | null;
}

export type SelectableItem = { type: "file"; item: FileItem } | {
  type: "folder";
  item: Folder;
};

export interface SelectionState {
  selectedFiles: Set<string>;
  selectedFolders: Set<string>;
}
