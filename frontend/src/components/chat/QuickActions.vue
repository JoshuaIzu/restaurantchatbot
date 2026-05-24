<script setup lang="ts">
const emit = defineEmits<{
  action: [command: string]
}>()

const commands = [
  { label: 'Menu', value: '1' },
  { label: 'Cart', value: '96' },
  { label: 'History', value: '98' },
  { label: 'Checkout', value: '99' },
  { label: 'Cancel', value: '0' },
]
</script>

<template>
  <div
    class="px-3 py-2 bg-gray-50 border-t flex gap-2 overflow-x-auto shrink-0"
    style="-webkit-overflow-scrolling: touch; scrollbar-width: none;"
  >
    <button
      v-for="cmd in commands"
      :key="cmd.value"
      @click="emit('action', cmd.value)"
      class="px-3 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:bg-blue-100 transition whitespace-nowrap flex-shrink-0"
    >
      {{ cmd.label }} ({{ cmd.value }})
    </button>
  </div>
</template>
