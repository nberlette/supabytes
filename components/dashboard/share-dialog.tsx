"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Copy, ExternalLink } from "lucide-react"
import type { FileItem, SharedLink } from "@/lib/types"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem
}

export function ShareDialog({ open, onOpenChange, file }: ShareDialogProps) {
  const [sharedLink, setSharedLink] = useState<SharedLink | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchExistingLink()
    }
  }, [open, file.id])

  const fetchExistingLink = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("shared_links").select("*").eq("file_id", file.id).single()

    if (data) {
      setSharedLink(data)
    }
  }

  const createShareLink = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const token = crypto.randomUUID()

    const { data, error } = await supabase
      .from("shared_links")
      .insert({
        file_id: file.id,
        token,
      })
      .select()
      .single()

    if (error) {
      toast.error("Failed to create share link")
    } else {
      setSharedLink(data)
      toast.success("Share link created")
    }

    setIsLoading(false)
  }

  const deleteShareLink = async () => {
    if (!sharedLink) return

    const supabase = createClient()
    const { error } = await supabase.from("shared_links").delete().eq("id", sharedLink.id)

    if (error) {
      toast.error("Failed to delete share link")
    } else {
      setSharedLink(null)
      toast.success("Share link deleted")
    }
  }

  const shareUrl = sharedLink
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${sharedLink.token}`
    : ""

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success("Link copied to clipboard")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
          <DialogDescription>Create a public link to share "{file.name}"</DialogDescription>
        </DialogHeader>

        {sharedLink ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open(shareUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-500">Downloaded {sharedLink.download_count} times</p>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-600 mb-4">No share link exists for this file yet.</p>
            <Button onClick={createShareLink} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Share Link"}
            </Button>
          </div>
        )}

        <DialogFooter>
          {sharedLink && (
            <Button variant="destructive" onClick={deleteShareLink}>
              Delete Link
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
