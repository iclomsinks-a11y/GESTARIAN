export interface ShareOptions {
  title: string
  text?: string
  url?: string
  files?: File[]
}

export async function shareDocument(options: ShareOptions): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      if (options.files && navigator.canShare && navigator.canShare({ files: options.files })) {
        await navigator.share({
          title: options.title,
          text: options.text,
          files: options.files
        })
        return true
      }
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url
      })
      return true
    } catch (e: any) {
      if (e.name === 'AbortError') return false
    }
  }

  if (options.url) {
    try {
      await navigator.clipboard.writeText(options.url)
      return true
    } catch {
      return false
    }
  }

  return false
}
