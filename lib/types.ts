export interface FileItem {
  id: string
  name: string
  storage_path: string
  size: number
  mime_type: string | null
  folder_id: string | null
  user_id: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  name: string
  parent_id: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface SharedLink {
  id: string
  file_id: string
  token: string
  expires_at: string | null
  download_count: number
  created_at: string
}

export interface BreadcrumbItem {
  id: string | null
  name: string
}
