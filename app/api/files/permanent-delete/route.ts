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

  // Permanently delete files
  if (fileIds && fileIds.length > 0) {
    const { data: files } = await supabase
      .from("files")
      .select("id, storage_path")
      .in("id", fileIds)
      .eq("user_id", user.id)

    if (files && files.length > 0) {
      const paths = files.map((f) => f.storage_path)
      const { error: storageError } = await supabase.storage.from("files").remove(paths)

      if (storageError) {
        errors.push(`Storage deletion error: ${storageError.message}`)
      }

      const { error: dbError } = await supabase.from("files").delete().in("id", fileIds).eq("user_id", user.id)

      if (dbError) {
        errors.push(`Database deletion error: ${dbError.message}`)
      }
    }
  }

  // Permanently delete folders
  if (folderIds && folderIds.length > 0) {
    const allFilePaths: string[] = []

    async function getFilesInFolder(folderId: string) {
      const { data: files } = await supabase
        .from("files")
        .select("storage_path")
        .eq("folder_id", folderId)
        .eq("user_id", user.id)

      if (files) {
        for (const file of files) {
          allFilePaths.push(file.storage_path)
        }
      }

      const { data: subfolders } = await supabase
        .from("folders")
        .select("id")
        .eq("parent_id", folderId)
        .eq("user_id", user.id)

      if (subfolders) {
        for (const subfolder of subfolders) {
          await getFilesInFolder(subfolder.id)
        }
      }
    }

    for (const folderId of folderIds) {
      await getFilesInFolder(folderId)
    }

    if (allFilePaths.length > 0) {
      await supabase.storage.from("files").remove(allFilePaths)
    }

    const { error } = await supabase.from("folders").delete().in("id", folderIds).eq("user_id", user.id)

    if (error) {
      errors.push(`Folder deletion error: ${error.message}`)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 207 })
  }

  return NextResponse.json({ success: true })
}
