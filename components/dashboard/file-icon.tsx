import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
} from "lucide-react";
import { getFileIcon } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface FileIconProps {
  mimeType: string | null;
  className?: string;
}

export function FileIcon({ mimeType, className }: FileIconProps) {
  const iconType = getFileIcon(mimeType);

  const iconClass = cn("text-slate-500", className);

  switch (iconType) {
    case "image":
      return <FileImage className={cn(iconClass, "text-green-500")} />;
    case "video":
      return <FileVideo className={cn(iconClass, "text-purple-500")} />;
    case "audio":
      return <FileAudio className={cn(iconClass, "text-pink-500")} />;
    case "pdf":
      return <FileText className={cn(iconClass, "text-red-500")} />;
    case "archive":
      return <FileArchive className={cn(iconClass, "text-amber-500")} />;
    case "doc":
      return <FileText className={cn(iconClass, "text-blue-500")} />;
    case "spreadsheet":
      return <FileSpreadsheet className={cn(iconClass, "text-green-600")} />;
    case "presentation":
      return <Presentation className={cn(iconClass, "text-orange-500")} />;
    case "text":
      return <FileText className={cn(iconClass, "text-slate-600")} />;
    default:
      return <File className={iconClass} />;
  }
}
