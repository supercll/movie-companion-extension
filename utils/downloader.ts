import { saveAs } from 'file-saver'

export function downloadDataUrl(dataUrl: string, filename: string): void {
  try {
    browser.runtime.sendMessage({
      action: 'download',
      url: dataUrl,
      filename: `MovieCompanion/${filename}`,
    })
  }
  catch {
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => saveAs(blob, filename))
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob)
    browser.runtime.sendMessage({
      action: 'download',
      url,
      filename: `MovieCompanion/${filename}`,
    })
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
  catch {
    saveAs(blob, filename)
  }
}
