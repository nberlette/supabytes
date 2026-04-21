"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { Sidebar } from "./sidebar";
import { FileExplorer } from "./file-explorer";
import { Header } from "./header";
import type { FileItem, Folder } from "@/lib/types";
import { fetchFolderView } from "@/lib/api/client";
import type { DashboardView } from "@/lib/api/contracts";

interface DashboardShellProps {
  userId: string;
  userEmail: string;
}

export function DashboardShell({ userId, userEmail }: DashboardShellProps) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>("files");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedViewMode = localStorage.getItem("supabytes-view-mode");
    if (savedViewMode === "grid" || savedViewMode === "list") {
      setViewMode(savedViewMode);
    }
  }, []);

  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("supabytes-view-mode", mode);
  }, []);

  const { data, mutate, isLoading } = useSWR(
    ["files", currentFolder, currentView],
    () => fetchFolderView(currentFolder, currentView),
    { revalidateOnFocus: false },
  );

  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolder(folderId);
  }, []);

  const handleViewChange = useCallback((view: DashboardView) => {
    setCurrentView(view);
    setCurrentFolder(null);
  }, []);

  const refreshFiles = useCallback(() => {
    mutate();
  }, [mutate]);

  const files: FileItem[] = data?.data.files || [];
  const folders: Folder[] = data?.data.folders || [];
  const breadcrumbs = data?.meta?.breadcrumbs || [];

  const filteredFiles = searchQuery
    ? files.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : files;

  const filteredFolders = searchQuery
    ? folders.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : folders;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userEmail={userEmail}
        onNavigate={navigateToFolder}
        currentFolder={currentFolder}
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentFolder={currentFolder}
          onRefresh={refreshFiles}
          breadcrumbs={breadcrumbs}
          onNavigate={navigateToFolder}
          currentView={currentView}
        />
        <FileExplorer
          files={filteredFiles}
          folders={filteredFolders}
          viewMode={viewMode}
          isLoading={isLoading}
          currentFolder={currentFolder}
          onNavigate={navigateToFolder}
          onRefresh={refreshFiles}
          userId={userId}
          currentView={currentView}
        />
      </div>
    </div>
  );
}
