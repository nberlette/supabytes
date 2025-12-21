"use client"

import type { Folder } from "@/lib/types"
import { FolderIcon, MoreVertical, Trash2, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface FolderCardProps {
  folder: Folder
  onNavigate: (folderId: string | null) => void
  onRefresh: () => void
}

export function FolderCard({ folder, onNavigate, onRefresh }: FolderCardProps) {
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
      className="group relative bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
      onDoubleClick={() => onNavigate(folder.id)}
    >
      <div className="flex flex-col items-center gap-3">
        <FolderIcon className="h-12 w-12 text-indigo-500 fill-indigo-100" />
        <div className="w-full text-center">
          <p className="text-sm font-medium text-slate-900 truncate">{folder.name}</p>
          <p className="text-xs text-slate-500">Folder</p>
        </div>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
