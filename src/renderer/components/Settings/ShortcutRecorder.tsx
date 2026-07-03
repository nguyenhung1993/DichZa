import { useState, useEffect, KeyboardEvent } from 'react'

interface Props {
  initialShortcut: string
  onChange: (shortcut: string) => void
}

export default function ShortcutRecorder({ initialShortcut, onChange }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [currentKeys, setCurrentKeys] = useState<string[]>([])

  useEffect(() => {
    if (!isRecording) {
      setCurrentKeys(initialShortcut ? initialShortcut.split('+') : [])
    }
  }, [isRecording, initialShortcut])

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!isRecording) return
    e.preventDefault()
    e.stopPropagation()

    const key = e.key

    // Ignore standalone modifier presses unless combined with another key
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      const keys = []
      if (e.ctrlKey) keys.push('CommandOrControl')
      if (e.altKey) keys.push('Alt')
      if (e.shiftKey) keys.push('Shift')
      if (e.metaKey && !keys.includes('CommandOrControl')) keys.push('Super')
      setCurrentKeys(keys)
      return
    }

    const keys = []
    if (e.ctrlKey) keys.push('CommandOrControl')
    if (e.altKey) keys.push('Alt')
    if (e.shiftKey) keys.push('Shift')
    if (e.metaKey && !keys.includes('CommandOrControl')) keys.push('Super')

    let keyName = key
    // Map some keys to Electron Accelerator string formats
    if (keyName === ' ') keyName = 'Space'
    else if (keyName === 'Escape') keyName = 'Esc'
    else if (keyName.length === 1) keyName = keyName.toUpperCase()

    keys.push(keyName)
    setCurrentKeys(keys)
    
    // Auto-stop recording on character key press
    const finalShortcut = keys.join('+')
    onChange(finalShortcut)
    setIsRecording(false)
  }

  const handleBlur = () => {
    setIsRecording(false)
  }

  return (
    <button
      className={`shortcut-recorder ${isRecording ? 'recording' : ''}`}
      onClick={() => setIsRecording(true)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      title="Click để đổi phím tắt"
      style={{
        background: isRecording ? 'var(--primary)' : 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        color: isRecording ? '#fff' : 'var(--text-primary)',
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 'bold',
        minWidth: '120px',
        textAlign: 'center',
        outline: 'none',
        transition: 'all 0.2s'
      }}
    >
      {isRecording ? (
        currentKeys.length > 0 ? currentKeys.join(' + ') : 'Nhấn tổ hợp phím...'
      ) : (
        currentKeys.length > 0 ? currentKeys.join(' + ') : 'Click để gán'
      )}
    </button>
  )
}
