<script setup lang="ts">
import type { BotMessage } from '@/types'

defineProps<{
  message: BotMessage
}>()
</script>

<template>
  <div
    class="flex"
    :class="message.sender === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[80%] rounded-lg px-4 py-3 shadow-sm whitespace-pre-wrap"
      :class="{
        'bg-blue-600 text-white': message.sender === 'user',
        'bg-white text-gray-800 border border-gray-200': message.sender === 'bot',
        'bg-yellow-50 text-yellow-800 border border-yellow-200': message.sender === 'system',
      }"
    >
      {{ message.text }}
    </div>
  </div>
</template>
