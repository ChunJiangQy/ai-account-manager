import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { startProxyServer } from './proxy'
import {
  initAccountManager,
  getAllAccounts,
  addAccount,
  deleteAccount
} from './services/account-manager'
import { getEmailConfig, saveEmailConfig } from './services/email-config'
import { registerWindsurf } from './services/windsurf/register'
import { ensureLs } from './services/windsurf/windsurf-api/langserver.js'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function setupIPC(): void {
  ipcMain.handle('get-accounts', () => {
    return getAllAccounts()
  })

  ipcMain.handle('add-account', (_, account) => {
    return addAccount(account)
  })

  ipcMain.handle('delete-account', (_, id) => {
    return deleteAccount(id)
  })

  ipcMain.handle('import-accounts', (_, accounts) => {
    const results = { success: 0, failed: 0, errors: [] as string[] }
    for (const acc of accounts) {
      try {
        addAccount(acc)
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`${acc.email || '未知邮箱'}: ${error.message}`)
      }
    }
    return results
  })

  ipcMain.handle('get-email-config', () => {
    return getEmailConfig()
  })

  ipcMain.handle('save-email-config', (_, config) => {
    saveEmailConfig(config)
    return { success: true }
  })

  ipcMain.handle('register-windsurf', async (_, options) => {
    const account = await registerWindsurf(options)
    return addAccount(account)
  })
}

app.whenReady().then(async () => {
  try {
    console.log('[1/4] Initializing account manager...')
    await initAccountManager()

    console.log('[2/4] Setting up IPC handlers...')
    setupIPC()

    console.log('[3/4] Starting Language Server...')
    await ensureLs(null)

    console.log('[4/4] Starting proxy server...')
    await startProxyServer(3220)

    console.log('[OK] Application started')
    console.log('  Proxy server: http://localhost:3220')
    console.log('  Language Server: integrated')

    createWindow()
  } catch (error: any) {
    console.error('[ERROR] Failed to start application:', error.message)
    console.error('Please close any other running instances and try again.')
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
