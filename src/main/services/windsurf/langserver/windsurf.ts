import { randomUUID } from 'crypto'
import { writeVarintField, writeStringField, writeMessageField, parseFields, getField } from './proto'

export const SOURCE = {
  USER: 1,
  ASSISTANT: 3
}

// 构建 Metadata
export function buildMetadata(apiKey: string): Buffer {
  return Buffer.concat([
    writeStringField(1, 'windsurf'),
    writeStringField(2, '1.9600.41'),
    writeStringField(3, apiKey),
    writeStringField(4, 'en'),
    writeStringField(5, 'linux'),
    writeStringField(7, '1.9600.41'),
    writeStringField(8, 'x86_64'),
    writeVarintField(9, Date.now()),
    writeStringField(10, randomUUID()),
    writeStringField(12, 'windsurf')
  ])
}

// 构建 Timestamp
function buildTimestamp(): Buffer {
  const now = Date.now()
  const secs = Math.floor(now / 1000)
  return writeVarintField(1, secs)
}

// 构建 ChatMessage
function buildChatMessage(role: 'user' | 'assistant', content: string): Buffer {
  const source = role === 'user' ? SOURCE.USER : SOURCE.ASSISTANT
  const messageId = randomUUID()
  const conversationId = randomUUID()

  if (role === 'user') {
    // IntentGeneric
    const intentGeneric = writeStringField(1, content)
    // ChatMessageIntent
    const intent = writeMessageField(1, intentGeneric)

    return Buffer.concat([
      writeStringField(1, messageId),
      writeVarintField(2, source),
      writeMessageField(3, buildTimestamp()),
      writeStringField(4, conversationId),
      writeMessageField(5, intent)
    ])
  } else {
    // Assistant message
    return Buffer.concat([
      writeStringField(1, messageId),
      writeVarintField(2, source),
      writeMessageField(3, buildTimestamp()),
      writeStringField(4, conversationId),
      writeStringField(5, content)
    ])
  }
}

// 构建 RawGetChatMessageRequest
export function buildRawGetChatMessageRequest(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  modelEnum: number
): Buffer {
  const metadata = buildMetadata(apiKey)
  const chatMessages = messages.map(msg =>
    buildChatMessage(msg.role as any, msg.content)
  )

  const parts = [
    writeMessageField(1, metadata),
    ...chatMessages.map(msg => writeMessageField(2, msg)),
    writeVarintField(4, modelEnum)
  ]

  return Buffer.concat(parts)
}

// 解析响应
export function parseRawResponse(buf: Buffer): { text: string; isError: boolean } {
  const fields = parseFields(buf)
  const deltaMessage = getField(fields, 1)

  if (!deltaMessage || !(deltaMessage.value instanceof Buffer)) {
    return { text: '', isError: false }
  }

  const msgFields = parseFields(deltaMessage.value as Buffer)
  const textField = getField(msgFields, 5)
  const isErrorField = getField(msgFields, 7)

  return {
    text: textField && textField.value instanceof Buffer
      ? textField.value.toString('utf-8')
      : '',
    isError: isErrorField ? Boolean(isErrorField.value) : false
  }
}
