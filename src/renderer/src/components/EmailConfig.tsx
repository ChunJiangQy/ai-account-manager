import { useState, useEffect } from 'react'

export default function EmailConfig() {
  const [qqEmail, setQqEmail] = useState('')
  const [qqPassword, setQqPassword] = useState('')
  const [gmailEmail, setGmailEmail] = useState('')
  const [gmailPassword, setGmailPassword] = useState('')
  const [erineUsername, setErineUsername] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const config = await (window as any).api.getEmailConfig()
      if (config) {
        setQqEmail(config.qq_mail?.address || '')
        setQqPassword(config.qq_mail?.password || '')
        setGmailEmail(config.gmail?.address || '')
        setGmailPassword(config.gmail?.password || '')
        setErineUsername(config.erine_email?.username || '')
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  const handleSave = async () => {
    // 验证必填字段
    if (!erineUsername) {
      alert('请填写 erine.email 用户名')
      return
    }

    // 至少需要配置一个真实邮箱
    if (!qqEmail && !gmailEmail) {
      alert('请至少配置一个真实邮箱（QQ 或 Gmail）用于接收验证码')
      return
    }

    if (qqEmail && !qqPassword) {
      alert('QQ 邮箱地址已填写，请填写授权码')
      return
    }

    if (qqPassword && !qqEmail) {
      alert('QQ 邮箱授权码已填写，请填写邮箱地址')
      return
    }

    if (gmailEmail && !gmailPassword) {
      alert('Gmail 地址已填写，请填写应用专用密码')
      return
    }

    if (gmailPassword && !gmailEmail) {
      alert('Gmail 应用专用密码已填写，请填写邮箱地址')
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (qqEmail && !emailRegex.test(qqEmail)) {
      alert('QQ 邮箱格式不正确')
      return
    }

    if (gmailEmail && !emailRegex.test(gmailEmail)) {
      alert('Gmail 邮箱格式不正确')
      return
    }

    setSaving(true)
    try {
      await (window as any).api.saveEmailConfig({
        qq_mail: qqEmail ? {
          address: qqEmail,
          password: qqPassword,
          imap_server: 'imap.qq.com',
          imap_port: 993
        } : undefined,
        gmail: gmailEmail ? {
          address: gmailEmail,
          password: gmailPassword,
          imap_server: 'imap.gmail.com',
          imap_port: 993
        } : undefined,
        erine_email: {
          username: erineUsername,
          domain: 'erine.email'
        }
      })
      alert('保存成功')
    } catch (error: any) {
      alert('保存失败: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 style={styles.title}>邮箱配置</h2>

      <div style={styles.container}>
        <div style={styles.column}>
          <h3 style={styles.columnTitle}>QQ 邮箱 <span style={styles.required}>*</span></h3>

          <div style={styles.field}>
            <label style={styles.label}>邮箱地址</label>
            <input
              style={styles.input}
              type="email"
              value={qqEmail}
              onChange={e => setQqEmail(e.target.value)}
              placeholder="your@qq.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>授权码</label>
            <input
              style={styles.input}
              type="password"
              value={qqPassword}
              onChange={e => setQqPassword(e.target.value)}
              placeholder="QQ邮箱授权码"
            />
          </div>

          <div style={styles.help}>
            <p style={styles.helpTitle}>如何获取授权码：</p>
            <ol style={styles.helpList}>
              <li>登录 QQ 邮箱网页版</li>
              <li>设置 → 账户 → POP3/IMAP/SMTP</li>
              <li>开启 IMAP 服务</li>
              <li>生成授权码</li>
            </ol>
          </div>
        </div>

        <div style={styles.column}>
          <h3 style={styles.columnTitle}>Gmail <span style={styles.required}>*</span></h3>

          <div style={styles.field}>
            <label style={styles.label}>邮箱地址</label>
            <input
              style={styles.input}
              type="email"
              value={gmailEmail}
              onChange={e => setGmailEmail(e.target.value)}
              placeholder="your@gmail.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>应用专用密码</label>
            <input
              style={styles.input}
              type="password"
              value={gmailPassword}
              onChange={e => setGmailPassword(e.target.value)}
              placeholder="Gmail应用专用密码"
            />
          </div>

          <div style={styles.help}>
            <p style={styles.helpTitle}>如何获取应用专用密码：</p>
            <ol style={styles.helpList}>
              <li>开启两步验证</li>
              <li>Google 账号 → 安全性</li>
              <li>应用专用密码</li>
              <li>生成新密码</li>
            </ol>
          </div>
        </div>
      </div>

      <div style={styles.erineSection}>
        <h3 style={styles.columnTitle}>erine.email 配置 <span style={styles.required}>*</span></h3>
        <div style={styles.field}>
          <label style={styles.label}>用户名 <span style={styles.required}>*</span></label>
          <input
            style={styles.input}
            type="text"
            value={erineUsername}
            onChange={e => setErineUsername(e.target.value)}
            placeholder="cjqy"
          />
          <p style={styles.hint}>
            在 erine.email 注册的用户名，邮件会转发到上面配置的真实邮箱
          </p>
        </div>
      </div>

      <button
        style={{...styles.btn, ...(saving ? styles.btnDisabled : {})}}
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
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginBottom: '30px'
  },
  column: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px'
  },
  columnTitle: {
    fontSize: '16px',
    marginBottom: '15px',
    color: '#333',
    fontWeight: 'bold' as const
  },
  field: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    color: '#666'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px'
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '5px'
  },
  help: {
    marginTop: '20px',
    padding: '15px',
    background: '#f5f5f5',
    borderRadius: '6px'
  },
  helpTitle: {
    fontSize: '13px',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    color: '#666'
  },
  helpList: {
    fontSize: '12px',
    color: '#666',
    paddingLeft: '20px',
    lineHeight: '1.6'
  },
  erineSection: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  required: {
    color: '#ef4444',
    marginLeft: '4px'
  },
  btn: {
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
