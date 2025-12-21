"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  FolderPlus,
  LayoutGrid,
  List,
  Menu,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { Fragment, useState } from "react";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/lib/types";
import { UploadDialog } from "./upload-dialog";
import { CreateFolderDialog } from "./create-folder-dialog";

interface HeaderProps {
  onMenuClick: () => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentFolder: string | null;
  onRefresh: () => void;
  breadcrumbs: BreadcrumbItemType[];
  onNavigate: (folderId: string | null) => void;
  currentView?: "files" | "shared" | "trash" | "favorites";
}

export function Header({
  onMenuClick,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  currentFolder,
  onRefresh,
  breadcrumbs,
  onNavigate,
  currentView = "files",
}: HeaderProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  const showUploadActions = currentView === "files";

  return (
    <header className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumbs */}
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            {breadcrumbs.map((item, index, all) => (
              <Fragment key={item.id ?? "root"}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1
                    ? <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    : (
                      <BreadcrumbLink
                        href={"#/" +
                          all
                            .slice(0, index + 1)
                            .map((i) => i.name)
                            .join("/")}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(item.id);
                        }}
                      >
                        {item.name}
                      </BreadcrumbLink>
                    )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <div className="hidden sm:flex items-center border border-border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => onViewModeChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {showUploadActions && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFolderOpen(true)}
                className="hidden sm:flex"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>

              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </>
          )}
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
    </header>
  );
}
