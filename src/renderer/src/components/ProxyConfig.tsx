import { useState, useEffect } from 'react'

export default function ProxyConfig() {
  const [defaultModel, setDefaultModel] = useState('glm-5.1')
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [newClaudeModel, setNewClaudeModel] = useState('')
  const [newTargetModel, setNewTargetModel] = useState('glm-5.1')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const config = await (window as any).api.getProxyConfig()
      if (config) {
        setDefaultModel(config.defaultModel || 'glm-5.1')
        setMappings(config.modelMapping || {})
      }
    } catch (error) {
      console.error('Failed to load proxy config:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await (window as any).api.saveProxyConfig({
        defaultModel,
        modelMapping: mappings
      })
      alert('保存成功')
    } catch (error: any) {
      alert('保存失败: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddMapping = () => {
    if (!newClaudeModel.trim()) {
      alert('请输入 Claude 模型名称')
      return
    }
    setMappings({
      ...mappings,
      [newClaudeModel]: newTargetModel
    })
    setNewClaudeModel('')
  }

  const handleDeleteMapping = (claudeModel: string) => {
    const newMappings = { ...mappings }
    delete newMappings[claudeModel]
    setMappings(newMappings)
  }

  return (
    <div>
      <h2 style={styles.title}>模型映射配置</h2>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>默认模型</h3>
        <p style={styles.hint}>当 Claude 模型没有配置映射时，使用此模型</p>
        <select
          style={styles.select}
          value={defaultModel}
          onChange={e => setDefaultModel(e.target.value)}
        >
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
          <option value="glm-5.1">glm-5.1</option>
        </select>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>模型映射规则</h3>
        <p style={styles.hint}>将 Claude 模型名映射到实际支持的模型</p>

        <div style={styles.mappingList}>
          {Object.entries(mappings).map(([claudeModel, targetModel]) => (
            <div key={claudeModel} style={styles.mappingItem}>
              <div style={styles.mappingContent}>
                <span style={styles.claudeModel}>{claudeModel}</span>
                <span style={styles.arrow}>→</span>
                <span style={styles.targetModel}>{targetModel}</span>
              </div>
              <button
                style={styles.deleteBtn}
                onClick={() => handleDeleteMapping(claudeModel)}
              >
                删除
              </button>
            </div>
          ))}
        </div>

        <div style={styles.addMapping}>
          <input
            style={styles.input}
            type="text"
            value={newClaudeModel}
            onChange={e => setNewClaudeModel(e.target.value)}
            placeholder="claude-sonnet-4-20250514"
          />
          <span style={styles.arrow}>→</span>
          <select
            style={styles.select}
            value={newTargetModel}
            onChange={e => setNewTargetModel(e.target.value)}
          >
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            <option value="glm-5.1">glm-5.1</option>
          </select>
          <button style={styles.addBtn} onClick={handleAddMapping}>
            添加
          </button>
        </div>
      </div>

      <button
        style={{...styles.saveBtn, ...(saving ? styles.btnDisabled : {})}}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '保存中...' : '保存配置'}
      </button>
    </div>
  )
}

const styles = {
  title: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#333'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px'
  },
  sectionTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#333',
    fontWeight: 'bold' as const
  },
  hint: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '15px'
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px'
  },
  mappingList: {
    marginBottom: '20px'
  },
  mappingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#f5f5f5',
    borderRadius: '6px',
    marginBottom: '10px'
  },
  mappingContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flex: 1
  },
  claudeModel: {
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#667eea',
    fontWeight: 'bold' as const
  },
  arrow: {
    fontSize: '16px',
    color: '#999'
  },
  targetModel: {
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#10b981',
    fontWeight: 'bold' as const
  },
  deleteBtn: {
    padding: '6px 12px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  addMapping: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px'
  },
  addBtn: {
    padding: '10px 20px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap' as const
  },
  saveBtn: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
}
