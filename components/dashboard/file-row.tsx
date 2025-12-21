"use client"

import type { FileItem } from "@/lib/types"
import { formatFileSize, formatDate } from "@/lib/utils/format"
import { FileIcon } from "./file-icon"
import { FileActions } from "./file-actions"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface FileRowProps {
  file: FileItem
  onRefresh: () => void
  userId: string
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
}

export function FileRow({ file, onRefresh, userId, isSelected, onSelect }: FileRowProps) {
  return (
    <tr
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
      className={cn("border-b hover:bg-slate-50 transition-colors cursor-grab", isSelected && "bg-indigo-50")}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          onSelect?.(file.id, !isSelected)
        }
      }}
    >
      <td className="px-4 py-3 w-10">
        <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect?.(file.id, checked as boolean)} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FileIcon mimeType={file.mime_type} className="h-8 w-8" />
          <span className="text-sm font-medium text-slate-900 truncate">{file.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">{formatFileSize(file.size)}</td>
      <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{formatDate(file.updated_at)}</td>
      <td className="px-4 py-3">
        <FileActions file={file} onRefresh={onRefresh} userId={userId} />
      </td>
    </tr>
  )
}
