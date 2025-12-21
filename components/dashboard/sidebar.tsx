"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Cloud,
  FolderOpen,
  LogOut,
  Settings,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { StorageMeter } from "./storage-meter";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  onNavigate: (folderId: string | null) => void;
  currentFolder: string | null;
  currentView?: "files" | "shared" | "trash" | "favorites";
  onViewChange?: (view: "files" | "shared" | "trash" | "favorites") => void;
}

export function Sidebar({
  open,
  onClose,
  userEmail,
  onNavigate,
  currentFolder,
  currentView = "files",
  onViewChange,
}: SidebarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleNavigateHome = () => {
    onViewChange?.("files");
    onNavigate(null);
    onClose();
  };

  const handleViewChange = (
    view: "files" | "shared" | "trash" | "favorites",
  ) => {
    onViewChange?.(view);
    onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Cloud className="h-6 w-6 text-primary" />
        <span className="font-bold text-foreground">Supabytes</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            currentView === "files" && currentFolder === null &&
              "bg-primary/10 text-primary",
          )}
          onClick={handleNavigateHome}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          My Files
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            currentView === "favorites" && "bg-primary/10 text-primary",
          )}
          onClick={() => handleViewChange("favorites")}
        >
          <Star className="mr-2 h-4 w-4" />
          Favorites
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            currentView === "shared" && "bg-primary/10 text-primary",
          )}
          onClick={() => handleViewChange("shared")}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Shared
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            currentView === "trash" && "bg-primary/10 text-primary",
          )}
          onClick={() => handleViewChange("trash")}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Trash
        </Button>
      </nav>

      <div className="p-4 border-t border-border">
        <StorageMeter />
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground truncate px-2 flex-1">
            {userEmail}
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => router.push("/dashboard/settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
