<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{ type: 'success' | 'error'; message: string }>()

const visible = ref(false)

onMounted(() => {
  visible.value = true
  setTimeout(() => { visible.value = false }, 5000)
})
</script>

<template>
  <Transition name="slide">
    <div
      v-if="visible"
      class="fixed top-4 right-4 z-50 max-w-sm rounded-lg border px-4 py-3 shadow-lg"
      :class="{
        'bg-green-50 border-green-200 text-green-800': type === 'success',
        'bg-red-50 border-red-200 text-red-800': type === 'error',
      }"
    >
      <div class="flex items-center gap-2">
        <span class="text-xl">{{ type === 'success' ? '✅' : '❌' }}</span>
        <p class="text-sm font-medium">{{ message }}</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>