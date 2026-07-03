// ============================================================
// DichZa — OCR Web Worker
// Chạy Tesseract.js trong thread riêng biệt để không block UI
// ============================================================

import Tesseract from 'tesseract.js'

let worker: Tesseract.Worker | null = null

async function ensureWorker(): Promise<Tesseract.Worker> {
  if (worker) return worker
  worker = await Tesseract.createWorker('vie+eng')
  return worker
}

// Lắng nghe message từ main thread
self.onmessage = async (event: MessageEvent) => {
  const { type, payload, id } = event.data

  try {
    switch (type) {
      case 'recognize': {
        const w = await ensureWorker()
        const { data: { text } } = await w.recognize(payload.image)
        self.postMessage({ type: 'result', id, payload: { text: text.trim() } })
        break
      }

      case 'recognizeLines': {
        const w = await ensureWorker()
        const { data: { lines } } = await w.recognize(payload.image)
        
        const filteredLines = lines
          .filter((line: any) => {
            const text = line.text.trim()
            if (text.length === 0) return false
            if (!/[\p{L}\p{N}]/u.test(text)) return false
            if (line.confidence < 40) return false
            return true
          })
          .map((line: any) => ({
            text: line.text.trim(),
            bbox: line.bbox
          }))

        self.postMessage({ type: 'result', id, payload: { lines: filteredLines } })
        break
      }

      case 'terminate': {
        if (worker) {
          await worker.terminate()
          worker = null
        }
        self.postMessage({ type: 'terminated', id })
        break
      }

      default:
        self.postMessage({ type: 'error', id, payload: `Unknown message type: ${type}` })
    }
  } catch (error: any) {
    self.postMessage({
      type: 'error',
      id,
      payload: error.message || 'OCR Worker error'
    })
  }
}
