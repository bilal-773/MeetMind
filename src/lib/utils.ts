/** Merge class names */
export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

/** Format seconds → "1:23:45" or "23:45" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Format seconds → "01:23:45,000" SRT format */
export function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

/** Format bytes to human-readable */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

/** Detect if text contains RTL characters (Urdu/Arabic) */
export function isRTL(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)
}

/** Get speaker color CSS variable */
export function getSpeakerColor(index: number): string {
  const colors = [
    { color: '#4f46e5', bg: '#eef2ff' },
    { color: '#0ea5e9', bg: '#e0f2fe' },
    { color: '#8b5cf6', bg: '#f5f3ff' },
    { color: '#ec4899', bg: '#fdf2f8' },
    { color: '#f59e0b', bg: '#fef3c7' },
    { color: '#10b981', bg: '#d1fae5' },
  ]
  return colors[index % colors.length].color
}

export function getSpeakerBg(index: number): string {
  const bgs = ['#eef2ff', '#e0f2fe', '#f5f3ff', '#fdf2f8', '#fef3c7', '#d1fae5']
  return bgs[index % bgs.length]
}

export function getSpeakerIndex(speakerKey: string, allSpeakers: string[]): number {
  return allSpeakers.indexOf(speakerKey)
}

/** Truncate long text */
export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

/** Relative time string */
export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
