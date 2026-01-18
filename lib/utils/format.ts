export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " +
    sizes[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return "file";

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (
    mimeType.includes("zip") || mimeType.includes("rar") ||
    mimeType.includes("tar") || mimeType.includes("br") ||
    mimeType.includes("gz") || mimeType.includes("xz") ||
    mimeType.includes("lz") || mimeType.includes("zstd")
  ) return "archive";
  if (mimeType.includes("document") || mimeType.includes("word")) return "doc";
  if (
    mimeType.includes("spreadsheet") || mimeType.includes("excel") ||
    mimeType.includes("xlsx") || mimeType.includes("numbers")
  ) {
    return "spreadsheet";
  }
  if (
    mimeType.includes("presentation") || mimeType.includes("powerpoint") ||
    mimeType.includes("ppt") || mimeType.includes("keynote")
  ) {
    return "presentation";
  }
  if (
    mimeType.includes("yaml") || mimeType.includes("toml") ||
    mimeType.includes("json") || mimeType.includes("json5") ||
    mimeType.includes("jsonc")
  ) return "data";
  if (mimeType.includes("text")) return "text";

  return "file";
}
