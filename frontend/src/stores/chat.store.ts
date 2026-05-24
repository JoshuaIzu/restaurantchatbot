import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '@/services/api.client'
import type { BotMessage, MessageSender, ChatMessage, OrderItem } from '@/types'
import { useSessionStore } from '@/stores/session.store'


export const useChatStore = defineStore('chat', () => {
  const messages = ref<BotMessage[]>([])
  const isTyping = ref(false)
  const currentState = ref<string>('main_menu')
  const cart = ref<OrderItem[]>([])
  const pendingPayment = ref<{ orderId: string; authorizationUrl: string; total: number; currency: string } | null>(null)

  async function loadHistory(sessionId: string) {
    try {
      const history = await apiClient.getChatHistory(sessionId)
      if (history.length > 0) {
        messages.value = history.map((msg: ChatMessage) => ({
          id: msg.id,
          sender: msg.sender as MessageSender,
          text: msg.text,
          timestamp: new Date(msg.createdAt),
        }))
      } else {
        messages.value = [{
          id: crypto.randomUUID(),
          sender: 'bot',
          text: 'Welcome to Our Restaurant!\nReply 1 to see the menu.',
          timestamp: new Date(),
        }]
      }
    } catch {
      messages.value = [{
        id: crypto.randomUUID(),
        sender: 'bot',
        text: 'Welcome to Our Restaurant!\nReply 1 to see the menu.',
        timestamp: new Date(),
      }]
    }
  }

  async function sendMessage(text: string): Promise<string | undefined> {
    if (!text.trim()) return

    // Add user message to UI
    messages.value.push({
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date(),
    })
    isTyping.value = true

    try {
      // SECURITY FIX: Always send input to the backend for validation
      const response = await apiClient.sendChatMessage(text)

      // 1. Update our local state tracker with the strict backend truth
      currentState.value = response.state

      // 2. Sync cart and pending payment from backend session
      if (response.cart) {
        cart.value = response.cart
      }
      if (response.pendingPayment) {
        pendingPayment.value = response.pendingPayment
      }

      // 3. Sync Express session ID for socket notifications
      if (response.sessionId) {
        const sessionStore = useSessionStore()
        sessionStore.syncExpressSessionId(response.sessionId)
      }

      // 4. Render the bot's response messages
      response.messages.forEach((msgText: string) => {
        messages.value.push({
          id: crypto.randomUUID(),
          sender: 'bot',
          text: msgText,
          timestamp: new Date(),
        })
      })

      return response.sessionId
    } catch (error) {
      addSystemMessage('⚠️ Connection lost. Please try again.')
    } finally {
      isTyping.value = false
    }
  }

  function addSystemMessage(text: string) {
    messages.value.push({
      id: crypto.randomUUID(),
      sender: 'system',
      text,
      timestamp: new Date(),
    })
  }

  return { messages, isTyping, currentState, cart, pendingPayment, loadHistory, sendMessage, addSystemMessage }
})