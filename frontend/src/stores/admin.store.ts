import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '@/services/api.client'
import type { MenuItem } from '@/types'

export const useAdminStore = defineStore('admin', () => {
  const isAuthenticated = ref(false)
  const adminKey = ref('')
  const menuItems = ref<MenuItem[]>([])
  const isLoading = ref(false)
  const error = ref('')

  async function login(key: string): Promise<boolean> {
    try {
      const isValid = await apiClient.adminLogin(key)
      if (isValid) {
        isAuthenticated.value = true
        adminKey.value = key
        sessionStorage.setItem('admin_key', key)
        await loadMenu()
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async function loadMenu() {
    if (!adminKey.value) return
    isLoading.value = true
    error.value = ''
    try {
      menuItems.value = await apiClient.adminGetMenu(adminKey.value)
    } catch {
      error.value = 'Failed to load menu'
    } finally {
      isLoading.value = false
    }
  }

  async function createItem(item: { name: string; price: number; category: string }) {
    if (!adminKey.value) return
    try {
      await apiClient.adminCreateMenuItem(adminKey.value, item)
      await loadMenu()
    } catch {
      error.value = 'Failed to create item'
    }
  }

  async function updateItem(
    id: string,
    item: { name?: string; price?: number; category?: string; available?: boolean }
  ) {
    if (!adminKey.value) return
    try {
      await apiClient.adminUpdateMenuItem(adminKey.value, id, item)
      await loadMenu()
    } catch {
      error.value = 'Failed to update item'
    }
  }

  async function deleteItem(id: string) {
    if (!adminKey.value) return
    try {
      await apiClient.adminDeleteMenuItem(adminKey.value, id)
      await loadMenu()
    } catch {
      error.value = 'Failed to delete item'
    }
  }

  function logout() {
    isAuthenticated.value = false
    adminKey.value = ''
    menuItems.value = []
    sessionStorage.removeItem('admin_key')
  }

  // Restore session
  const storedKey = sessionStorage.getItem('admin_key')
  if (storedKey) {
    adminKey.value = storedKey
    isAuthenticated.value = true
  }

  return {
    isAuthenticated, adminKey, menuItems, isLoading, error,
    login, loadMenu, createItem, updateItem, deleteItem, logout,
  }
})