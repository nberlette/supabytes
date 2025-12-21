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
import { MoreVertical, Download, Share2, Trash2, Link } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ShareDialog } from "./share-dialog"

interface FileActionsProps {
  file: FileItem
  onRefresh: () => void
  userId: string
}

export function FileActions({ file, onRefresh, userId }: FileActionsProps) {
  const [shareOpen, setShareOpen] = useState(false)

  const handleDownload = () => {
    window.open(`/api/files/download/${file.id}`, "_blank")
  }

  const handleDelete = async () => {
    const supabase = createClient()

    // Delete from storage
    const { error: storageError } = await supabase.storage.from("files").remove([file.storage_path])

    if (storageError) {
      toast.error("Failed to delete file from storage")
      return
    }

    // Delete from database
    const { error: dbError } = await supabase.from("files").delete().eq("id", file.id)

    if (dbError) {
      toast.error("Failed to delete file record")
    } else {
      toast.success("File deleted")
      onRefresh()
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
          <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} file={file} />
    </>
  )
}
