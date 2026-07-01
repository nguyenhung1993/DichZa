import Tesseract from 'tesseract.js'

let worker: Tesseract.Worker | null = null

export async function initOcrWorker() {
  if (worker) return worker
  try {
    worker = await Tesseract.createWorker('vie+eng')
    return worker
  } catch (error) {
    console.error('Failed to init OCR worker:', error)
    return null
  }
}

export async function recognizeText(imageBufferOrUrl: Buffer | string): Promise<string> {
  try {
    const w = await initOcrWorker()
    if (!w) throw new Error('OCR Worker not initialized')
    const { data: { text } } = await w.recognize(imageBufferOrUrl)
    return text.trim()
  } catch (error) {
    console.error('OCR Recognition failed:', error)
    throw error
  }
}
