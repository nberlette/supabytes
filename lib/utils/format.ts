export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return "file"

  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (mimeType.includes("pdf")) return "pdf"
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return "archive"
  if (mimeType.includes("document") || mimeType.includes("word")) return "doc"
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "spreadsheet"
  }
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return "presentation"
  }
  if (mimeType.includes("text") || mimeType.includes("json")) return "text"

  return "file"
}
