import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ApiKeyState {
  apiKey: string | null
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set) => ({
      apiKey: null,
      setApiKey: (key) => set({ apiKey: key.trim() }),
      clearApiKey: () => set({ apiKey: null }),
    }),
    { name: 'model-arena.api-key' },
  ),
)
