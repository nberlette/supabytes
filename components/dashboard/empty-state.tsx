"use client"

import { Upload, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { UploadDialog } from "./upload-dialog"
import { CreateFolderDialog } from "./create-folder-dialog"

interface EmptyStateProps {
  currentFolder: string | null
  onRefresh: () => void
}

export function EmptyState({ currentFolder, onRefresh }: EmptyStateProps) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Upload className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No files yet</h3>
        <p className="text-sm text-slate-600 mb-6">Upload files or create a folder to get started</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
          <Button variant="outline" onClick={() => setFolderOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        currentFolder={currentFolder}
        onSuccess={onRefresh}
      />

      <CreateFolderDialog
        open={folderOpen}
        onOpenChange={setFolderOpen}
        currentFolder={currentFolder}
        onSuccess={onRefresh}
      />
    </div>
  )
}
