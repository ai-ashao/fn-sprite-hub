/** A download request is observable; a file being saved to disk is not. */
export function requestTextDownload(text: string, filename: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
