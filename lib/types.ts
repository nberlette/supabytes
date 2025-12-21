export interface FileItem {
  id: string;
  name: string;
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
  parent_id: string | null;
  user_id: string;
  is_trashed: boolean;
  is_favorite: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedLink {
  id: string;
  file_id: string;
  token: string;
  expires_at: string | null;
  download_count: number;
  created_at: string;
}

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
}

export type SelectableItem = { type: "file"; item: FileItem } | {
  type: "folder";
  item: Folder;
};

export interface SelectionState {
  selectedFiles: Set<string>;
  selectedFolders: Set<string>;
}
