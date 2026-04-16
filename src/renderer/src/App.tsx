import { useState, useEffect } from 'react'
import AccountList from './components/AccountList'
import RegisterPanel from './components/RegisterPanel'
import ProxyStatus from './components/ProxyStatus'
import EmailConfig from './components/EmailConfig'

export default function App() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'register' | 'email' | 'proxy'>('accounts')
  const [accounts, setAccounts] = useState<any[]>([])
  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    const data = await (window as any).api.getAccounts()
    setAccounts(data)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>AI Account Manager</h1>
        <div style={styles.tabs}>
          <button
            style={{...styles.tab, ...(activeTab === 'accounts' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('accounts')}
          >
            账号管理
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'register' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('register')}
          >
            注册账号
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'email' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('email')}
          >
            邮箱配置
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'proxy' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('proxy')}
          >
            反代服务
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {activeTab === 'accounts' && <AccountList accounts={accounts} onRefresh={loadAccounts} />}
        {activeTab === 'register' && <RegisterPanel onSuccess={loadAccounts} />}
        {activeTab === 'email' && <EmailConfig />}
        {activeTab === 'proxy' && <ProxyStatus />}
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    padding: '20px'
  },
  header: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '24px',
    marginBottom: '15px',
    color: '#333'
  },
  tabs: {
    display: 'flex',
    gap: '10px'
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    background: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s'
  },
  tabActive: {
    background: '#667eea',
    color: 'white'
  },
  content: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    minHeight: 'calc(100vh - 180px)'
  }
}
