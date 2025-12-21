"use client"

import { useState } from "react"
import type { FileItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Download, Share2, Trash2, Link, Star } from "lucide-react"
import { toast } from "sonner"
import { ShareDialog } from "./share-dialog"
import { ConfirmDialog } from "./confirm-dialog"
import { cn } from "@/lib/utils"

interface FileActionsProps {
  file: FileItem
  onRefresh: () => void
  userId: string
}

export function FileActions({ file, onRefresh, userId }: FileActionsProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFavorite, setIsFavorite] = useState(file.is_favorite)

  const handleDownload = () => {
    window.open(`/api/files/download/${file.id}`, "_blank")
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    const res = await fetch("/api/files/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: [file.id], folderIds: [] }),
    })

    if (res.ok) {
      toast.success("File moved to trash")
      onRefresh()
    } else {
      toast.error("Failed to delete file")
    }

    setIsDeleting(false)
    setDeleteOpen(false)
  }

  const handleToggleFavorite = async () => {
    const newValue = !isFavorite
    setIsFavorite(newValue)

    const res = await fetch("/api/files/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: file.id, isFavorite: newValue }),
    })

    if (!res.ok) {
      setIsFavorite(!newValue)
      toast.error("Failed to update favorite")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShareOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleFavorite}>
            <Star className={cn("mr-2 h-4 w-4", isFavorite && "fill-yellow-500 text-yellow-500")} />
            {isFavorite ? "Remove Favorite" : "Add to Favorites"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/api/files/download/${file.id}`)
              toast.success("Download link copied")
            }}
          >
            <Link className="mr-2 h-4 w-4" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Move to Trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} file={file} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Move to Trash?"
        description={`"${file.name}" will be moved to trash. You can restore it later.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
