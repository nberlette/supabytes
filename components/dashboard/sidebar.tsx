"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Cloud, FolderOpen, Share2, Trash2, Settings, LogOut, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  open: boolean
  onClose: () => void
  userEmail: string
  onNavigate: (folderId: string | null) => void
  currentFolder: string | null
}

export function Sidebar({ open, onClose, userEmail, onNavigate, currentFolder }: SidebarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleNavigateHome = () => {
    onNavigate(null)
    onClose()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <Cloud className="h-6 w-6 text-indigo-600" />
        <span className="font-bold text-slate-900">CloudVault</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Button
          variant="ghost"
          className={cn("w-full justify-start", currentFolder === null && "bg-indigo-50 text-indigo-700")}
          onClick={handleNavigateHome}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          My Files
        </Button>
        <Button variant="ghost" className="w-full justify-start text-slate-600" disabled>
          <Share2 className="mr-2 h-4 w-4" />
          Shared
        </Button>
        <Button variant="ghost" className="w-full justify-start text-slate-600" disabled>
          <Trash2 className="mr-2 h-4 w-4" />
          Trash
        </Button>
      </nav>

      <div className="p-4 border-t space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <HardDrive className="h-4 w-4" />
          <span>Storage</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full w-1/4 bg-indigo-600 rounded-full" />
        </div>
        <p className="text-xs text-slate-500">Using 25% of available storage</p>
      </div>

      <div className="p-4 border-t space-y-2">
        <div className="text-sm text-slate-600 truncate px-2">{userEmail}</div>
        <Button variant="ghost" className="w-full justify-start text-slate-600" disabled>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-white flex-col">{sidebarContent}</aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  )
}
