import Store from 'electron-store'

export interface Account {
  id: string
  app: 'windsurf' | 'kiro' | 'cursor'
  email: string
  password: string
  token?: string
  apiKey?: string
  tier: 'free' | 'pro'
  status: 'active' | 'disabled' | 'error'
  enabled?: boolean
  models: string[]
  credits: {
    daily_limit: number
    daily_used: number
    daily_remaining: number
  }
  createdAt: number
  lastUsed: number
}

interface StoreSchema {
  accounts: Account[]
}

const store = new Store<StoreSchema>({
  defaults: {
    accounts: []
  }
})

export async function initAccountManager(): Promise<void> {
  console.log('Account manager initialized')
}

export function getAllAccounts(): Account[] {
  return store.get('accounts', [])
}

export function getAccountsByApp(app: Account['app']): Account[] {
  return getAllAccounts().filter(acc => acc.app === app)
}

export function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'lastUsed'>): Account {
  // 验证必填字段
  if (!account.app || !account.email) {
    throw new Error('缺少必填字段: app 和 email 是必需的')
  }

  if (!['windsurf', 'kiro', 'cursor'].includes(account.app)) {
    throw new Error(`不支持的应用类型: ${account.app}，仅支持 windsurf、kiro、cursor`)
  }

  const accounts = getAllAccounts()

  // 检查邮箱是否已存在
  if (accounts.some(acc => acc.email === account.email && acc.app === account.app)) {
    throw new Error(`账号已存在: ${account.email} (${account.app})`)
  }

  const newAccount: Account = {
    ...account,
    id: Date.now().toString(),
    createdAt: Date.now(),
    lastUsed: 0
  }
  accounts.push(newAccount)
  store.set('accounts', accounts)
  return newAccount
}

export function updateAccount(id: string, updates: Partial<Account>): boolean {
  const accounts = getAllAccounts()
  const index = accounts.findIndex(acc => acc.id === id)
  if (index === -1) return false

  accounts[index] = { ...accounts[index], ...updates }
  store.set('accounts', accounts)
  return true
}

export function deleteAccount(id: string): boolean {
  const accounts = getAllAccounts()
  const filtered = accounts.filter(acc => acc.id !== id)
  if (filtered.length === accounts.length) return false

  store.set('accounts', filtered)
  return true
}

export function getAvailableAccount(model: string): Account | null {
  const accounts = getAllAccounts().filter(
    acc => acc.status === 'active' &&
           acc.enabled !== false &&
           acc.models.includes(model) &&
           acc.credits.daily_remaining > 0
  )

  if (accounts.length === 0) return null

  // 选择剩余额度最多的账号
  return accounts.reduce((prev, curr) =>
    curr.credits.daily_remaining > prev.credits.daily_remaining ? curr : prev
  )
}

export function toggleAccountEnabled(id: string, enabled: boolean): boolean {
  return updateAccount(id, { enabled })
}
