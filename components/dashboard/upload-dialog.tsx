"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileIcon, CheckCircle2, AlertCircle } from "lucide-react"
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
  id: string // Add unique ID to track files properly
  file: File
  progress: number
  status: "pending" | "uploading" | "complete" | "error"
  error?: string
}

function generateFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`
}

export function UploadDialog({ open, onOpenChange, currentFolder, onSuccess }: UploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const uploadingRef = useRef(false)

  const addFiles = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      id: generateFileId(file),
      file,
      progress: 0,
      status: "pending",
    }))
    setFiles((prev) => [...prev, ...uploadFiles])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    },
    [addFiles],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)
    addFiles(selectedFiles)
    e.target.value = ""
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadFiles = async () => {
    if (uploadingRef.current) return
    uploadingRef.current = true
    setIsUploading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("You must be logged in to upload files")
      uploadingRef.current = false
      setIsUploading(false)
      return
    }

    const pendingFiles = files.filter((f) => f.status === "pending")

    for (const uploadFile of pendingFiles) {
      setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading", progress: 10 } : f)))

      const storagePath = `${user.id}/${Date.now()}-${uploadFile.file.name}`

      const { error: uploadError } = await supabase.storage.from("files").upload(storagePath, uploadFile.file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error", error: uploadError.message } : f)),
        )
        continue
      }

      setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 70 } : f)))

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
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error", error: dbError.message } : f)),
        )
      } else {
        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "complete", progress: 100 } : f)))
      }
    }

    toast.success("Upload complete")
    onSuccess()
    uploadingRef.current = false
    setIsUploading(false)
  }

  const handleClose = () => {
    if (isUploading) return // Prevent closing during upload
    setFiles([])
    onOpenChange(false)
  }

  const pendingCount = files.filter((f) => f.status === "pending").length
  const completeCount = files.filter((f) => f.status === "complete").length
  const errorCount = files.filter((f) => f.status === "error").length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>Drag and drop files or click to browse</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center",
            "transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50",
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">Drag and drop files here, or</p>
          <label>
            <input type="file" multiple className="hidden" onChange={handleFileSelect} disabled={isUploading} />
            <Button variant="outline" asChild disabled={isUploading}>
              <span className="cursor-pointer">Browse Files</span>
            </Button>
          </label>
        </div>

        {files.length > 0 && (
          <div className="max-h-60 overflow-auto space-y-2">
            {files.map((uploadFile) => (
              <div key={uploadFile.id} className={cn("flex items-center gap-3 p-3 rounded-lg", "bg-muted/50")}>
                <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{uploadFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.file.size)}</p>
                  {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="h-1 mt-1" />}
                  {uploadFile.status === "error" && <p className="text-xs text-destructive mt-1">{uploadFile.error}</p>}
                </div>
                {uploadFile.status === "complete" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : uploadFile.status === "error" ? (
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                ) : uploadFile.status === "pending" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeFile(uploadFile.id)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {files.length > 0 && (
              <>
                {completeCount}/{files.length} uploaded
                {errorCount > 0 && ` (${errorCount} failed)`}
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {completeCount === files.length && files.length > 0 ? "Done" : "Cancel"}
            </Button>
            {pendingCount > 0 && (
              <Button onClick={uploadFiles} disabled={isUploading}>
                {isUploading ? "Uploading..." : `Upload ${pendingCount} file${pendingCount === 1 ? "" : "s"}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
