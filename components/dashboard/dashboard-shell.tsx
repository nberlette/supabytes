"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "./sidebar"
import { FileExplorer } from "./file-explorer"
import { Header } from "./header"
import type { FileItem, Folder, BreadcrumbItem } from "@/lib/types"

interface DashboardShellProps {
  userId: string
  userEmail: string
}

async function fetchFiles(folderId: string | null): Promise<{ files: FileItem[]; folders: Folder[] }> {
  const supabase = createClient()

  const filesQuery = supabase.from("files").select("*").order("name")
  const foldersQuery = supabase.from("folders").select("*").order("name")

  const [filesResult, foldersResult] = await Promise.all([
    folderId === null ? filesQuery.is("folder_id", null) : filesQuery.eq("folder_id", folderId),
    folderId === null ? foldersQuery.is("parent_id", null) : foldersQuery.eq("parent_id", folderId),
  ])

  return {
    files: filesResult.data || [],
    folders: foldersResult.data || [],
  }
}

async function fetchBreadcrumbs(folderId: string | null): Promise<BreadcrumbItem[]> {
  if (!folderId) return [{ id: null, name: "My Files" }]

  const supabase = createClient()
  const breadcrumbs: BreadcrumbItem[] = [{ id: null, name: "My Files" }]
  let currentId: string | null = folderId

  while (currentId) {
    const { data } = await supabase.from("folders").select("id, name, parent_id").eq("id", currentId).single()

    if (data) {
      breadcrumbs.push({ id: data.id, name: data.name })
      currentId = data.parent_id
    } else {
      break
    }
  }

  return breadcrumbs
}

export function DashboardShell({ userId, userEmail }: DashboardShellProps) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")

  const { data, mutate, isLoading } = useSWR(["files", currentFolder], () => fetchFiles(currentFolder), {
    revalidateOnFocus: false,
  })

  const { data: breadcrumbs } = useSWR(["breadcrumbs", currentFolder], () => fetchBreadcrumbs(currentFolder), {
    revalidateOnFocus: false,
  })

  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolder(folderId)
  }, [])

  const refreshFiles = useCallback(() => {
    mutate()
  }, [mutate])

  const files = data?.files || []
  const folders = data?.folders || []

  const filteredFiles = searchQuery
    ? files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files

  const filteredFolders = searchQuery
    ? folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userEmail={userEmail}
        onNavigate={navigateToFolder}
        currentFolder={currentFolder}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentFolder={currentFolder}
          onRefresh={refreshFiles}
          breadcrumbs={breadcrumbs || []}
          onNavigate={navigateToFolder}
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
        />
      </div>
    </div>
  )
}
