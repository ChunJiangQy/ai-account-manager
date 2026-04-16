import { useState } from 'react'

interface Props {
  onSuccess: () => void
}

export default function RegisterPanel({ onSuccess }: Props) {
  const [app, setApp] = useState<'windsurf' | 'kiro' | 'cursor'>('windsurf')
  const [emailType, setEmailType] = useState<'custom' | 'erine'>('erine')
  const [emailProvider, setEmailProvider] = useState<'qq' | 'gmail'>('qq')
  const [email, setEmail] = useState('')
  const [erinePrefix, setErinePrefix] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [headless, setHeadless] = useState(true)
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let pwd = ''
    for (let i = 0; i < 12; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)]
    }
    return pwd
  }

  const generateName = () => {
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    return `${firstName} ${lastName}`
  }

  const handleRegister = async () => {
    let finalEmail = email
    let finalPassword = password
    let finalName = name

    // 如果没填密码，自动生成
    if (!finalPassword.trim()) {
      finalPassword = generatePassword()
    }

    // 如果没填姓名，自动生成
    if (!finalName.trim()) {
      finalName = generateName()
    }

    if (emailType === 'erine') {
      // 从配置中获取 erine 用户名
      const config = await (window as any).api.getEmailConfig()
      if (!config.erine_email?.username) {
        alert('请先在"邮箱配置"中设置 erine.email 用户名')
        return
      }

      // 生成随机前缀
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let prefix = 'windsurf'

      if (erinePrefix.trim()) {
        // 支持逗号分隔的多个前缀
        const prefixes = erinePrefix.split(',').map(p => p.trim()).filter(p => p)
        if (prefixes.length > 0) {
          // 随机选择一个前缀
          prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
        }
      }

      // 在前缀后面加随机字符
      let suffix = ''
      for (let i = 0; i < 6; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)]
      }

      finalEmail = `${prefix}${suffix}.${config.erine_email.username}@erine.email`
    } else {
      if (!email) {
        alert('请输入邮箱地址')
        return
      }
    }

    setLoading(true)
    setLog([])
    addLog('开始注册...')

    try {
      if (app === 'windsurf') {
        addLog('使用 Windsurf 注册流程')
        addLog(`邮箱: ${finalEmail}`)
        addLog(`密码: ${finalPassword}`)
        addLog(`姓名: ${finalName}`)
        const result = await (window as any).api.registerWindsurf({
          email: finalEmail,
          password: finalPassword,
          name: finalName,
          headless: headless,
          emailProvider: emailProvider
        })
        addLog('注册成功！')
        addLog(`账号: ${result.email}`)
        addLog(`Token: ${result.token?.substring(0, 30)}...`)
        onSuccess()
      } else {
        addLog(`${app} 注册功能开发中...`)
      }
    } catch (error: any) {
      addLog(`注册失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>注册新账号</h2>

      <div style={styles.mainContent}>
        <div style={styles.formSection}>
          <div style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>选择应用</label>
          <select style={styles.select} value={app} onChange={e => setApp(e.target.value as any)}>
            <option value="windsurf">Windsurf</option>
            <option value="kiro">Kiro (开发中)</option>
            <option value="cursor">Cursor (开发中)</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>邮箱类型</label>
          <select style={styles.select} value={emailType} onChange={e => setEmailType(e.target.value as any)}>
            <option value="erine">erine.email (推荐)</option>
            <option value="custom">自定义邮箱</option>
          </select>
        </div>

        {emailType === 'erine' ? (
          <>
            <div style={styles.field}>
              <label style={styles.label}>验证码接收邮箱</label>
              <select style={styles.select} value={emailProvider} onChange={e => setEmailProvider(e.target.value as any)}>
                <option value="qq">QQ 邮箱</option>
                <option value="gmail">Gmail</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>erine.email 前缀（可选）</label>
              <input
                style={styles.input}
                type="text"
                value={erinePrefix}
                onChange={e => setErinePrefix(e.target.value)}
                placeholder="gpt,chat,windsurf (多个用逗号分隔，留空默认windsurf)"
              />
              <p style={styles.hint}>
                注册时会从多个前缀中随机选一个并加上随机后缀
              </p>
            </div>
          </>
        ) : (
          <div style={styles.field}>
            <label style={styles.label}>邮箱</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>密码（留空自动生成）</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="至少8位，留空自动生成"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>姓名（留空自动生成）</label>
          <input
            style={styles.input}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="First Last，留空自动生成"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>浏览器模式</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                checked={headless}
                onChange={() => setHeadless(true)}
                style={styles.radio}
              />
              无头浏览器（后台运行）
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                checked={!headless}
                onChange={() => setHeadless(false)}
                style={styles.radio}
              />
              有头浏览器（可见窗口）
            </label>
          </div>
        </div>

        <button
          style={{...styles.btn, ...(loading ? styles.btnDisabled : {})}}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? '注册中...' : '开始注册'}
        </button>
      </div>
    </div>

    <div style={styles.logSection}>
      <h3 style={styles.logTitle}>注册日志</h3>
      <div style={styles.log}>
        {log.length === 0 ? (
          <div style={styles.logEmpty}>等待开始注册...</div>
        ) : (
          log.map((line, i) => (
            <div key={i} style={styles.logLine}>{line}</div>
          ))
        )}
      </div>
    </div>
  </div>
</div>
  )
}

const styles = {
  container: {
    width: '100%'
  },
  title: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#333'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '500px 1fr',
    gap: '30px'
  },
  formSection: {
    width: '100%'
  },
  form: {
    width: '100%'
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
  select: {
    width: '100%',
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px'
  },
  generateBtn: {
    padding: '10px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '5px'
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer'
  },
  radio: {
    marginRight: '8px',
    cursor: 'pointer'
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  logSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%'
  },
  logTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#333'
  },
  log: {
    background: '#1e1e1e',
    color: '#00ff00',
    padding: '15px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '12px',
    height: '500px',
    overflowY: 'auto' as const,
    flex: 1
  },
  logEmpty: {
    color: '#666',
    textAlign: 'center' as const,
    paddingTop: '20px'
  },
  logLine: {
    marginBottom: '5px'
  }
}
