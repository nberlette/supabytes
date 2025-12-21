import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fileIds, folderIds } = await request.json()
  const errors: string[] = []

  if (fileIds && fileIds.length > 0) {
    const { error } = await supabase
      .from("files")
      .update({ is_trashed: false, trashed_at: null })
      .in("id", fileIds)
      .eq("user_id", user.id)

    if (error) {
      errors.push(`File restore error: ${error.message}`)
    }
  }

  if (folderIds && folderIds.length > 0) {
    const { error } = await supabase
      .from("folders")
      .update({ is_trashed: false, trashed_at: null })
      .in("id", folderIds)
      .eq("user_id", user.id)

    if (error) {
      errors.push(`Folder restore error: ${error.message}`)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 207 })
  }

  return NextResponse.json({ success: true })
}
