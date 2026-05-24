<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  send: [text: string]
}>()

const input = ref('')

function handleSend() {
  if (!input.value.trim()) return
  emit('send', input.value)
  input.value = ''
}
</script>

<template>
  <div class="p-3 bg-white border-t flex gap-2 shrink-0">
    <input
      v-model="input"
      @keyup.enter="handleSend"
      type="text"
      inputmode="text"
      placeholder="Type a number or message..."
      class="flex-1 px-4 py-3 md:py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      @click="handleSend"
      class="px-5 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition font-medium text-base"
    >
      Send
    </button>
  </div>
</template>
