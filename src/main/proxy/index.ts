import express, { Request, Response } from 'express'
import { getAvailableAccount, updateAccount } from '../services/account-manager'
import { handleAnthropicChat } from './anthropic'

const app = express()
app.use(express.json())

// OpenAI 兼容的聊天接口
app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  try {
    const { model, messages, max_tokens = 1000, stream = false } = req.body

    if (!model || !messages) {
      return res.status(400).json({ error: 'Missing model or messages' })
    }

    // 选择可用账号
    const account = getAvailableAccount(model)
    if (!account) {
      return res.status(503).json({ error: 'No available account for this model' })
    }

    // 根据应用类型调用对应的服务
    let result
    switch (account.app) {
      case 'windsurf':
        const { callWindsurfModel } = await import('../services/windsurf/client')
        result = await callWindsurfModel(account, model, messages, max_tokens, stream)
        break
      case 'kiro':
        // TODO: 实现 Kiro 调用
        throw new Error('Kiro not implemented yet')
      case 'cursor':
        // TODO: 实现 Cursor 调用
        throw new Error('Cursor not implemented yet')
      default:
        throw new Error(`Unknown app: ${account.app}`)
    }

    // 更新使用统计
    updateAccount(account.id, {
      lastUsed: Date.now(),
      credits: {
        ...account.credits,
        daily_used: account.credits.daily_used + 1,
        daily_remaining: account.credits.daily_remaining - 1
      }
    })

    res.json(result)
  } catch (error: any) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Anthropic 兼容的聊天接口
app.post('/v1/messages', handleAnthropicChat)

// 获取可用模型列表
app.get('/v1/models', (req: Request, res: Response) => {
  // TODO: 从所有账号聚合模型列表
  res.json({
    data: [
      { id: 'gpt-4o-mini', object: 'model' },
      { id: 'gemini-2.5-flash', object: 'model' },
      { id: 'glm-5.1', object: 'model' }
    ]
  })
})

export async function startProxyServer(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Proxy server running on http://localhost:${port}`)
      resolve()
    })

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[ERROR] Port ${port} is already in use. Please close the other instance first.`)
        reject(new Error(`Port ${port} is already in use`))
      } else {
        console.error(`[ERROR] Failed to start proxy server:`, err.message)
        reject(err)
      }
    })
  })
}
