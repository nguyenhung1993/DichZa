import { useState, useRef, useEffect } from 'react'
import { recognizeText } from '../../services/ocrService'
import './RegionSelector.css'

export default function RegionSelector() {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    async function initStream() {
      try {
        const sources = await window.hotlingo.getDesktopSources()
        
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
        window.hotlingo.closeOcrWindow()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
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
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Source video dimensions
        const video = videoRef.current
        const scaleX = video.videoWidth / window.innerWidth
        const scaleY = video.videoHeight / window.innerHeight
        
        ctx.drawImage(
          video,
          x * scaleX, y * scaleY, width * scaleX, height * scaleY,
          0, 0, width, height
        )

        const dataUrl = canvas.toDataURL('image/png')
        try {
          const text = await recognizeText(dataUrl)
          if (text) {
             window.hotlingo.sendOcrResult(text)
          } else {
             // No text found, close
             window.hotlingo.closeOcrWindow()
          }
        } catch (error) {
          console.error(error)
          window.hotlingo.closeOcrWindow()
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
      
      {!isSelecting && !isProcessing && (
        <div className="hint-text">
          Kéo thả để chọn vùng văn bản (ESC để hủy)
        </div>
      )}
    </div>
  )
}
