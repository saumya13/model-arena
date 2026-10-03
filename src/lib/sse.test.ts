import { describe, expect, it } from 'vitest'
import { readSseStream } from '@/lib/sse'

function streamFrom(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      // Split mid-line to also exercise the cross-chunk buffering path.
      const bytes = encoder.encode(text)
      const mid = Math.floor(bytes.length / 2)
      controller.enqueue(bytes.slice(0, mid))
      controller.enqueue(bytes.slice(mid))
      controller.close()
    },
  })
}

describe('readSseStream', () => {
  it('yields data payloads and skips comment/keep-alive lines', async () => {
    const raw = [
      ': OPENROUTER PROCESSING',
      'data: {"choices":[{"delta":{"content":"Hel"}}]}',
      '',
      ': OPENROUTER PROCESSING',
      'data: {"choices":[{"delta":{"content":"lo"}}]}',
      'data: {"choices":[{"delta":{}}],"usage":{"prompt_tokens":5,"completion_tokens":2,"total_tokens":7}}',
      'data: [DONE]',
      '',
    ].join('\n')

    const payloads: string[] = []
    for await (const payload of readSseStream(streamFrom(raw))) {
      payloads.push(payload)
    }

    expect(payloads).toHaveLength(3)
    expect(JSON.parse(payloads[0]).choices[0].delta.content).toBe('Hel')
    expect(JSON.parse(payloads[1]).choices[0].delta.content).toBe('lo')
    expect(JSON.parse(payloads[2]).usage.total_tokens).toBe(7)
  })

  it('stops at [DONE] without yielding it', async () => {
    const raw = 'data: {"choices":[{"delta":{"content":"x"}}]}\ndata: [DONE]\ndata: {"should":"never appear"}\n'
    const payloads: string[] = []
    for await (const payload of readSseStream(streamFrom(raw))) {
      payloads.push(payload)
    }
    expect(payloads).toEqual(['{"choices":[{"delta":{"content":"x"}}]}'])
  })
})
