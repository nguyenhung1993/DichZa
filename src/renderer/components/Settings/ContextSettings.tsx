import { useState, useEffect } from 'react'
import { AppSettings, SmartContext } from '../../../shared/types'

interface Props {
  settings: AppSettings
  onSave: (updates: Partial<AppSettings>) => void
}

export default function ContextSettings({ settings, onSave }: Props) {
  const [context, setContext] = useState<SmartContext>(settings.smartContext)

  useEffect(() => {
    setContext(settings.smartContext)
  }, [settings.smartContext])

  const handleUpdate = (updates: Partial<SmartContext['persistent']>) => {
    const newContext = {
      ...context,
      persistent: {
        ...context.persistent,
        ...updates
      }
    }
    setContext(newContext)
    onSave({ smartContext: newContext })
  }

  const handleAddGlossary = (term: string, trans: string) => {
    if (!term || !trans) return
    const newGlossary = { ...context.persistent.glossary, [term]: trans }
    handleUpdate({ glossary: newGlossary })
  }

  const handleRemoveGlossary = (term: string) => {
    const newGlossary = { ...context.persistent.glossary }
    delete newGlossary[term]
    handleUpdate({ glossary: newGlossary })
  }

  return (
    <div className="settings-subgroup">
      <div className="settings-item settings-item--col">
        <span className="settings-item__label">Vai trò AI (Role)</span>
        <input 
          type="text" 
          className="settings-input"
          value={context.persistent.role} 
          onChange={e => handleUpdate({ role: e.target.value })}
          placeholder="VD: Bạn là một phiên dịch chuyên nghiệp..."
        />
      </div>

      <div className="settings-item">
        <span className="settings-item__label">Lĩnh vực (Domain)</span>
        <select 
          className="settings-item__select"
          value={context.persistent.domain}
          onChange={e => handleUpdate({ domain: e.target.value })}
        >
          <option value="general">Chung (General)</option>
          <option value="IT/Software">Công nghệ phần mềm</option>
          <option value="Business">Kinh doanh</option>
          <option value="Casual">Đời sống thường ngày</option>
        </select>
      </div>

      <div className="settings-item">
        <span className="settings-item__label">Ngữ điệu (Tone)</span>
        <select 
          className="settings-item__select"
          value={context.persistent.tone}
          onChange={e => handleUpdate({ tone: e.target.value as any })}
        >
          <option value="professional">Chuyên nghiệp (Professional)</option>
          <option value="formal">Trang trọng (Formal)</option>
          <option value="friendly">Thân thiện (Friendly)</option>
          <option value="casual">Gần gũi (Casual)</option>
        </select>
      </div>

      <div className="settings-item settings-item--col">
        <span className="settings-item__label">Từ điển chuyên ngành (Glossary)</span>
        <div className="glossary-list">
          {Object.entries(context.persistent.glossary).map(([term, trans]) => (
            <div key={term} className="glossary-item">
              <span className="glossary-term">{term}</span>
              <span className="glossary-arrow">→</span>
              <span className="glossary-trans">{trans}</span>
              <button onClick={() => handleRemoveGlossary(term)} className="glossary-del">✕</button>
            </div>
          ))}
        </div>
        <GlossaryForm onAdd={handleAddGlossary} />
      </div>
    </div>
  )
}

function GlossaryForm({ onAdd }: { onAdd: (term: string, trans: string) => void }) {
  const [term, setTerm] = useState('')
  const [trans, setTrans] = useState('')

  const submit = () => {
    onAdd(term, trans)
    setTerm('')
    setTrans('')
  }

  return (
    <div className="glossary-add">
      <input 
        className="settings-input" 
        placeholder="Từ gốc" 
        value={term} 
        onChange={e => setTerm(e.target.value)} 
      />
      <input 
        className="settings-input" 
        placeholder="Nghĩa" 
        value={trans} 
        onChange={e => setTrans(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
      />
      <button className="glossary-btn" onClick={submit}>Thêm</button>
    </div>
  )
}
