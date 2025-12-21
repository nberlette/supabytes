import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get("folder_id")

  const [filesResult, foldersResult] = await Promise.all([
    supabase.from("files").select("*").eq("user_id", user.id).eq("folder_id", folderId).order("name"),
    supabase.from("folders").select("*").eq("user_id", user.id).eq("parent_id", folderId).order("name"),
  ])

  return NextResponse.json({
    files: filesResult.data || [],
    folders: foldersResult.data || [],
  })
}
