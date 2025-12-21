import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: file } = await supabase.from("files").select("*").eq("id", id).eq("user_id", user.id).single()

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const { data: blob, error: downloadError } = await supabase.storage.from("files").download(file.storage_path)

  if (downloadError || !blob) {
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.name}"`,
    },
  })
}
