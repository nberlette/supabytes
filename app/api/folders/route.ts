import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, parent_id } = await request.json()

  if (!name) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
  }

  const { data: folder, error } = await supabase
    .from("folders")
    .insert({
      name,
      parent_id: parent_id || null,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ folder })
}
