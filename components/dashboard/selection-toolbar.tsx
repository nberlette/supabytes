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
    <div className="fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-popover px-4 py-3 text-popover-foreground shadow-lg">
        <span className="mr-2 text-sm font-medium">
          {selectedCount} selected
        </span>

        <div className="hidden h-4 w-px bg-border sm:block" />

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

        <div className="hidden h-4 w-px bg-border sm:block" />

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
