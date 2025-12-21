import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  // Delete from storage
  await supabase.storage.from("files").remove([file.storage_path])

  // Delete from database
  const { error } = await supabase.from("files").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
