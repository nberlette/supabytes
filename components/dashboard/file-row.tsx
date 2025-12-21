"use client";

import { useState } from "react";
import type { FileItem } from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/utils/format";
import { FileIcon } from "./file-icon";
import { FileActions } from "./file-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical, RotateCcw, Star, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileRowProps {
  file: FileItem;
  onRefresh: () => void;
  userId: string;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  isTrashView?: boolean;
}

export function FileRow(
  { file, onRefresh, userId, isSelected, onSelect, isTrashView }: FileRowProps,
) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRestore = async () => {
    const res = await fetch("/api/files/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: [file.id], folderIds: [] }),
    });

    if (res.ok) {
      toast.success("File restored");
      onRefresh();
    } else {
      toast.error("Failed to restore file");
    }
  };

  const handlePermanentDelete = async () => {
    setIsDeleting(true);
    const res = await fetch("/api/files/permanent-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: [file.id], folderIds: [] }),
    });

    if (res.ok) {
      toast.success("File permanently deleted");
      onRefresh();
    } else {
      toast.error("Failed to delete file");
    }
    setIsDeleting(false);
    setDeleteOpen(false);
  };

  return (
    <>
      <tr
        draggable={!isTrashView}
        onDragStart={(e) => {
          e.dataTransfer.setData(
            "text/plain",
            JSON.stringify({ type: "file", id: file.id }),
          );
          e.dataTransfer.effectAllowed = "move";
        }}
        className={cn(
          "border-b border-border hover:bg-muted/50 transition-colors",
          isSelected && "bg-primary/5",
          !isTrashView && "cursor-grab",
        )}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSelect?.(file.id, !isSelected);
          }
        }}
      >
        <td className="px-4 py-3 w-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              onSelect?.(file.id, checked as boolean)}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <FileIcon mimeType={file.mime_type} className="h-8 w-8" />
            <span className="text-sm font-medium text-foreground truncate">
              {file.name}
            </span>
            {file.is_favorite && !isTrashView && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
          {formatFileSize(file.size)}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
          {formatDate(file.updated_at)}
        </td>
        <td className="px-4 py-3">
          {isTrashView
            ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleRestore}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Forever
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
            : <FileActions file={file} onRefresh={onRefresh} userId={userId} />}
        </td>
      </tr>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Forever?"
        description={`"${file.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete Forever"
        onConfirm={handlePermanentDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </>
  );
}
