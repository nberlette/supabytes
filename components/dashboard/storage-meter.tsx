"use client"

import useSWR from "swr"
import { HardDrive } from "lucide-react"
import { formatFileSize } from "@/lib/utils/format"

async function fetchStorage() {
  const res = await fetch("/api/storage")
  if (!res.ok) throw new Error("Failed to fetch storage")
  return res.json()
}

export function StorageMeter() {
  const { data } = useSWR("storage", fetchStorage, {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  })

  const used = data?.used || 0
  const quota = data?.quota || 5368709120
  const percent = data?.percent || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <HardDrive className="h-4 w-4" />
        <span>Storage</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.max(percent, 1)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatFileSize(used)} of {formatFileSize(quota)} used
      </p>
    </div>
  )
}
