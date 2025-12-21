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
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Share2, Trash2, FolderInput } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileCardProps {
  file: FileItem
  onRefresh: () => void
  userId: string
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onMove?: (fileId: string) => void
  isDragOver?: boolean
}

export function FileCard({ file, onRefresh, userId, isSelected, onSelect, onMove, isDragOver }: FileCardProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(
              "text/plain",
              JSON.stringify({
                type: "file",
                id: file.id,
              }),
            )
            e.dataTransfer.effectAllowed = "move"
          }}
          className={cn(
            "group relative bg-white rounded-lg border p-4",
            "hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
            isSelected && "ring-2 ring-indigo-500 bg-indigo-50",
            isDragOver && "ring-2 ring-indigo-300 bg-indigo-50",
          )}
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              onSelect?.(file.id, !isSelected)
            }
          }}
        >
          {onSelect && (
            <div
              className={cn(
                "absolute top-2 left-2 transition-opacity",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(file.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="flex flex-col items-center gap-3">
            <FileIcon mimeType={file.mime_type} className="h-12 w-12" />
            <div className="w-full text-center">
              <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className={cn("absolute top-2 right-2 transition-opacity", "opacity-0 group-hover:opacity-100")}>
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
        <ContextMenuItem onClick={() => onMove?.(file.id)}>
          <FolderInput className="mr-2 h-4 w-4" />
          Move to...
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
