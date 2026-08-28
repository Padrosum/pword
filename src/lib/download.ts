export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke later so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function sanitizeFilename(name: string, fallback: string): string {
  const cleaned = name
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || fallback
}
