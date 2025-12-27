"use client";

import { useCallback, useState } from "react";
import type { FileItem, Folder } from "@/lib/types";
import { FileCard } from "./file-card";
import { FolderCard } from "./folder-card";
import { FileRow } from "./file-row";
import { FolderRow } from "./folder-row";
import { EmptyState } from "./empty-state";
import { SelectionToolbar } from "./selection-toolbar";
import { MoveDialog } from "./dialog/move";
import { ConfirmDialog } from "./dialog/confirm";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface FileExplorerProps {
  files: FileItem[];
  folders: Folder[];
  viewMode: "grid" | "list";
  isLoading: boolean;
  currentFolder: string | null;
  onNavigate: (folderId: string | null) => void;
  onRefresh: () => void;
  userId: string;
  currentView?: "files" | "shared" | "trash" | "favorites";
}

export function FileExplorer({
  files,
  folders,
  viewMode,
  isLoading,
  currentFolder,
  onNavigate,
  onRefresh,
  userId,
  currentView = "files",
}: FileExplorerProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [singleMoveItem, setSingleMoveItem] = useState<
    {
      type: "file" | "folder";
      id: string;
    } | null
  >(null);

  const selectedCount = selectedFiles.size + selectedFolders.size;
  const isTrashView = currentView === "trash";

  const handleFileSelect = useCallback((id: string, selected: boolean) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleFolderSelect = useCallback((id: string, selected: boolean) => {
    setSelectedFolders((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedFiles(new Set(files.map((f) => f.id)));
        setSelectedFolders(new Set(folders.map((f) => f.id)));
      } else {
        setSelectedFiles(new Set());
        setSelectedFolders(new Set());
      }
    },
    [files, folders],
  );

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  }, []);

  const handleDropOnFolder = useCallback(
    async (targetFolderId: string, item: { type: string; id: string }) => {
      const fileIds = item.type === "file" ? [item.id] : [];
      const folderIds = item.type === "folder" ? [item.id] : [];

      try {
        const res = await fetch("/api/files/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileIds,
            folderIds,
            targetFolderId,
          }),
        });

        if (res.ok) {
          toast.success("Item moved successfully");
          onRefresh();
        } else {
          const data = await res.json();
          toast.error(data.errors?.[0] || "Failed to move item");
        }
      } catch {
        toast.error("Failed to move item");
      }
    },
    [onRefresh],
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedCount === 0) return;

    setIsDeleting(true);
    try {
      const endpoint = isTrashView
        ? "/api/files/permanent-delete"
        : "/api/files/bulk-delete";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: Array.from(selectedFiles),
          folderIds: Array.from(selectedFolders),
        }),
      });

      if (res.ok) {
        toast.success(
          isTrashView
            ? `Permanently deleted ${selectedCount} item(s)`
            : `Moved ${selectedCount} item(s) to trash`,
        );
        clearSelection();
        onRefresh();
      } else {
        const data = await res.json();
        toast.error(data.errors?.[0] || "Failed to delete some items");
      }
    } catch {
      toast.error("Failed to delete items");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }, [
    selectedFiles,
    selectedFolders,
    selectedCount,
    clearSelection,
    onRefresh,
    isTrashView,
  ]);

  const handleBulkRestore = useCallback(async () => {
    if (selectedCount === 0) return;

    try {
      const res = await fetch("/api/files/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: Array.from(selectedFiles),
          folderIds: Array.from(selectedFolders),
        }),
      });

      if (res.ok) {
        toast.success(`Restored ${selectedCount} item(s)`);
        clearSelection();
        onRefresh();
      } else {
        const data = await res.json();
        toast.error(data.errors?.[0] || "Failed to restore items");
      }
    } catch {
      toast.error("Failed to restore items");
    }
  }, [
    selectedFiles,
    selectedFolders,
    selectedCount,
    clearSelection,
    onRefresh,
  ]);

  const handleBulkMove = useCallback(
    async (targetFolderId: string | null) => {
      setIsMoving(true);

      const fileIds = singleMoveItem?.type === "file"
        ? [singleMoveItem.id]
        : Array.from(selectedFiles);
      const folderIds = singleMoveItem?.type === "folder"
        ? [singleMoveItem.id]
        : Array.from(selectedFolders);

      try {
        const res = await fetch("/api/files/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileIds,
            folderIds,
            targetFolderId,
          }),
        });

        if (res.ok) {
          toast.success("Items moved successfully");
          clearSelection();
          onRefresh();
        } else {
          const data = await res.json();
          toast.error(data.errors?.[0] || "Failed to move items");
        }
      } catch {
        toast.error("Failed to move items");
      } finally {
        setIsMoving(false);
        setMoveDialogOpen(false);
        setSingleMoveItem(null);
      }
    },
    [selectedFiles, selectedFolders, singleMoveItem, clearSelection, onRefresh],
  );

  const handleBulkDownload = useCallback(() => {
    selectedFiles.forEach((fileId) => {
      window.open(`/api/files/download/${fileId}`, "_blank");
    });
  }, [selectedFiles]);

  const handleSingleFileMove = useCallback((fileId: string) => {
    setSingleMoveItem({ type: "file", id: fileId });
    setMoveDialogOpen(true);
  }, []);

  const handleSingleFolderMove = useCallback((folderId: string) => {
    setSingleMoveItem({ type: "folder", id: folderId });
    setMoveDialogOpen(true);
  }, []);

  const openBulkMoveDialog = useCallback(() => {
    setSingleMoveItem(null);
    setMoveDialogOpen(true);
  }, []);

  const allSelected = files.length + folders.length > 0 &&
    selectedFiles.size === files.length &&
    selectedFolders.size === folders.length;

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {viewMode === "grid"
          ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          )
          : (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          )}
      </div>
    );
  }

  if (files.length === 0 && folders.length === 0) {
    return (
      <EmptyState
        currentFolder={currentFolder}
        onRefresh={onRefresh}
        currentView={currentView}
      />
    );
  }

  const excludeFolderIds = singleMoveItem?.type === "folder"
    ? [singleMoveItem.id]
    : Array.from(selectedFolders);

  if (viewMode === "grid") {
    return (
      <>
        <div
          className="flex-1 p-6 overflow-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onNavigate={onNavigate}
                onRefresh={onRefresh}
                isSelected={selectedFolders.has(folder.id)}
                onSelect={handleFolderSelect}
                onDrop={handleDropOnFolder}
                onMove={handleSingleFolderMove}
                isTrashView={isTrashView}
              />
            ))}
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onRefresh={onRefresh}
                userId={userId}
                isSelected={selectedFiles.has(file.id)}
                onSelect={handleFileSelect}
                onMove={handleSingleFileMove}
                isTrashView={isTrashView}
              />
            ))}
          </div>
        </div>

        <SelectionToolbar
          selectedCount={selectedCount}
          onClear={clearSelection}
          onDelete={() => setDeleteDialogOpen(true)}
          onMove={openBulkMoveDialog}
          onDownload={handleBulkDownload}
          isDeleting={isDeleting}
          isTrashView={isTrashView}
          onRestore={handleBulkRestore}
        />

        <MoveDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          onMove={handleBulkMove}
          excludeFolderIds={excludeFolderIds}
          isMoving={isMoving}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={isTrashView ? "Permanently Delete?" : "Move to Trash?"}
          description={isTrashView
            ? `This will permanently delete ${selectedCount} item(s). This action cannot be undone.`
            : `This will move ${selectedCount} item(s) to trash. You can restore them later.`}
          confirmLabel={isTrashView ? "Delete Forever" : "Move to Trash"}
          onConfirm={handleBulkDelete}
          isLoading={isDeleting}
          variant={isTrashView ? "destructive" : "default"}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                  Size
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Modified
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {folders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  onNavigate={onNavigate}
                  onRefresh={onRefresh}
                  isSelected={selectedFolders.has(folder.id)}
                  onSelect={handleFolderSelect}
                  onDrop={handleDropOnFolder}
                  onMove={handleSingleFolderMove}
                  isTrashView={isTrashView}
                />
              ))}
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  onRefresh={onRefresh}
                  userId={userId}
                  isSelected={selectedFiles.has(file.id)}
                  onSelect={handleFileSelect}
                  isTrashView={isTrashView}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SelectionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={() => setDeleteDialogOpen(true)}
        onMove={openBulkMoveDialog}
        onDownload={handleBulkDownload}
        isDeleting={isDeleting}
        isTrashView={isTrashView}
        onRestore={handleBulkRestore}
      />

      <MoveDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        onMove={handleBulkMove}
        excludeFolderIds={excludeFolderIds}
        isMoving={isMoving}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={isTrashView ? "Permanently Delete?" : "Move to Trash?"}
        description={isTrashView
          ? `This will permanently delete ${selectedCount} item(s). This action cannot be undone.`
          : `This will move ${selectedCount} item(s) to trash. You can restore them later.`}
        confirmLabel={isTrashView ? "Delete Forever" : "Move to Trash"}
        onConfirm={handleBulkDelete}
        isLoading={isDeleting}
        variant={isTrashView ? "destructive" : "default"}
      />
    </>
  );
}
