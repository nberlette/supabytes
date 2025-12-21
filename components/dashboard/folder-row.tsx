"use client"

import { useState } from "react"
import type { Folder } from "@/lib/types"
import { FolderIcon, MoreVertical, Trash2, Edit, FolderInput, Star, RotateCcw } from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "./confirm-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FolderRowProps {
  folder: Folder
  onNavigate: (folderId: string | null) => void
  onRefresh: () => void
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onDrop?: (folderId: string, item: { type: string; id: string }) => void
  onMove?: (folderId: string) => void
  isTrashView?: boolean
}

export function FolderRow({
  folder,
  onNavigate,
  onRefresh,
  isSelected,
  onSelect,
  onDrop,
  onMove,
  isTrashView,
}: FolderRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFavorite, setIsFavorite] = useState(folder.is_favorite)

  const handleToggleFavorite = async () => {
    const newValue = !isFavorite
    setIsFavorite(newValue)

    const res = await fetch("/api/files/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: folder.id, isFavorite: newValue }),
    })

    if (!res.ok) {
      setIsFavorite(!newValue)
      toast.error("Failed to update favorite")
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await fetch("/api/files/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: [], folderIds: [folder.id] }),
    })

    if (res.ok) {
      toast.success("Folder moved to trash")
      onRefresh()
    } else {
      toast.error("Failed to delete folder")
    }
    setIsDeleting(false)
    setDeleteOpen(false)
  }

  const handleRestore = async () => {
    const res = await fetch("/api/files/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: [], folderIds: [folder.id] }),
    })

    if (res.ok) {
      toast.success("Folder restored")
      onRefresh()
    } else {
      toast.error("Failed to restore folder")
    }
  }

  const handlePermanentDelete = async () => {
    setIsDeleting(true)
    const res = await fetch("/api/files/permanent-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: [], folderIds: [folder.id] }),
    })

    if (res.ok) {
      toast.success("Folder permanently deleted")
      onRefresh()
    } else {
      toast.error("Failed to delete folder")
    }
    setIsDeleting(false)
    setDeleteOpen(false)
  }

  return (
    <>
      <tr
        draggable={!isTrashView}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", JSON.stringify({ type: "folder", id: folder.id }))
          e.dataTransfer.effectAllowed = "move"
        }}
        onDragOver={(e) => {
          if (!isTrashView) {
            e.preventDefault()
            e.dataTransfer.dropEffect = "move"
          }
        }}
        onDrop={(e) => {
          if (isTrashView) return
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
          "border-b border-border hover:bg-muted/50 transition-colors cursor-pointer",
          isSelected && "bg-primary/5",
        )}
        onDoubleClick={() => !isTrashView && onNavigate(folder.id)}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            onSelect?.(folder.id, !isSelected)
          }
        }}
      >
        <td className="px-4 py-3 w-10">
          <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect?.(folder.id, checked as boolean)} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <FolderIcon className="h-8 w-8 text-primary fill-primary/20" />
            <span className="text-sm font-medium text-foreground">{folder.name}</span>
            {isFavorite && !isTrashView && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">--</td>
        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
          {formatDate(folder.updated_at)}
        </td>
        <td className="px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isTrashView ? (
                <>
                  <DropdownMenuItem onClick={handleRestore}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Forever
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onNavigate(folder.id)}>
                    <FolderIcon className="mr-2 h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleFavorite}>
                    <Star className={cn("mr-2 h-4 w-4", isFavorite && "fill-yellow-500 text-yellow-500")} />
                    {isFavorite ? "Remove Favorite" : "Add to Favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMove?.(folder.id)}>
                    <FolderInput className="mr-2 h-4 w-4" />
                    Move to...
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={isTrashView ? "Delete Forever?" : "Move to Trash?"}
        description={
          isTrashView
            ? `"${folder.name}" and all its contents will be permanently deleted. This cannot be undone.`
            : `"${folder.name}" will be moved to trash. You can restore it later.`
        }
        confirmLabel={isTrashView ? "Delete Forever" : "Move to Trash"}
        onConfirm={isTrashView ? handlePermanentDelete : handleDelete}
        isLoading={isDeleting}
        variant={isTrashView ? "destructive" : "default"}
      />
    </>
  )
}
