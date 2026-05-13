"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import type { FileItem, Folder } from "@/lib/types";
import type { ApiSharedLink } from "@/lib/api/contracts";
import { createShare, deleteShare, listShares } from "@/lib/api/client";

type ShareableItem =
  | Pick<FileItem, "id" | "name" | "path"> & { type: "file" }
  | Pick<Folder, "id" | "name" | "path"> & { type: "folder" };

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShareableItem;
}

export function ShareDialog({ open, onOpenChange, item }: ShareDialogProps) {
  const [sharedLink, setSharedLink] = useState<ApiSharedLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSharedLink(null);
      fetchExistingLink();
    }
  }, [open, item.id, item.path, item.type]);

  const fetchExistingLink = async () => {
    const response = await listShares();
    const existing = response.data.shares.find((share) =>
      share.target_type === item.type && share.target.path === item.path
    );

    if (existing) {
      setSharedLink(existing);
    }
  };

  const createShareLink = async () => {
    setIsLoading(true);
    try {
      const response = await createShare(
        item.type === "folder"
          ? { type: "folder", folderPath: item.path }
          : { type: "file", filePath: item.path },
      );
      setSharedLink(response.data.share);
      toast.success("Share link created");
    } catch {
      toast.error("Failed to create share link");
    }

    setIsLoading(false);
  };

  const deleteShareLink = async () => {
    if (!sharedLink) return;

    try {
      await deleteShare(sharedLink.short_token || sharedLink.token);
      setSharedLink(null);
      toast.success("Share link deleted");
    } catch {
      toast.error("Failed to delete share link");
    }
  };

  const shareUrl = sharedLink
    ? `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/s/${encodeURIComponent(sharedLink.short_token || sharedLink.token)}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item.type === "folder" ? "Share Folder" : "Share File"}</DialogTitle>
          <DialogDescription>
            Create a public link to share "{item.name}"
          </DialogDescription>
        </DialogHeader>

        {sharedLink
          ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(shareUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Downloaded {sharedLink.download_count} times
              </p>
            </div>
          )
          : (
            <div className="py-4 text-center">
              <p className="text-sm text-slate-600 mb-4">
                {`No share link exists for this ${item.type} yet.`}
              </p>
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
  );
}
