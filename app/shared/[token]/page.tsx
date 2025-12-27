import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cloud, Download, FileIcon } from "lucide-react";
import { formatFileSize } from "@/lib/utils/format";
import Link from "next/link";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedFilePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Get shared link with file info
  const { data: sharedLink } = await supabase.from("shared_links").select(
    "*, files(*)",
  ).eq("token", token).single();

  if (!sharedLink || !sharedLink.files) {
    notFound();
  }

  const file = sharedLink.files as {
    id: string;
    name: string;
    size: number;
    mime_type: string | null;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Cloud className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">Supabytes</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground">
              <FileIcon className="h-8 w-8 text-accent-foreground" />
            </div>
            <CardTitle className="text-xl">{file.name}</CardTitle>
            <CardDescription>{formatFileSize(file.size)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/api/shared/download/${token}`}>
              <Button className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download File
              </Button>
            </Link>
            <p className="text-xs text-center text-slate-500">
              This file has been shared with you via Supabytes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
