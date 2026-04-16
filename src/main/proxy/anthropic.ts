import { Request, Response } from 'express'
import { getAvailableAccount, updateAccount } from '../services/account-manager'
import { mapModel } from '../services/proxy-config'

// Anthropic 格式转 OpenAI 格式
function anthropicToOpenAI(anthropicRequest: any): any {
  const messages = anthropicRequest.messages || []

  // 处理 system 消息
  let systemMessage = anthropicRequest.system
  let openaiMessages = []

  if (systemMessage) {
    openaiMessages.push({
      role: 'system',
      content: systemMessage
    })
  }

  // 转换消息格式
  for (const msg of messages) {
    openaiMessages.push({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content.map((c: any) => {
        if (c.type === 'text') return c.text
        return c
      }).join('')
    })
  }

  return {
    model: anthropicRequest.model,
    messages: openaiMessages,
    max_tokens: anthropicRequest.max_tokens || 1000,
    temperature: anthropicRequest.temperature,
    top_p: anthropicRequest.top_p,
    stream: anthropicRequest.stream || false
  }
}

// OpenAI 响应转 Anthropic 格式
function openaiToAnthropic(openaiResponse: any, model: string): any {
  const choice = openaiResponse.choices[0]

  return {
    id: openaiResponse.id,
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: choice.message.content
      }
    ],
    model: model,
    stop_reason: choice.finish_reason === 'stop' ? 'end_turn' : choice.finish_reason,
    stop_sequence: null,
    usage: {
      input_tokens: openaiResponse.usage.prompt_tokens,
      output_tokens: openaiResponse.usage.completion_tokens
    }
  }
}

// Anthropic 聊天接口
export async function handleAnthropicChat(req: Request, res: Response) {
  try {
    const anthropicRequest = req.body
    const { model: requestedModel, max_tokens, stream = false } = anthropicRequest

    if (!requestedModel || !anthropicRequest.messages) {
      return res.status(400).json({
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message: 'Missing model or messages'
        }
      })
    }

    // 映射模型名称
    const actualModel = mapModel(requestedModel)
    console.log(`Model mapping: ${requestedModel} -> ${actualModel}`)

    // 选择可用账号
    const account = getAvailableAccount(actualModel)
    if (!account) {
      return res.status(503).json({
        type: 'error',
        error: {
          type: 'overloaded_error',
          message: `No available account for model: ${actualModel} (requested: ${requestedModel})`
        }
      })
    }

    // 转换为 OpenAI 格式
    const openaiRequest = anthropicToOpenAI(anthropicRequest)

    // 根据应用类型调用对应的服务
    let result
    switch (account.app) {
      case 'windsurf':
        const { callWindsurfModel } = await import('../services/windsurf/client')
        result = await callWindsurfModel(account, actualModel, openaiRequest.messages, max_tokens, stream)
        break
      case 'kiro':
        throw new Error('Kiro not implemented yet')
      case 'cursor':
        throw new Error('Cursor not implemented yet')
      default:
        throw new Error(`Unknown app: ${account.app}`)
    }

    // 转换为 Anthropic 格式（使用原始请求的模型名）
    const anthropicResponse = openaiToAnthropic(result, requestedModel)

    // 更新使用统计
    updateAccount(account.id, {
      lastUsed: Date.now(),
      credits: {
        ...account.credits,
        daily_used: account.credits.daily_used + 1,
        daily_remaining: account.credits.daily_remaining - 1
      }
    })

    res.json(anthropicResponse)
  } catch (error: any) {
    console.error('Anthropic proxy error:', error)
    res.status(500).json({
      type: 'error',
      error: {
        type: 'api_error',
        message: error.message
      }
    })
  }
}
