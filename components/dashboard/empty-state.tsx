"use client";

import { FolderPlus, Share2, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UploadDialog } from "./upload-dialog";
import { CreateFolderDialog } from "./create-folder-dialog";

interface EmptyStateProps {
  currentFolder: string | null;
  onRefresh: () => void;
  currentView?: "files" | "shared" | "trash" | "favorites";
}

export function EmptyState(
  { currentFolder, onRefresh, currentView = "files" }: EmptyStateProps,
) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  if (currentView === "trash") {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Trash is empty
          </h3>
          <p className="text-sm text-muted-foreground">
            Items you delete will appear here
          </p>
        </div>
      </div>
    );
  }

  if (currentView === "shared") {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Share2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No shared files
          </h3>
          <p className="text-sm text-muted-foreground">
            Files you share will appear here
          </p>
        </div>
      </div>
    );
  }

  if (currentView === "favorites") {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No favorites yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Star files and folders to find them quickly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No files yet
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Upload files or create a folder to get started
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
          <Button variant="outline" onClick={() => setFolderOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        currentFolder={currentFolder}
        onSuccess={onRefresh}
      />

      <CreateFolderDialog
        open={folderOpen}
        onOpenChange={setFolderOpen}
        currentFolder={currentFolder}
        onSuccess={onRefresh}
      />
    </div>
  );
}
