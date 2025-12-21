"use client"

import { Button } from "@/components/ui/button"
import { Trash2, FolderInput, X, Download } from "lucide-react"

interface SelectionToolbarProps {
  selectedCount: number
  onClear: () => void
  onDelete: () => void
  onMove: () => void
  onDownload: () => void
  isDeleting?: boolean
}

export function SelectionToolbar({
  selectedCount,
  onClear,
  onDelete,
  onMove,
  onDownload,
  isDeleting,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className="flex items-center gap-2 bg-slate-900 text-white 
        px-4 py-3 rounded-lg shadow-lg"
      >
        <span className="text-sm font-medium mr-2">{selectedCount} selected</span>

        <div className="h-4 w-px bg-slate-600" />

        <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>

        <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" onClick={onMove}>
          <FolderInput className="h-4 w-4 mr-2" />
          Move
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 hover:bg-slate-800 hover:text-red-300"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>

        <div className="h-4 w-px bg-slate-600" />

        <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800 h-8 w-8" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
