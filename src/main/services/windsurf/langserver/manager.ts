import { spawn, ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

let lsProcess: ChildProcess | null = null
const LS_PORT = 8999

function findLanguageServerBinary(): string | null {
  // 常见的 Language Server 路径
  const possiblePaths = [
    'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Programs\\Antigravity\\resources\\app\\extensions\\antigravity\\bin\\language_server_windows_x64.exe',
    'C:\\Program Files\\Windsurf\\resources\\app\\extensions\\codeium\\dist\\language_server_windows_x64.exe',
    'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Programs\\Windsurf\\resources\\app\\extensions\\codeium\\dist\\language_server_windows_x64.exe',
    '/opt/windsurf/language_server_linux_x64',
    '/usr/local/bin/language_server_linux_x64'
  ]

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p
    }
  }

  return null
}

export async function startLanguageServer(): Promise<void> {
  if (lsProcess) {
    console.log('Language Server already running')
    return
  }

  const binaryPath = findLanguageServerBinary()
  if (!binaryPath) {
    console.warn('Language Server binary not found, model calls will fail')
    return
  }

  console.log(`Starting Language Server: ${binaryPath}`)

  const dataDir = `C:\\Users\\${process.env.USERNAME}\\.windsurf-manager`

  lsProcess = spawn(binaryPath, [
    `--api_server_url=https://server.self-serve.windsurf.com`,
    `--server_port=${LS_PORT}`,
    `--csrf_token=windsurf-api-csrf-token`,
    `--register_user_url=https://api.codeium.com/register_user/`,
    `--codeium_dir=${dataDir}`,
    `--database_dir=${dataDir}\\db`,
    '--enable_local_search=false',
    '--enable_index_service=false',
    '--enable_lsp=false',
    '--detect_proxy=false'
  ], {
    stdio: 'pipe'
  })

  lsProcess.stdout?.on('data', (data) => {
    console.log(`[LS] ${data.toString().trim()}`)
  })

  lsProcess.stderr?.on('data', (data) => {
    console.error(`[LS Error] ${data.toString().trim()}`)
  })

  lsProcess.on('exit', (code) => {
    console.log(`Language Server exited with code ${code}`)
    lsProcess = null
  })

  // 等待启动
  await new Promise(resolve => setTimeout(resolve, 3000))
  console.log(`Language Server started on port ${LS_PORT}`)
}

export function stopLanguageServer(): void {
  if (lsProcess) {
    lsProcess.kill()
    lsProcess = null
    console.log('Language Server stopped')
  }
}

export function isLanguageServerRunning(): boolean {
  return lsProcess !== null
}
