/**
 * Reads a fetch Response body as a line-buffered SSE stream, yielding each
 * `data:` payload as a raw string. Skips blank lines and `:`-prefixed
 * comment lines (OpenRouter sends `: OPENROUTER PROCESSING` keep-alives that
 * are valid SSE but not JSON). Stops before yielding the terminal `[DONE]`.
 */
export async function* readSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const rawLine of lines) {
        const line = rawLine.trimEnd()
        if (!line || line.startsWith(':')) continue
        if (!line.startsWith('data:')) continue

        const payload = line.slice(5).trim()
        if (payload === '[DONE]') return
        yield payload
      }
    }
  } finally {
    reader.releaseLock()
  }
}
