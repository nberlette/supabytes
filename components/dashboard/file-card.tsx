"use client";

import { useState } from "react";
import type { FileItem } from "@/lib/types";
import { formatFileSize } from "@/lib/utils/format";
import { FileIcon } from "./file-icon";
import { FileActions } from "./file-actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  FolderInput,
  RotateCcw,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { buildDownloadUrl, bulkDelete, runBulkOperation } from "@/lib/api/client";

interface FileCardProps {
  file: FileItem;
  onRefresh: () => void;
  userId: string;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onMove?: (fileId: string) => void;
  isDragOver?: boolean;
  isTrashView?: boolean;
}

export function FileCard({
  file,
  onRefresh,
  userId,
  isSelected,
  onSelect,
  onMove,
  isDragOver,
  isTrashView,
}: FileCardProps) {
  const [isFavorite, setIsFavorite] = useState(file.is_favorite);

  const handleToggleFavorite = async () => {
    const newValue = !isFavorite;
    setIsFavorite(newValue);

    try {
      await runBulkOperation({
        action: "favorite",
        fileIds: [file.id],
        folderIds: [],
        favorite: newValue,
      });
    } catch {
      setIsFavorite(!newValue);
      toast.error("Failed to update favorite");
    }
  };

  const handleDelete = async () => {
    try {
      await bulkDelete({ fileIds: [file.id], folderIds: [] });
      toast.success("File moved to trash");
      onRefresh();
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const handleRestore = async () => {
    try {
      await runBulkOperation({
        action: "restore",
        fileIds: [file.id],
        folderIds: [],
      });
      toast.success("File restored");
      onRefresh();
    } catch {
      toast.error("Failed to restore file");
    }
  };

  const handlePermanentDelete = async () => {
    try {
      await bulkDelete({ fileIds: [file.id], folderIds: [], permanent: true });
      toast.success("File permanently deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete file");
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          draggable={!isTrashView}
          onDragStart={(e) => {
            e.dataTransfer.setData(
              "text/plain",
              JSON.stringify({ type: "file", id: file.id }),
            );
            e.dataTransfer.effectAllowed = "move";
          }}
          className={cn(
            "group relative bg-card rounded-lg border border-border p-4",
            "hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
            isSelected && "ring-2 ring-primary bg-primary/5",
            isDragOver && "ring-2 ring-primary/50 bg-primary/5",
            isTrashView && "cursor-default",
          )}
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              onSelect?.(file.id, !isSelected);
            }
          }}
        >
          {onSelect && (
            <div
              className={cn(
                "absolute top-2 left-2 transition-opacity",
                isSelected
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelect(file.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Favorite indicator */}
          {isFavorite && !isTrashView && (
            <Star className="absolute top-2 left-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}

          <div className="flex flex-col items-center gap-3">
            <FileIcon mimeType={file.mime_type} className="h-12 w-12" />
            <div className="w-full text-center">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          {!isTrashView && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <FileActions file={file} onRefresh={onRefresh} userId={userId} />
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isTrashView
          ? (
            <>
              <ContextMenuItem onClick={handleRestore}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive"
                onClick={handlePermanentDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Forever
              </ContextMenuItem>
            </>
          )
          : (
            <>
                <ContextMenuItem
                  onClick={() =>
                    window.open(buildDownloadUrl(file.path), "_blank")}
                >
                <Download className="mr-2 h-4 w-4" />
                Download
              </ContextMenuItem>
              <ContextMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </ContextMenuItem>
              <ContextMenuItem onClick={handleToggleFavorite}>
                <Star
                  className={cn(
                    "mr-2 h-4 w-4",
                    isFavorite && "fill-yellow-500 text-yellow-500",
                  )}
                />
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onMove?.(file.id)}>
                <FolderInput className="mr-2 h-4 w-4" />
                Move to...
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Move to Trash
              </ContextMenuItem>
            </>
          )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
