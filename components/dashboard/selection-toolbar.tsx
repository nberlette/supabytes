"use client";

import { Button } from "@/components/ui/button";
import { Download, FolderInput, RotateCcw, Trash2, X } from "lucide-react";

interface SelectionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  onMove: () => void;
  onDownload: () => void;
  isDeleting?: boolean;
  isTrashView?: boolean;
  onRestore?: () => void;
}

export function SelectionToolbar({
  selectedCount,
  onClear,
  onDelete,
  onMove,
  onDownload,
  isDeleting,
  isTrashView,
  onRestore,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-popover text-popover-foreground border border-border px-4 py-3 rounded-lg shadow-lg">
        <span className="text-sm font-medium mr-2">
          {selectedCount} selected
        </span>

        <div className="h-4 w-px bg-border" />

        {isTrashView
          ? (
            <>
              <Button variant="ghost" size="sm" onClick={onRestore}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Forever"}
              </Button>
            </>
          )
          : (
            <>
              <Button variant="ghost" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              <Button variant="ghost" size="sm" onClick={onMove}>
                <FolderInput className="h-4 w-4 mr-2" />
                Move
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}

        <div className="h-4 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
