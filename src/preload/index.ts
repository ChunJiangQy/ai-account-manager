import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // 账号管理
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  addAccount: (account: any) => ipcRenderer.invoke('add-account', account),
  deleteAccount: (id: string) => ipcRenderer.invoke('delete-account', id),
  importAccounts: (accounts: any[]) => ipcRenderer.invoke('import-accounts', accounts),

  // 邮箱配置
  getEmailConfig: () => ipcRenderer.invoke('get-email-config'),
  saveEmailConfig: (config: any) => ipcRenderer.invoke('save-email-config', config),

  // Windsurf 注册
  registerWindsurf: (options: any) => ipcRenderer.invoke('register-windsurf', options)
})
