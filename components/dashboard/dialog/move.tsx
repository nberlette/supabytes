"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { ChevronRight, FolderIcon, Home } from "lucide-react";
import type { Folder } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (targetFolderId: string | null) => void;
  excludeFolderIds?: string[];
  isMoving?: boolean;
}

export function MoveDialog(
  { open, onOpenChange, onMove, excludeFolderIds = [], isMoving }:
    MoveDialogProps,
) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentPath, setCurrentPath] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentFolderId = currentPath.length > 0
    ? currentPath[currentPath.length - 1].id
    : null;

  useEffect(() => {
    if (open) {
      fetchFolders(null);
      setCurrentPath([]);
      setSelectedFolder(null);
    }
  }, [open]);

  async function fetchFolders(parentId: string | null) {
    setLoading(true);
    const supabase = createClient();

    const query = supabase.from("folders").select("*").order("name");

    const { data } = parentId
      ? await query.eq("parent_id", parentId)
      : await query.is("parent_id", null);

    setFolders((data || []).filter((f) => !excludeFolderIds.includes(f.id)));
    setLoading(false);
  }

  function navigateToFolder(folder: Folder) {
    setCurrentPath([...currentPath, folder]);
    setSelectedFolder(null);
    fetchFolders(folder.id);
  }

  function navigateUp(index: number) {
    const newPath = currentPath.slice(0, index);
    setCurrentPath(newPath);
    setSelectedFolder(null);
    fetchFolders(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  }

  function handleMove() {
    // If a folder is selected, move into it; otherwise move to current path
    const targetId = selectedFolder ?? currentFolderId;
    onMove(targetId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move to folder</DialogTitle>
        </DialogHeader>

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-sm text-slate-600 flex-wrap">
          <button
            onClick={() => navigateUp(0)}
            className="flex items-center gap-1 hover:text-slate-900"
          >
            <Home className="h-4 w-4" />
            <span>My Files</span>
          </button>
          {currentPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() =>
                  navigateUp(index + 1)}
                className="hover:text-slate-900"
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>

        <ScrollArea className="h-64 border rounded-md">
          {loading
            ? <div className="p-4 text-center text-slate-500">Loading...</div>
            : folders.length === 0
            ? (
              <div className="p-4 text-center text-slate-500">
                No folders here
              </div>
            )
            : (
              <div className="p-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer",
                      "hover:bg-slate-100 transition-colors",
                      selectedFolder === folder.id &&
                        "bg-indigo-50 ring-1 ring-indigo-200",
                    )}
                    onClick={() => setSelectedFolder(folder.id)}
                    onDoubleClick={() => navigateToFolder(folder)}
                  >
                    <FolderIcon className="h-5 w-5 text-indigo-500 fill-indigo-100" />
                    <span className="text-sm font-medium">{folder.name}</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                  </div>
                ))}
              </div>
            )}
        </ScrollArea>

        <p className="text-xs text-slate-500">
          Double-click to navigate into a folder, or select and click Move.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving}>
            {isMoving ? "Moving..." : "Move here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
