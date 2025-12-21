"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileIcon, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatFileSize } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentFolder: string | null
  onSuccess: () => void
}

interface UploadFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "complete" | "error"
  error?: string
}

export function UploadDialog({ open, onOpenChange, currentFolder, onSuccess }: UploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const newFiles: UploadFile[] = droppedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending",
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)
    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending",
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("You must be logged in to upload files")
      return
    }

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i]
      if (uploadFile.status !== "pending") continue

      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "uploading", progress: 0 } : f)))

      const storagePath = `${user.id}/${Date.now()}-${uploadFile.file.name}`

      const { error: uploadError } = await supabase.storage.from("files").upload(storagePath, uploadFile.file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "error", error: uploadError.message } : f)),
        )
        continue
      }

      // Create file record in database
      const { error: dbError } = await supabase.from("files").insert({
        name: uploadFile.file.name,
        storage_path: storagePath,
        size: uploadFile.file.size,
        mime_type: uploadFile.file.type || null,
        folder_id: currentFolder,
        user_id: user.id,
      })

      if (dbError) {
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "error", error: dbError.message } : f)))
      } else {
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "complete", progress: 100 } : f)))
      }
    }

    toast.success("Upload complete")
    onSuccess()
  }

  const handleClose = () => {
    setFiles([])
    onOpenChange(false)
  }

  const pendingCount = files.filter((f) => f.status === "pending").length
  const completeCount = files.filter((f) => f.status === "complete").length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>Drag and drop files or click to browse</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300",
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-10 w-10 text-slate-400 mb-4" />
          <p className="text-sm text-slate-600 mb-2">Drag and drop files here, or</p>
          <label>
            <input type="file" multiple className="hidden" onChange={handleFileSelect} />
            <Button variant="outline" asChild>
              <span className="cursor-pointer">Browse Files</span>
            </Button>
          </label>
        </div>

        {files.length > 0 && (
          <div className="max-h-60 overflow-auto space-y-2">
            {files.map((uploadFile, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileIcon className="h-8 w-8 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{uploadFile.file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(uploadFile.file.size)}</p>
                  {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="h-1 mt-1" />}
                  {uploadFile.status === "error" && <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>}
                </div>
                {uploadFile.status === "complete" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : uploadFile.status === "pending" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {files.length > 0 && `${completeCount}/${files.length} files uploaded`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {completeCount === files.length && files.length > 0 ? "Done" : "Cancel"}
            </Button>
            {pendingCount > 0 && (
              <Button onClick={uploadFiles}>
                Upload {pendingCount} {pendingCount === 1 ? "file" : "files"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
