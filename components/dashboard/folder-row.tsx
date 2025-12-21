"use client"

import type { Folder } from "@/lib/types"
import { FolderIcon, MoreVertical, Trash2, Edit } from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface FolderRowProps {
  folder: Folder
  onNavigate: (folderId: string | null) => void
  onRefresh: () => void
}

export function FolderRow({ folder, onNavigate, onRefresh }: FolderRowProps) {
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
    <tr
      className="border-b hover:bg-slate-50 transition-colors cursor-pointer"
      onDoubleClick={() => onNavigate(folder.id)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FolderIcon className="h-8 w-8 text-indigo-500 fill-indigo-100" />
          <span className="text-sm font-medium text-slate-900">{folder.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">--</td>
      <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{formatDate(folder.updated_at)}</td>
      <td className="px-4 py-3">
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
      </td>
    </tr>
  )
}
