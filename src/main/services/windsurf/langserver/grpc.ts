import { gzipSync, gunzipSync } from 'zlib'

export function grpcFrame(protoBuf: Buffer): Buffer {
  const compressed = gzipSync(protoBuf)
  const frame = Buffer.alloc(5 + compressed.length)
  frame[0] = 0x01 // compressed flag
  frame.writeUInt32BE(compressed.length, 1)
  compressed.copy(frame, 5)
  return frame
}

export function grpcUnframe(data: Buffer): Buffer {
  if (data.length < 5) return Buffer.alloc(0)

  const flags = data[0]
  const length = data.readUInt32BE(1)
  let payload = data.subarray(5, 5 + length)

  if (flags & 0x01) {
    payload = gunzipSync(payload)
  }

  return payload
}
