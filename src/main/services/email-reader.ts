import Imap from 'imap'
import { simpleParser } from 'mailparser'

interface EmailConfig {
  address: string
  password: string
  imap_server: string
  imap_port: number
}

export class EmailReader {
  private config: EmailConfig
  private imap: Imap | null = null

  constructor(config: EmailConfig) {
    this.config = config
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.config.address,
        password: this.config.password,
        host: this.config.imap_server,
        port: this.config.imap_port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      })

      this.imap.once('ready', () => {
        console.log('IMAP connected')
        resolve()
      })

      this.imap.once('error', (err: Error) => {
        console.error('IMAP error:', err)
        reject(err)
      })

      this.imap.connect()
    })
  }

  disconnect(): void {
    if (this.imap) {
      this.imap.end()
    }
  }

  async readLatestCode(targetEmail: string, timeoutMs: number = 60000): Promise<string> {
    if (!this.imap) {
      await this.connect()
    }

    let retryCount = 0
    const maxRetries = 6

    return new Promise((resolve, reject) => {
      const checkEmail = () => {
        retryCount++

        if (retryCount > maxRetries) {
          reject(new Error(`Timeout: No verification code found after ${maxRetries} attempts`))
          return
        }

        console.log(`Checking email (attempt ${retryCount}/${maxRetries})...`)

        // 检查 IMAP 连接状态，如果断开则重新连接
        if (!this.imap || this.imap.state !== 'authenticated') {
          console.log('IMAP connection lost, reconnecting...')
          this.connect().then(() => {
            checkEmail()
          }).catch((err) => {
            console.error('Failed to reconnect IMAP:', err)
            reject(err)
          })
          return
        }

        this.imap!.openBox('INBOX', false, (err) => {
          if (err) {
            reject(err)
            return
          }

          // 搜索最近的邮件 - 简化搜索条件
          const searchCriteria = ['ALL']

          this.imap!.search(searchCriteria, (err, results) => {
            if (err) {
              reject(err)
              return
            }

            if (!results || results.length === 0) {
              // 没有找到邮件，3秒后重试
              console.log('No emails found, retrying in 3 seconds...')
              setTimeout(checkEmail, 3000)
              return
            }

            // 获取最新的5封邮件
            const latestEmails = results.slice(-5)
            const fetch = this.imap!.fetch(latestEmails, {
              bodies: '',
              struct: true
            })

            let foundCode = false

            fetch.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, (err, parsed) => {
                  if (err || foundCode) return

                  // 打印邮件信息用于调试
                  console.log('Email received:')
                  console.log('  From:', parsed.from?.text)
                  console.log('  To:', parsed.to?.text)
                  console.log('  Subject:', parsed.subject)
                  console.log('  Date:', parsed.date)

                  // 检查是否是发给目标邮箱的
                  const to = parsed.to?.text || ''
                  if (!to.includes(targetEmail)) {
                    console.log(`  Skipped: not for ${targetEmail}`)
                    return
                  }

                  // 检查邮件时间（最近10分钟，放宽限制）
                  const emailDate = parsed.date
                  if (emailDate) {
                    const ageMinutes = (Date.now() - emailDate.getTime()) / 60000
                    console.log(`  Email age: ${ageMinutes.toFixed(1)} minutes`)
                    if (ageMinutes > 10) {
                      console.log('  Skipped: too old')
                      return
                    }
                  }

                  // 从邮件内容中提取验证码
                  const text = parsed.text || ''
                  const html = parsed.html || ''
                  const content = text + ' ' + html

                  console.log('  Content preview:', content.substring(0, 200))

                  const code = this.extractCode(content)

                  if (code && !foundCode) {
                    foundCode = true
                    console.log(`Found verification code: ${code}`)
                    // 关闭 IMAP 连接
                    if (this.imap) {
                      this.imap.closeBox((err) => {
                        if (err) console.error('Error closing mailbox:', err)
                      })
                    }
                    resolve(code)
                  } else {
                    console.log('  No code found in this email')
                  }
                })
              })
            })

            fetch.once('end', () => {
              if (!foundCode) {
                // 没有找到验证码，关闭邮箱后重试
                if (this.imap) {
                  this.imap.closeBox((err) => {
                    if (err) console.error('Error closing mailbox:', err)
                    console.log('No verification code found, retrying in 3 seconds...')
                    setTimeout(checkEmail, 3000)
                  })
                } else {
                  console.log('No verification code found, retrying in 3 seconds...')
                  setTimeout(checkEmail, 3000)
                }
              }
            })

            fetch.once('error', (err) => {
              reject(err)
            })
          })
        })
      }

      checkEmail()
    })
  }

  private extractCode(text: string): string {
    // 匹配常见验证码格式
    const patterns = [
      /(?<!\d)(\d{6})(?!\d)/, // 6位数字
      /(?<!\d)(\d{4})(?!\d)/, // 4位数字
      /(?<!\d)(\d{5})(?!\d)/, // 5位数字
      /(?<!\d)(\d{8})(?!\d)/  // 8位数字
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return ''
  }
}
