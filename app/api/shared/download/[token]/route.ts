import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ token: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params
  const supabase = createAdminClient()

  // Get shared link
  const { data: sharedLink } = await supabase.from("shared_links").select("*, files(*)").eq("token", token).single()

  if (!sharedLink || !sharedLink.files) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 })
  }

  // Check if expired
  if (sharedLink.expires_at && new Date(sharedLink.expires_at) < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 })
  }

  const file = sharedLink.files as {
    id: string
    name: string
    storage_path: string
    mime_type: string | null
    user_id: string
  }

  // Download file from storage using admin client
  const { data: blob, error: downloadError } = await supabase.storage.from("files").download(file.storage_path)

  if (downloadError || !blob) {
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }

  // Increment download count
  await supabase
    .from("shared_links")
    .update({ download_count: sharedLink.download_count + 1 })
    .eq("id", sharedLink.id)

  return new NextResponse(blob, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.name}"`,
    },
  })
}
