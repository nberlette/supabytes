import Link from "next/link";
import { notFound } from "next/navigation";
import { Cloud, Download, FileIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildShareTargetSummary, getFolderPathById, listFolderChildren } from "@/lib/api/resources";
import { formatFileSize } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedEntryPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: sharedLink } = await supabase.from("shared_links").select("*").or(
    `short_token.eq.${token},token.eq.${token}`,
  ).limit(1).maybeSingle();

  if (!sharedLink) {
    notFound();
  }

  if (sharedLink.expires_at && new Date(sharedLink.expires_at) < new Date()) {
    notFound();
  }

  if (sharedLink.target_type === "folder" && sharedLink.folder_id) {
    const { data: folder } = await supabase.from("folders").select("*").eq(
      "id",
      sharedLink.folder_id,
    ).single();

    if (!folder) {
      notFound();
    }

    const folderPath = await getFolderPathById(supabase, folder.user_id, folder.id);
    const listing = await listFolderChildren(
      supabase,
      folder.user_id,
      folderPath.split("/").filter(Boolean),
      "files",
    );

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Cloud className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Supabytes</span>
          </div>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <FolderIcon className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-xl">{folder.name}</CardTitle>
              <CardDescription>
                Shared folder · {listing.folders.length} folders · {listing.files.length} files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing.folders.length === 0 && listing.files.length === 0
                ? <p className="text-sm text-muted-foreground">This folder is empty.</p>
                : (
                  <div className="space-y-2">
                    {listing.folders.map((childFolder) => (
                      <div
                        key={childFolder.id}
                        className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                      >
                        <FolderIcon className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{childFolder.name}</p>
                          <p className="text-xs text-muted-foreground">{childFolder.path}</p>
                        </div>
                      </div>
                    ))}
                    {listing.files.map((file) => {
                      const relativePath = file.path.slice(folderPath.length).replace(/^\/+/, "");
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                        >
                          <FileIcon className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button asChild size="sm">
                            <Link href={`/api/v2/shares/${token}?download=1&path=${encodeURIComponent(relativePath)}`}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!sharedLink.file_id) {
    notFound();
  }

  const { data: file } = await supabase.from("files").select("*").eq(
    "id",
    sharedLink.file_id,
  ).single();

  if (!file) {
    notFound();
  }

  const target = await buildShareTargetSummary(supabase, file.user_id, sharedLink);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Cloud className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">Supabytes</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <FileIcon className="h-8 w-8 text-accent-foreground" />
            </div>
            <CardTitle className="text-xl">{target.name}</CardTitle>
            <CardDescription>{formatFileSize(target.size || 0)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/api/v2/shares/${token}?download=1`}>
              <Button className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download File
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground pt-4">
              This file has been shared with you via Supabytes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
