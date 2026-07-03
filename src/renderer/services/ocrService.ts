// ============================================================
// DichZa — OCR Service (Web Worker version)
// Giao tiếp với ocrWorker.ts qua postMessage để không block UI
// ============================================================

export interface OcrLine {
  text: string
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

let worker: Worker | null = null
let messageId = 0

/**
 * Khởi tạo OCR Worker (lazy init)
 */
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/ocrWorker.ts', import.meta.url),
      { type: 'module' }
    )
  }
  return worker
}

/**
 * Gửi message đến worker và chờ kết quả
 */
function sendToWorker<T>(type: string, payload: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const w = getWorker()
    const id = ++messageId

    const handler = (event: MessageEvent) => {
      if (event.data.id !== id) return
      w.removeEventListener('message', handler)

      if (event.data.type === 'error') {
        reject(new Error(event.data.payload))
      } else {
        resolve(event.data.payload)
      }
    }

    w.addEventListener('message', handler)
    w.postMessage({ type, payload, id })
  })
}

/**
 * Nhận diện text từ ảnh (chạy trong Web Worker)
 */
export async function recognizeText(imageBufferOrUrl: Buffer | string): Promise<string> {
  const result = await sendToWorker<{ text: string }>('recognize', { image: imageBufferOrUrl })
  return result.text
}

/**
 * Nhận diện text theo từng dòng (chạy trong Web Worker)
 */
export async function recognizeLines(imageBufferOrUrl: Buffer | string): Promise<OcrLine[]> {
  const result = await sendToWorker<{ lines: OcrLine[] }>('recognizeLines', { image: imageBufferOrUrl })
  return result.lines
}

/**
 * Giải phóng worker khi không cần nữa
 */
export async function terminateOcrWorker(): Promise<void> {
  if (worker) {
    try {
      await sendToWorker('terminate', {})
    } catch {
      // Ignore termination errors
    }
    worker.terminate()
    worker = null
  }
}
