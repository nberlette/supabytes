"use client"

import type { Folder } from "@/lib/types"
import { FolderIcon, MoreVertical, Trash2, Edit, FolderInput } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FolderCardProps {
  folder: Folder
  onNavigate: (folderId: string | null) => void
  onRefresh: () => void
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onDrop?: (folderId: string, item: { type: string; id: string }) => void
  onMove?: (folderId: string) => void
}

export function FolderCard({ folder, onNavigate, onRefresh, isSelected, onSelect, onDrop, onMove }: FolderCardProps) {
  const handleDelete = async () => {
    const supabase = createClient()
    const { error } = await supabase.from("folders").delete().eq("id", folder.id)

    if (error) {
      toast.error("Failed to delete folder")
    } else {
      toast.success("Folder deleted")
      onRefresh()
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "text/plain",
          JSON.stringify({
            type: "folder",
            id: folder.id,
          }),
        )
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          const data = JSON.parse(e.dataTransfer.getData("text/plain"))
          if (data.id !== folder.id) {
            onDrop?.(folder.id, data)
          }
        } catch {
          // Invalid drop data
        }
      }}
      className={cn(
        "group relative bg-white rounded-lg border p-4",
        "hover:shadow-md transition-all cursor-pointer",
        isSelected && "ring-2 ring-indigo-500 bg-indigo-50",
      )}
      onDoubleClick={() => onNavigate(folder.id)}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          onSelect?.(folder.id, !isSelected)
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
            onCheckedChange={(checked) => onSelect(folder.id, checked as boolean)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="flex flex-col items-center gap-3">
        <FolderIcon className="h-12 w-12 text-indigo-500 fill-indigo-100" />
        <div className="w-full text-center">
          <p className="text-sm font-medium text-slate-900 truncate">{folder.name}</p>
          <p className="text-xs text-slate-500">Folder</p>
        </div>
      </div>
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
          transition-opacity"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onNavigate(folder.id)}>
              <FolderIcon className="mr-2 h-4 w-4" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove?.(folder.id)}>
              <FolderInput className="mr-2 h-4 w-4" />
              Move to...
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
