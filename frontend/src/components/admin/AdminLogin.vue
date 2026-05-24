<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '@/stores/admin.store'

const adminStore = useAdminStore()
const accessCode = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleLogin() {
  if (!accessCode.value.trim()) return
  isLoading.value = true
  error.value = ''
  try {
    const success = await adminStore.login(accessCode.value)
    if (!success) error.value = 'Invalid access code'
  } catch {
    error.value = 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200">
      <div class="p-6 space-y-1">
        <h2 class="text-xl font-bold">Admin Dashboard</h2>
        <p class="text-sm text-gray-500">Enter your access code to manage the menu.</p>
      </div>

      <div class="px-6 pb-6">
        <form @submit.prevent="handleLogin">
          <div>
            <label for="access-code" class="text-sm font-medium">Access Code</label>
            <input
              id="access-code"
              v-model="accessCode"
              type="password"
              placeholder="Enter admin key"
              class="w-full mt-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {{ isLoading ? 'Verifying...' : 'Continue' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>