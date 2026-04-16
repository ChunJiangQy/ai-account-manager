import { ensureLs, getLsFor, restartLsForProxy } from './windsurf-api/langserver.js'
import { WindsurfClient } from './windsurf-api/client.js'
import { MODELS } from './windsurf-api/models.js'
import type { Account } from '../account-manager'

export async function callWindsurfModel(
  account: Account,
  model: string,
  messages: any[],
  maxTokens: number,
  stream: boolean,
  retryCount: number = 0
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

    let responseText = ''
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }

    // 根据模型配置选择流程
    if (modelConfig.modelUid) {
      // Cascade 流程（新模型）
      await client.cascadeChat(messages, modelConfig.enumValue, modelConfig.modelUid, {
        onChunk: (chunk: any) => {
          if (chunk.text) {
            responseText += chunk.text
          }
        },
        onEnd: (finalUsage: any) => {
          if (finalUsage) {
            usage = {
              prompt_tokens: finalUsage.inputTokens || 0,
              completion_tokens: finalUsage.outputTokens || 0,
              total_tokens: (finalUsage.inputTokens || 0) + (finalUsage.outputTokens || 0)
            }
          }
        }
      })
    } else {
      // Legacy 流程（旧模型）
      const chunks = await client.rawGetChatMessage(
        messages,
        modelConfig.enumValue,
        model,
        {}
      )
      responseText = chunks.map((c: any) => c.text).join('')
    }

    // 如果没有获取到 usage，使用估算值
    if (usage.prompt_tokens === 0) {
      usage = {
        prompt_tokens: Math.ceil(messages.reduce((sum: number, m: any) => sum + m.content.length / 4, 0)),
        completion_tokens: Math.ceil(responseText.length / 4),
        total_tokens: Math.ceil((messages.reduce((sum: number, m: any) => sum + m.content.length / 4, 0)) + (responseText.length / 4))
      }
    }

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
      usage
    }
  } catch (error: any) {
    const errorMsg = error.message || String(error)

    // 检查是否是 Cascade 会话错误
    if (errorMsg.includes('failed_precondition') || errorMsg.includes('Cascade session')) {
      if (retryCount < 2) {
        console.log(`Cascade session error, restarting Language Server and retrying (attempt ${retryCount + 1}/2)...`)

        // 重启 Language Server
        await restartLsForProxy(null)

        // 等待 2 秒让 LS 完全启动
        await new Promise(resolve => setTimeout(resolve, 2000))

        // 重试
        return callWindsurfModel(account, model, messages, maxTokens, stream, retryCount + 1)
      }
    }

    throw new Error(`Windsurf model call failed: ${errorMsg}`)
  }
}
