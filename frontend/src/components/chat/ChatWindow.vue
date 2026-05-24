<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat.store'
import MessageBubble from './MessageBubble.vue'
import TypingIndicator from './TypingIndicator.vue'
import QuickActions from './QuickActions.vue'
import InputBar from './InputBar.vue'

const chatStore = useChatStore()
const scrollRef = ref<HTMLElement | null>(null)

watch(() => chatStore.messages.length, async () => {
  await nextTick()
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  }
})
</script>

<template>
  <div class="flex flex-col h-full md:h-[600px] w-full bg-gray-50 md:max-w-md md:mx-auto md:rounded-xl md:shadow-lg md:border md:border-gray-200">
    <div class="bg-blue-600 text-white px-4 py-4 md:rounded-t-xl font-bold text-lg flex items-center gap-2 shrink-0">
      🍽️ Restaurant ChatBot
    </div>

    <div ref="scrollRef" class="flex-1 overflow-y-auto p-4 space-y-4">
      <MessageBubble
        v-for="msg in chatStore.messages"
        :key="msg.id"
        :message="msg"
      />
      <TypingIndicator v-if="chatStore.isTyping" />
    </div>

    <QuickActions @action="chatStore.sendMessage" />
    <InputBar @send="chatStore.sendMessage" />
  </div>
</template>
