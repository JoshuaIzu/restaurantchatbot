<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useSessionStore } from '@/stores/session.store'
import { useChatStore } from '@/stores/chat.store'
import { initSocket, reconnectSocket } from '@/services/socket.client'
import ChatWindow from '@/components/chat/ChatWindow.vue'
import PaymentAlert from '@/components/payment/PaymentAlert.vue'
import PaymentModal from '@/components/payment/PaymentModal.vue'
import type { OrderItem } from '@/types'

const sessionStore = useSessionStore()
const chatStore = useChatStore()

const showPaymentAlert = ref(false)
const alertType = ref<'success' | 'error'>('success')
const alertMessage = ref('')
const showPaymentModal = ref(false)
const paymentUrl = ref('')
const pendingItems = ref<OrderItem[]>([])
const pendingTotal = ref(0)
const pendingCurrency = ref('NGN')
const pendingAuthUrl = ref('')

// Watch for backend state transitions to open payment modal
watch(() => chatStore.currentState, async (newState) => {
  if (newState === 'awaiting_payment' || newState === 'awaiting_schedule') {
    const pending = chatStore.pendingPayment
    if (pending) {
      pendingItems.value = []
      pendingTotal.value = pending.total
      pendingCurrency.value = pending.currency
      pendingAuthUrl.value = pending.authorizationUrl
      showPaymentModal.value = true
    }
  }
})

// Watch for Express session ID sync and reconnect socket
watch(() => sessionStore.expressSessionId, (newExpressId) => {
  if (newExpressId) {
    console.log('Reconnecting socket with Express session ID:', newExpressId)
    const socket = reconnectSocket(newExpressId)
    setupSocketListeners(socket)
  }
})

function setupSocketListeners(socket: ReturnType<typeof initSocket>) {
  socket.on('payment_success', (data: { message: string; orderId: string }) => {
    chatStore.addSystemMessage(data.message)
    alertType.value = 'success'
    alertMessage.value = data.message
    showPaymentAlert.value = true
    paymentUrl.value = ''
  })

  socket.on('payment_failed', (data: { message: string }) => {
    chatStore.addSystemMessage(data.message)
    alertType.value = 'error'
    alertMessage.value = data.message
    showPaymentAlert.value = true
  })
}

function handlePayNow(_email: string, url: string) {
  paymentUrl.value = url
  showPaymentModal.value = false
  window.open(url, '_blank')
}

onMounted(async () => {
  const sessionId = sessionStore.getOrCreateSessionId()

  await chatStore.loadHistory(sessionId)

  const socket = initSocket(sessionId)
  setupSocketListeners(socket)
})
</script>

<template>
  <div class="h-full bg-white md:h-auto md:min-h-screen md:bg-gray-100 md:flex md:items-center md:justify-center md:p-4">
    <div class="h-full w-full md:h-auto md:max-w-md relative">
      <ChatWindow />

      <PaymentModal
        v-if="showPaymentModal"
        :items="pendingItems"
        :total="pendingTotal"
        :currency="pendingCurrency"
        :authorization-url="pendingAuthUrl"
        @close="showPaymentModal = false"
        @payNow="handlePayNow"
      />

      <PaymentAlert
        v-if="showPaymentAlert"
        :type="alertType"
        :message="alertMessage"
      />
    </div>
  </div>
</template>
