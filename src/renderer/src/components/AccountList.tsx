interface Account {
  id: string
  app: string
  email: string
  tier: string
  status: string
  enabled?: boolean
  models: string[]
  credits: {
    daily_remaining: number
    daily_limit: number
  }
}

interface Props {
  accounts: Account[]
  onRefresh: () => void
}

export default function AccountList({ accounts, onRefresh }: Props) {
  const handleDelete = async (id: string) => {
    if (confirm('确定删除此账号？')) {
      await (window as any).api.deleteAccount(id)
      onRefresh()
    }
  }

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    await (window as any).api.toggleAccountEnabled(id, !currentEnabled)
    onRefresh()
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        const accountsToImport = Array.isArray(data) ? data : [data]

        const result = await (window as any).api.importAccounts(accountsToImport)

        if (result.failed > 0) {
          alert(`导入完成\n成功: ${result.success} 个\n失败: ${result.failed} 个\n\n失败原因:\n${result.errors.join('\n')}`)
        } else {
          alert(`成功导入 ${result.success} 个账号`)
        }

        onRefresh()
      } catch (error: any) {
        alert('导入失败: ' + error.message)
      }
    }
    input.click()
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>账号列表 ({accounts.length})</h2>
        <div style={styles.buttonGroup}>
          <button style={styles.importBtn} onClick={handleImport}>
            批量导入
          </button>
          <button style={styles.refreshBtn} onClick={onRefresh}>
            刷新
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div style={styles.empty}>暂无账号，请先注册</div>
      ) : (
        <div style={styles.grid}>
          {accounts.map(account => (
            <div key={account.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.app}>{account.app.toUpperCase()}</span>
                <span style={{...styles.status, ...(account.status === 'active' ? styles.statusActive : {})}}>
                  {account.status}
                </span>
              </div>

              <div style={styles.email}>{account.email}</div>

              <div style={styles.tier}>
                {account.tier === 'free' ? '🆓 免费版' : '💎 专业版'}
              </div>

              <div style={styles.credits}>
                Token: {account.credits.daily_remaining}/{account.credits.daily_limit}
              </div>

              <div style={styles.models}>
                {account.models.map(model => (
                  <span key={model} style={styles.modelTag}>{model}</span>
                ))}
              </div>

              <div style={styles.buttonRow}>
                <button
                  style={{
                    ...styles.toggleBtn,
                    ...(account.enabled !== false ? styles.toggleBtnEnabled : styles.toggleBtnDisabled)
                  }}
                  onClick={() => handleToggleEnabled(account.id, account.enabled !== false)}
                >
                  {account.enabled !== false ? '✓ 已启用' : '✗ 已禁用'}
                </button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(account.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '20px',
    color: '#333'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  importBtn: {
    padding: '8px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  refreshBtn: {
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  empty: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#999',
    fontSize: '16px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px'
  },
  card: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '15px',
    position: 'relative' as const
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  app: {
    fontSize: '12px',
    fontWeight: 'bold' as const,
    color: '#667eea'
  },
  status: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px',
    background: '#f5f5f5',
    color: '#999'
  },
  statusActive: {
    background: '#d1fae5',
    color: '#22c55e'
  },
  email: {
    fontSize: '14px',
    marginBottom: '8px',
    color: '#333',
    wordBreak: 'break-all' as const
  },
  tier: {
    fontSize: '13px',
    marginBottom: '8px',
    color: '#666'
  },
  credits: {
    fontSize: '13px',
    marginBottom: '10px',
    color: '#666'
  },
  models: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '5px',
    marginBottom: '10px'
  },
  modelTag: {
    fontSize: '11px',
    padding: '2px 6px',
    background: '#f0f0f0',
    borderRadius: '4px',
    color: '#666'
  },
  buttonRow: {
    display: 'flex',
    gap: '8px'
  },
  toggleBtn: {
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold' as const
  },
  toggleBtnEnabled: {
    background: '#10b981',
    color: 'white'
  },
  toggleBtnDisabled: {
    background: '#f5f5f5',
    color: '#999'
  },
  deleteBtn: {
    flex: 1,
    padding: '8px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  }
}
