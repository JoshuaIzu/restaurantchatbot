import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const sessionId = ref<string>('')
  const expressSessionId = ref<string>('')

  function getOrCreateSessionId(): string {
    if (!sessionId.value) {
      const stored = localStorage.getItem('chat_session_id')
      if (stored) {
        sessionId.value = stored
      } else {
        sessionId.value = crypto.randomUUID()
        localStorage.setItem('chat_session_id', sessionId.value)
      }
    }
    return sessionId.value
  }

  function syncExpressSessionId(id: string) {
    if (expressSessionId.value !== id) {
      expressSessionId.value = id
    }
  }

  return { sessionId, expressSessionId, getOrCreateSessionId, syncExpressSessionId }
})

