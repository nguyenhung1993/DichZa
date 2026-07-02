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

export interface OcrLine {
  text: string
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

export async function recognizeLines(imageBufferOrUrl: Buffer | string): Promise<OcrLine[]> {
  try {
    const w = await initOcrWorker()
    if (!w) throw new Error('OCR Worker not initialized')
    const { data: { lines } } = await w.recognize(imageBufferOrUrl)
    
    return lines
      .filter((line: any) => {
        const text = line.text.trim()
        if (text.length === 0) return false
        
        // Lọc bỏ nhiễu (noise) từ viền/bóng đổ:
        if (!/[\p{L}\p{N}]/u.test(text)) return false
        
        // Bỏ qua các dòng có độ nhận diện (confidence) quá thấp
        if (line.confidence < 40) return false
        
        return true
      })
      .map((line: any) => ({
        text: line.text.trim(),
        bbox: line.bbox
      }))
  } catch (error) {
    console.error('OCR Lines Recognition failed:', error)
    throw error
  }
}
