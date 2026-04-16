import { useState } from 'react'

export default function ProxyStatus() {
  const [showUsage, setShowUsage] = useState(false)
  const [showEndpoints, setShowEndpoints] = useState(false)

  return (
    <div>
      <h2 style={styles.title}>反代服务状态</h2>

      <div style={styles.statusCard}>
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>服务地址</span>
          <span style={styles.statusValue}>http://localhost:3220</span>
        </div>

        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>状态</span>
          <span style={{...styles.statusValue, color: '#22c55e'}}>运行中</span>
        </div>

        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>兼容协议</span>
          <span style={styles.statusValue}>OpenAI API / Anthropic API</span>
        </div>
      </div>

      <div style={styles.section}>
        <div
          style={styles.sectionHeader}
          onClick={() => setShowUsage(!showUsage)}
        >
          <h3 style={styles.sectionTitle}>使用示例</h3>
          <span style={styles.arrow}>{showUsage ? '▼' : '▶'}</span>
        </div>
        {showUsage && (
          <div>
            <h4 style={styles.apiTitle}>OpenAI 格式</h4>
            <pre style={styles.code}>{`curl http://localhost:3220/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'`}</pre>

            <h4 style={styles.apiTitle}>Anthropic 格式</h4>
            <pre style={styles.code}>{`curl http://localhost:3220/v1/messages \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'`}</pre>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div
          style={styles.sectionHeader}
          onClick={() => setShowEndpoints(!showEndpoints)}
        >
          <h3 style={styles.sectionTitle}>支持的端点</h3>
          <span style={styles.arrow}>{showEndpoints ? '▼' : '▶'}</span>
        </div>
        {showEndpoints && (
          <div style={styles.endpoints}>
            <div style={styles.endpoint}>
              <span style={styles.method}>POST</span>
              <span style={styles.path}>/v1/chat/completions</span>
              <span style={styles.badge}>OpenAI</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.method}>POST</span>
              <span style={styles.path}>/v1/messages</span>
              <span style={styles.badge}>Anthropic</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.method}>GET</span>
              <span style={styles.path}>/v1/models</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  title: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#333'
  },
  statusCard: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px'
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  statusLabel: {
    fontSize: '14px',
    color: '#666'
  },
  statusValue: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#333'
  },
  section: {
    marginBottom: '30px'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '6px',
    marginBottom: '10px',
    transition: 'background 0.2s'
  },
  sectionTitle: {
    fontSize: '16px',
    margin: 0,
    color: '#333'
  },
  arrow: {
    fontSize: '12px',
    color: '#666'
  },
  apiTitle: {
    fontSize: '14px',
    marginTop: '15px',
    marginBottom: '10px',
    color: '#667eea',
    fontWeight: 'bold' as const
  },
  code: {
    background: '#1e1e1e',
    color: '#00ff00',
    padding: '15px',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'monospace',
    overflow: 'auto' as const
  },
  endpoints: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  endpoint: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '6px'
  },
  method: {
    fontSize: '12px',
    fontWeight: 'bold' as const,
    padding: '4px 8px',
    background: '#667eea',
    color: 'white',
    borderRadius: '4px'
  },
  path: {
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#333'
  },
  badge: {
    fontSize: '11px',
    padding: '2px 6px',
    background: '#667eea',
    color: 'white',
    borderRadius: '4px',
    marginLeft: '10px'
  }
}
