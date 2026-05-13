"use client";

import { useState } from "react";
import type { Folder } from "@/lib/types";
import {
  Edit,
  FolderIcon,
  FolderInput,
  MoreVertical,
  RotateCcw,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { bulkDelete, runBulkOperation } from "@/lib/api/client";
import { ShareDialog } from "./share-dialog";

interface FolderCardProps {
  folder: Folder;
  onNavigate: (folderPath: string | null) => void;
  onRefresh: () => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onDrop?: (folderId: string, item: { type: string; id: string }) => void;
  onMove?: (folderId: string) => void;
  isTrashView?: boolean;
}

export function FolderCard({
  folder,
  onNavigate,
  onRefresh,
  isSelected,
  onSelect,
  onDrop,
  onMove,
  isTrashView,
}: FolderCardProps) {
  const [isFavorite, setIsFavorite] = useState(folder.is_favorite);
  const [shareOpen, setShareOpen] = useState(false);

  const handleToggleFavorite = async () => {
    const newValue = !isFavorite;
    setIsFavorite(newValue);

    try {
      await runBulkOperation({
        action: "favorite",
        fileIds: [],
        folderIds: [folder.id],
        favorite: newValue,
      });
    } catch {
      setIsFavorite(!newValue);
      toast.error("Failed to update favorite");
    }
  };

  const handleDelete = async () => {
    try {
      await bulkDelete({ fileIds: [], folderIds: [folder.id] });
      toast.success("Folder moved to trash");
      onRefresh();
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  const handleRestore = async () => {
    try {
      await runBulkOperation({
        action: "restore",
        fileIds: [],
        folderIds: [folder.id],
      });
      toast.success("Folder restored");
      onRefresh();
    } catch {
      toast.error("Failed to restore folder");
    }
  };

  const handlePermanentDelete = async () => {
    try {
      await bulkDelete({ fileIds: [], folderIds: [folder.id], permanent: true });
      toast.success("Folder permanently deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  return (
    <div
      draggable={!isTrashView}
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "text/plain",
          JSON.stringify({ type: "folder", id: folder.id }),
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (!isTrashView) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(e) => {
        if (isTrashView) return;
        e.preventDefault();
        e.stopPropagation();
        try {
          const data = JSON.parse(e.dataTransfer.getData("text/plain"));
          if (data.id !== folder.id) {
            onDrop?.(folder.id, data);
          }
        } catch {
          // Invalid drop data
        }
      }}
      className={cn(
        "group relative bg-card rounded-lg border border-border p-4",
        "hover:shadow-md transition-all cursor-pointer",
        isSelected && "ring-2 ring-primary bg-primary/5",
      )}
      onDoubleClick={() => !isTrashView && onNavigate(folder.path)}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          onSelect?.(folder.id, !isSelected);
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
            onCheckedChange={(checked) =>
              onSelect(folder.id, checked as boolean)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Favorite indicator */}
      {isFavorite && !isTrashView && (
        <Star className="absolute top-2 left-8 h-4 w-4 text-yellow-500 fill-yellow-500" />
      )}

      <div className="flex flex-col items-center gap-3">
        <FolderIcon className="h-12 w-12 text-primary fill-primary/20" />
        <div className="w-full text-center">
          <p className="text-sm font-medium text-foreground truncate">
            {folder.name}
          </p>
          <p className="text-xs text-muted-foreground">Folder</p>
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
            {isTrashView
              ? (
                <>
                  <DropdownMenuItem onClick={handleRestore}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handlePermanentDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Forever
                  </DropdownMenuItem>
                </>
              )
              : (
                <>
                  <DropdownMenuItem onClick={() => onNavigate(folder.path)}>
                    <FolderIcon className="mr-2 h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleFavorite}>
                    <Star
                      className={cn(
                        "mr-2 h-4 w-4",
                        isFavorite && "fill-yellow-500 text-yellow-500",
                      )}
                    />
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => setShareOpen(true)}>
                     <Share2 className="mr-2 h-4 w-4" />
                     Share
                   </DropdownMenuItem>
                   <DropdownMenuItem disabled>
                     <Edit className="mr-2 h-4 w-4" />
                     Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMove?.(folder.id)}>
                    <FolderInput className="mr-2 h-4 w-4" />
                    Move to...
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                </>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        item={{ id: folder.id, name: folder.name, path: folder.path, type: "folder" }}
      />
    </div>
  );
}
