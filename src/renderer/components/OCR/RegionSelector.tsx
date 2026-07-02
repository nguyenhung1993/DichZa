import { useState, useRef, useEffect } from 'react'
import { recognizeLines, OcrLine } from '../../services/ocrService'
import './RegionSelector.css'

export default function RegionSelector() {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [translatedLines, setTranslatedLines] = useState<{
    original: string
    translated: string
    x: number
    y: number
    width: number
    height: number
  }[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    async function initStream() {
      try {
        const sources = await window.dichza.getDesktopSources()
        
        // Parse displayId from hash: #/ocr?displayId=123
        const searchParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
        const displayId = searchParams.get('displayId')
        
        let source = sources[0]
        if (displayId) {
          source = sources.find((s: any) => s.display_id === displayId || s.display_id === displayId.toString()) || sources[0]
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id,
              minWidth: 1280,
              maxWidth: 4000,
              minHeight: 720,
              maxHeight: 4000
            }
          } as any
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Error accessing desktop stream:', err)
      }
    }
    initStream()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.dichza.closeOcrWindow()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Nếu đang hiện kết quả dịch, click bất kỳ đâu để đóng
    if (translatedLines.length > 0) {
      window.dichza.closeOcrWindow()
      return
    }
    if (isProcessing) return
    setIsSelecting(true)
    setStartX(e.clientX)
    setStartY(e.clientY)
    setCurrentX(e.clientX)
    setCurrentY(e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || isProcessing) return
    setCurrentX(e.clientX)
    setCurrentY(e.clientY)
  }

  const handleMouseUp = async () => {
    if (!isSelecting || isProcessing) return
    setIsSelecting(false)
    setIsProcessing(true)

    const x = Math.min(startX, currentX)
    const y = Math.min(startY, currentY)
    const width = Math.abs(currentX - startX)
    const height = Math.abs(currentY - startY)

    if (width < 20 || height < 20) {
       setIsProcessing(false)
       return
    }

    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      // Phóng to ảnh 2.5x để Tesseract nhận diện chữ nhỏ (UI hệ thống) tốt hơn
      const SCALE_FACTOR = 2.5
      canvas.width = width * SCALE_FACTOR
      canvas.height = height * SCALE_FACTOR
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Source video dimensions
        const video = videoRef.current
        // Sử dụng window.screen thay vì window.inner để tính tỷ lệ chính xác
        // tránh lỗi tọa độ bị lệch khi cửa sổ bị Taskbar ép nhỏ lại
        const scaleX = video.videoWidth / window.screen.width
        const scaleY = video.videoHeight / window.screen.height
        
        ctx.drawImage(
          video,
          x * scaleX, y * scaleY, width * scaleX, height * scaleY,
          0, 0, width * SCALE_FACTOR, height * SCALE_FACTOR
        )

        const dataUrl = canvas.toDataURL('image/png')
        try {
          const lines = await recognizeLines(dataUrl)
          
          if (lines && lines.length > 0) {
            // Translate all lines in parallel
            const translations = await Promise.all(
              lines.map(async (line: OcrLine) => {
                try {
                  const res = await window.dichza.translateGoogle(line.text, 'auto', 'vi')
                  return {
                    original: line.text,
                    translated: res.text,
                    // Map bbox relative to the cropped scaled canvas back to screen coordinates
                    x: x + (line.bbox.x0 / SCALE_FACTOR),
                    y: y + (line.bbox.y0 / SCALE_FACTOR),
                    width: (line.bbox.x1 - line.bbox.x0) / SCALE_FACTOR,
                    height: (line.bbox.y1 - line.bbox.y0) / SCALE_FACTOR
                  }
                } catch (e) {
                  return null
                }
              })
            )
            setTranslatedLines(translations.filter(Boolean) as any)
          } else {
             window.dichza.closeOcrWindow()
          }
        } catch (error) {
          console.error(error)
          window.dichza.closeOcrWindow()
        } finally {
          setIsProcessing(false)
        }
      }
    }
  }

  const rectX = Math.min(startX, currentX)
  const rectY = Math.min(startY, currentY)
  const rectW = Math.abs(currentX - startX)
  const rectH = Math.abs(currentY - startY)

  return (
    <div 
      className="region-selector-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <video ref={videoRef} autoPlay playsInline muted className="hidden-video" />
      <canvas ref={canvasRef} style={{display: 'none'}} />
      
      {isSelecting && (
        <div 
          className="selection-box"
          style={{
            left: rectX,
            top: rectY,
            width: rectW,
            height: rectH
          }}
        />
      )}
      
      {isProcessing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <span>Đang nhận diện văn bản...</span>
        </div>
      )}
      
      {!isSelecting && !isProcessing && translatedLines.length === 0 && (
        <div className="hint-text">
          Kéo thả để chọn vùng văn bản (ESC để hủy)
        </div>
      )}
      
      {/* In-Place Translated Blocks */}
      {translatedLines.map((line: any, idx) => (
        <div 
          key={idx}
          className="in-place-translation"
          style={{
            left: line.x,
            top: line.y,
            minWidth: Math.max(line.width, 20),
            height: line.height, // Ép cứng chiều cao chuẩn của Tesseract
            fontSize: Math.max(line.height * 0.7, 10), // Font size ăn theo chiều cao gốc
          }}
          title={line.original}
        >
          <div className="translation-text-inner">
            {line.translated}
          </div>
        </div>
      ))}
    </div>
  )
}
