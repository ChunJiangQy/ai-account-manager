import { ensureLs, getLsFor } from './windsurf-api/langserver.js'
import { WindsurfClient } from './windsurf-api/client.js'
import { MODELS } from './windsurf-api/models.js'
import type { Account } from '../account-manager'

export async function callWindsurfModel(
  account: Account,
  model: string,
  messages: any[],
  maxTokens: number,
  stream: boolean
): Promise<any> {
  try {
    // 获取 Language Server
    const ls = await getLsFor(null)

    // 创建客户端
    const client = new WindsurfClient(account.apiKey!, ls.port, ls.csrfToken)

    // 获取模型配置
    const modelConfig = MODELS[model]
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`)
    }

    // 调用模型
    const chunks = await client.rawGetChatMessage(
      messages,
      modelConfig.enumValue,
      model,
      {}
    )

    const responseText = chunks.map((c: any) => c.text).join('')

    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseText
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: Math.ceil(messages.reduce((sum: number, m: any) => sum + m.content.length / 4, 0)),
        completion_tokens: Math.ceil(responseText.length / 4),
        total_tokens: Math.ceil((messages.reduce((sum: number, m: any) => sum + m.content.length / 4, 0)) + (responseText.length / 4))
      }
    }
  } catch (error: any) {
    throw new Error(`Windsurf model call failed: ${error.message}`)
  }
}
