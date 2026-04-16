import http2 from 'http2'
import { grpcFrame, grpcUnframe } from './grpc'
import { buildRawGetChatMessageRequest, parseRawResponse } from './windsurf'

const MODEL_ENUMS: Record<string, number> = {
  'gpt-4o-mini': 1,
  'gemini-2.5-flash': 2,
  'glm-5.1': 3
}

export async function callLanguageServer(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  port = 8999
): Promise<string> {
  const modelEnum = MODEL_ENUMS[model] || 1

  const proto = buildRawGetChatMessageRequest(apiKey, messages, modelEnum)
  const body = grpcFrame(proto)

  return new Promise((resolve, reject) => {
    const client = http2.connect(`http://localhost:${port}`)
    const req = client.request({
      ':method': 'POST',
      ':path': '/exa.language_server_pb.LanguageServerService/RawGetChatMessage',
      'content-type': 'application/grpc+proto',
      'te': 'trailers'
    })

    let responseText = ''

    req.on('data', (chunk: Buffer) => {
      try {
        const payload = grpcUnframe(chunk)
        if (payload.length > 0) {
          const parsed = parseRawResponse(payload)
          if (parsed.isError) {
            reject(new Error(parsed.text))
            return
          }
          responseText += parsed.text
        }
      } catch (error) {
        console.error('Parse error:', error)
      }
    })

    req.on('end', () => {
      client.close()
      resolve(responseText)
    })

    req.on('error', (error) => {
      client.close()
      reject(error)
    })

    req.write(body)
    req.end()
  })
}
