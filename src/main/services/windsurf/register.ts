import { chromium, Browser, Page } from 'playwright'
import type { Account } from '../account-manager'
import { getEmailConfig } from '../email-config'
import { EmailReader } from '../email-reader'

export interface RegisterOptions {
  email: string
  password: string
  name: string
  headless?: boolean
  emailProvider?: 'qq' | 'gmail'
}

export async function registerWindsurf(options: RegisterOptions): Promise<Account> {
  const { email, password, name, headless = true, emailProvider = 'qq' } = options

  const browser = await chromium.launch({ headless })
  const page = await browser.newPage()

  try {
    // 访问注册页面
    await page.goto('https://windsurf.com/account/register')
    await page.waitForLoadState('domcontentloaded')

    // 填写表单
    const [firstName, lastName] = name.split(' ')
    await page.fill('input[placeholder*="first name" i]', firstName)
    await page.fill('input[placeholder*="last name" i]', lastName || 'User')
    await page.fill('input[type="email"]', email)

    // 勾选条款
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.count() > 0) {
      await checkbox.check()
    }

    // 点击继续
    await page.click('button:has-text("Continue")')
    await page.waitForTimeout(2000)

    // 填写密码
    const pwdInputs = await page.locator('input[type="password"]').all()
    for (const input of pwdInputs) {
      await input.fill(password)
    }

    // 提交
    await page.click('button:has-text("Continue"), button:has-text("Sign up")')
    await page.waitForTimeout(3000)

    let extractedToken: string | null = null

    // 处理验证码
    const otpInputs = await page.locator('input[type="text"]').all()
    if (otpInputs.length >= 6) {
      console.log('Waiting for verification code...')

      // 从邮箱读取验证码
      const emailConfig = getEmailConfig()
      const emailCfg = emailProvider === 'qq' ? emailConfig.qq_mail : emailConfig.gmail

      if (!emailCfg) {
        throw new Error(`${emailProvider.toUpperCase()} email not configured`)
      }

      const reader = new EmailReader(emailCfg)

      try {
        const code = await reader.readLatestCode(email, 120000) // 等待2分钟
        console.log(`Got verification code: ${code}`)

        // 填写验证码
        for (let i = 0; i < 6 && i < code.length; i++) {
          await otpInputs[i].fill(code[i])
          await page.waitForTimeout(200)
        }

        console.log('Verification code filled, waiting for validation...')

        // 等待2秒让验证码自动验证
        await page.waitForTimeout(2000)

        // 检查是否有提交按钮需要点击
        const createBtn = page.locator('button:has-text("Create account")')
        const verifyBtn = page.locator('button:has-text("Verify")')
        const continueBtn = page.locator('button:has-text("Continue")')

        if (await createBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('Clicking Create account button...')
          await createBtn.click()
        } else if (await verifyBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('Clicking Verify button...')
          await verifyBtn.click()
        } else if (await continueBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('Clicking Continue button...')
          await continueBtn.click()
        } else {
          console.log('No submit button found, assuming auto-submit')
        }

        // 等待 sessionToken 出现在 localStorage 中
        console.log('Waiting for sessionToken in localStorage...')

        // 在页面跳转前尝试获取 token
        try {
          await page.waitForFunction(
            () => {
              const token = window.localStorage.getItem('devin_session_token')
              return token !== null && token !== ''
            },
            { timeout: 30000 }
          )

          // 立即提取 token 和 Firebase idToken，避免页面跳转
          const tokens = await page.evaluate(() => {
            let token = window.localStorage.getItem('devin_session_token')
            if (token) {
              try {
                token = JSON.parse(token)
              } catch {}
            }

            // 尝试从 Firebase SDK 提取 idToken
            let firebaseIdToken = null
            try {
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && key.startsWith('firebase:authUser:')) {
                  const authData = JSON.parse(localStorage.getItem(key) || '{}')
                  if (authData.stsTokenManager && authData.stsTokenManager.accessToken) {
                    firebaseIdToken = authData.stsTokenManager.accessToken
                    break
                  }
                }
              }
            } catch (e) {
              console.log('Failed to extract Firebase idToken:', e)
            }

            return { sessionToken: token, firebaseIdToken }
          })

          extractedToken = tokens.sessionToken
          if (tokens.firebaseIdToken) {
            console.log('Firebase idToken extracted from browser')
            ;(extractedToken as any).firebaseIdToken = tokens.firebaseIdToken
          }

          console.log('SessionToken extracted:', extractedToken?.substring(0, 30) + '...')
        } catch (error) {
          console.log('Failed to get token before navigation, will retry after page loads')
        }

        // 如果还没有获取到 token，等待页面加载完成后再获取
        if (!extractedToken) {
          await page.waitForLoadState('domcontentloaded')
          await page.waitForTimeout(2000)
        }
      } finally {
        // 确保断开 IMAP 连接
        reader.disconnect()
      }
    }

    // 提取 sessionToken（如果之前没有提取到）
    let finalToken: string
    if (extractedToken) {
      finalToken = extractedToken
    } else {
      finalToken = await extractSessionToken(page)
    }

    await browser.close()

    // 获取 Firebase ID token
    let idToken: string
    if ((finalToken as any).firebaseIdToken) {
      // 从浏览器提取的 Firebase idToken
      console.log('Using Firebase idToken from browser')
      idToken = (finalToken as any).firebaseIdToken
      finalToken = typeof finalToken === 'string' ? finalToken : (finalToken as any).sessionToken
    } else {
      // 通过 Firebase API 登录获取 idToken
      console.log('Getting Firebase ID token via API...')
      try {
        idToken = await getFirebaseIdToken(email, password)
      } catch (error: any) {
        console.warn('Firebase API login failed:', error.message)
        console.warn('Will use sessionToken as fallback')
        // 如果 Firebase 登录失败，使用 sessionToken 作为 fallback
        return {
          app: 'windsurf',
          email,
          password,
          token: finalToken,
          apiKey: finalToken,
          tier: 'free',
          status: 'active',
          models: ['gpt-4o-mini', 'gemini-2.5-flash', 'glm-5.1'],
          credits: {
            daily_limit: 25,
            daily_used: 0,
            daily_remaining: 25
          }
        } as any
      }
    }

    // 转换为 API Key
    console.log('Converting to API key...')
    const apiKey = await convertTokenToApiKey(idToken)
    console.log(`API key obtained: ${apiKey.slice(0, 15)}...`)

    return {
      app: 'windsurf',
      email,
      password,
      token: finalToken,
      apiKey,
      tier: 'free',
      status: 'active',
      models: ['gpt-4o-mini', 'gemini-2.5-flash', 'glm-5.1'],
      credits: {
        daily_limit: 25,
        daily_used: 0,
        daily_remaining: 25
      }
    } as any
  } catch (error) {
    await browser.close()
    throw error
  }
}

