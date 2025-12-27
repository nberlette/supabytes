"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./sidebar";
import { FileExplorer } from "./file-explorer";
import { Header } from "./header";
import type { BreadcrumbItem, FileItem, Folder } from "@/lib/types";

interface DashboardShellProps {
  userId: string;
  userEmail: string;
}

type ViewType = "files" | "shared" | "trash" | "favorites";

async function fetchFiles(
  folderId: string | null,
  view: ViewType,
): Promise<{ files: FileItem[]; folders: Folder[] }> {
  const supabase = createClient();

  if (view === "trash") {
    // Fetch trashed items
    const { data: files } = await supabase
      .from("files")
      .select("*")
      .eq("is_trashed", true)
      .order("updated_at", { ascending: false });

    const { data: folders } = await supabase
      .from("folders")
      .select("*")
      .eq("is_trashed", true)
      .order("updated_at", { ascending: false });

    return { files: files || [], folders: folders || [] };
  }

  if (view === "favorites") {
    // Fetch favorited items
    const { data: files } = await supabase
      .from("files")
      .select("*")
      .eq("is_favorite", true)
      .eq("is_trashed", false)
      .order("name");

    const { data: folders } = await supabase
      .from("folders")
      .select("*")
      .eq("is_favorite", true)
      .eq("is_trashed", false)
      .order("name");

    return { files: files || [], folders: folders || [] };
  }

  if (view === "shared") {
    // Fetch files that have shared links
    const { data: sharedLinks } = await supabase.from("shared_links").select(
      "file_id",
    );

    const fileIds = sharedLinks?.map((link) => link.file_id) || [];

    if (fileIds.length === 0) {
      return { files: [], folders: [] };
    }

    const { data: files } = await supabase
      .from("files")
      .select("*")
      .in("id", fileIds)
      .eq("is_trashed", false)
      .order("name");

    return { files: files || [], folders: [] };
  }

  // Default: fetch files in folder
  const filesQuery = supabase.from("files").select("*").eq("is_trashed", false)
    .order("name");
  const foldersQuery = supabase.from("folders").select("*").eq(
    "is_trashed",
    false,
  ).order("name");

  const [filesResult, foldersResult] = await Promise.all([
    folderId === null
      ? filesQuery.is("folder_id", null)
      : filesQuery.eq("folder_id", folderId),
    folderId === null
      ? foldersQuery.is("parent_id", null)
      : foldersQuery.eq("parent_id", folderId),
  ]);

  return {
    files: filesResult.data || [],
    folders: foldersResult.data || [],
  };
}

async function fetchBreadcrumbs(
  folderId: string | null,
  view: ViewType,
): Promise<BreadcrumbItem[]> {
  if (view === "trash") return [{ id: null, name: "Trash" }];
  if (view === "favorites") return [{ id: null, name: "Favorites" }];
  if (view === "shared") return [{ id: null, name: "Shared" }];
  if (!folderId) return [{ id: null, name: "My Files" }];

  const supabase = createClient();
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const { data } = await supabase.from("folders").select(
      "id, name, parent_id",
    ).eq("id", currentId).single();

    if (data) {
      breadcrumbs.unshift({ id: data.id, name: data.name });
      currentId = data.parent_id;
    } else {
      break;
    }
  }

  return [{ id: null, name: "My Files" }, ...breadcrumbs];
}

export function DashboardShell({ userId, userEmail }: DashboardShellProps) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("files");
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
    () => fetchFiles(currentFolder, currentView),
    { revalidateOnFocus: false },
  );

  const { data: breadcrumbs } = useSWR(
    ["breadcrumbs", currentFolder, currentView],
    () => fetchBreadcrumbs(currentFolder, currentView),
    { revalidateOnFocus: false },
  );

  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolder(folderId);
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);
    setCurrentFolder(null);
  }, []);

  const refreshFiles = useCallback(() => {
    mutate();
  }, [mutate]);

  const files = data?.files || [];
  const folders = data?.folders || [];

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
          breadcrumbs={breadcrumbs || []}
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
