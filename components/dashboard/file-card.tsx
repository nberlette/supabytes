"use client"

import type { FileItem } from "@/lib/types"
import { formatFileSize } from "@/lib/utils/format"
import { FileIcon } from "./file-icon"
import { FileActions } from "./file-actions"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Download, Share2, Trash2 } from "lucide-react"

interface FileCardProps {
  file: FileItem
  onRefresh: () => void
  userId: string
}

export function FileCard({ file, onRefresh, userId }: FileCardProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="group relative bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-default">
          <div className="flex flex-col items-center gap-3">
            <FileIcon mimeType={file.mime_type} className="h-12 w-12" />
            <div className="w-full text-center">
              <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <FileActions file={file} onRefresh={onRefresh} userId={userId} />
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => window.open(`/api/files/download/${file.id}`, "_blank")}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </ContextMenuItem>
        <ContextMenuItem>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
