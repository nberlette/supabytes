"use client"

import type { FileItem, Folder } from "@/lib/types"
import { FileCard } from "./file-card"
import { FolderCard } from "./folder-card"
import { FileRow } from "./file-row"
import { FolderRow } from "./folder-row"
import { EmptyState } from "./empty-state"
import { Skeleton } from "@/components/ui/skeleton"

interface FileExplorerProps {
  files: FileItem[]
  folders: Folder[]
  viewMode: "grid" | "list"
  isLoading: boolean
  currentFolder: string | null
  onNavigate: (folderId: string | null) => void
  onRefresh: () => void
  userId: string
}

export function FileExplorer({
  files,
  folders,
  viewMode,
  isLoading,
  currentFolder,
  onNavigate,
  onRefresh,
  userId,
}: FileExplorerProps) {
  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (files.length === 0 && folders.length === 0) {
    return <EmptyState currentFolder={currentFolder} onRefresh={onRefresh} />
  }

  if (viewMode === "grid") {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {folders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} onNavigate={onNavigate} onRefresh={onRefresh} />
          ))}
          {files.map((file) => (
            <FileCard key={file.id} file={file} onRefresh={onRefresh} userId={userId} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 hidden sm:table-cell">Size</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 hidden md:table-cell">Modified</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {folders.map((folder) => (
              <FolderRow key={folder.id} folder={folder} onNavigate={onNavigate} onRefresh={onRefresh} />
            ))}
            {files.map((file) => (
              <FileRow key={file.id} file={file} onRefresh={onRefresh} userId={userId} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
