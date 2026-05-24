<script setup lang="ts">
import { ref, computed } from 'vue'
import type { OrderItem } from '@/types'

const props = defineProps<{
  items: OrderItem[]
  total: number
  currency: string
  authorizationUrl: string
}>()

const emit = defineEmits<{
  close: []
  payNow: [email: string, url: string]
}>()

const email = ref('')
const emailError = ref('')
const isProcessing = ref(false)

const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))

function handlePayNow() {
  if (!email.value.trim()) {
    emailError.value = 'Email is required for payment receipt'
    return
  }
  if (!isValidEmail.value) {
    emailError.value = 'Please enter a valid email address'
    return
  }
  emailError.value = ''
  isProcessing.value = true

  emit('payNow', email.value, props.authorizationUrl)
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
      <h2 class="text-xl font-bold mb-4">Complete Payment</h2>
      <p class="text-gray-600 mb-2">Total: {{ currency === 'NGN' ? '₦' : '$' }}{{ total.toLocaleString() }}</p>
      <p class="text-gray-500 text-sm mb-4">Enter your email to receive the payment receipt.</p>

      <div class="mb-4">
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="you@example.com"
          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="{ 'border-red-500': emailError }"
        />
        <p v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailError }}</p>
      </div>

      <button
        @click="handlePayNow"
        :disabled="isProcessing"
        class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        Pay Now
      </button>
      <button
        @click="emit('close')"
        class="w-full py-3 mt-2 text-gray-600 hover:text-gray-800 transition"
      >
        Cancel
      </button>
    </div>
  </div>
</template>