async function extractSessionToken(page: Page): Promise<string> {
  const localStorage = await page.evaluate(() => {
    const data: Record<string, string> = {}
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        data[key] = window.localStorage.getItem(key) || ''
      }
    }
    return data
  })

  let token = localStorage['devin_session_token']
  if (!token) {
    throw new Error('Failed to extract sessionToken')
  }

  // 处理可能的 JSON 编码
  try {
    token = JSON.parse(token)
  } catch {}

  return token
}

async function getFirebaseIdToken(email: string, password: string): Promise<string> {
  const https = await import('https')
  const FIREBASE_API_KEY = 'AIzaSyDsOl-1XpT5err0Tcnx8FFod1H8gVGIycY'

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Referer': 'https://windsurf.com/',
        'Origin': 'https://windsurf.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          if (result.error) {
            reject(new Error(`Firebase login failed: ${result.error.message}`))
          } else if (!result.idToken) {
            reject(new Error('Firebase response missing idToken'))
          } else {
            resolve(result.idToken)
          }
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function convertTokenToApiKey(idToken: string): Promise<string> {
  const https = await import('https')

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ firebase_id_token: idToken })
    const options = {
      hostname: 'api.codeium.com',
      path: '/register_user/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          if (!result.api_key) {
            reject(new Error('Codeium response missing api_key'))
          } else {
            resolve(result.api_key)
          }
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}
