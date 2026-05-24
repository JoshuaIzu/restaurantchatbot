<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin.store'
import type { MenuItem } from '@/types'

const adminStore = useAdminStore()
const editingItem = ref<MenuItem | null>(null)
const newItem = ref({ name: '', price: 0, category: '' })
const showAddForm = ref(false)

onMounted(() => { adminStore.loadMenu() })

function startEdit(item: MenuItem) {
  editingItem.value = { ...item }
}

async function saveEdit() {
  if (!editingItem.value) return
  await adminStore.updateItem(editingItem.value.id, {
    name: editingItem.value.name,
    price: editingItem.value.price,
    category: editingItem.value.category,
    available: editingItem.value.available,
  })
  editingItem.value = null
}

async function handleAdd() {
  await adminStore.createItem(newItem.value)
  newItem.value = { name: '', price: 0, category: '' }
  showAddForm.value = false
}

async function handleDelete(id: string) {
  if (confirm('Delete this item?')) {
    await adminStore.deleteItem(id)
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Menu Management</h1>
      <div class="flex gap-2">
        <button @click="showAddForm = !showAddForm" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Item
        </button>
        <button @click="adminStore.logout()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
          Logout
        </button>
      </div>
    </div>

    <div v-if="showAddForm" class="bg-white border rounded-lg p-4 mb-6">
      <h3 class="font-medium mb-4">Add New Item</h3>
      <div class="grid grid-cols-3 gap-4">
        <input v-model="newItem.name" placeholder="Name" class="px-3 py-2 border rounded" />
        <input v-model.number="newItem.price" type="number" placeholder="Price" class="px-3 py-2 border rounded" />
        <input v-model="newItem.category" placeholder="Category" class="px-3 py-2 border rounded" />
      </div>
      <button @click="handleAdd" class="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        Save
      </button>
    </div>

    <div v-if="adminStore.isLoading" class="text-center py-8">Loading...</div>
    <div v-if="adminStore.error" class="bg-red-50 text-red-600 p-4 rounded mb-4">{{ adminStore.error }}</div>

    <table class="w-full bg-white border rounded-lg">
      <thead>
        <tr class="bg-gray-50 border-b">
          <th class="text-left p-3">Name</th>
          <th class="text-left p-3">Price</th>
          <th class="text-left p-3">Category</th>
          <th class="text-left p-3">Available</th>
          <th class="text-left p-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in adminStore.menuItems" :key="item.id" class="border-b">
          <td class="p-3">{{ item.name }}</td>
          <td class="p-3">₦{{ item.price.toLocaleString() }}</td>
          <td class="p-3">{{ item.category }}</td>
          <td class="p-3">
            <span :class="item.available ? 'text-green-600' : 'text-red-600'">
              {{ item.available ? 'Yes' : 'No' }}
            </span>
          </td>
          <td class="p-3">
            <button @click="startEdit(item)" class="text-blue-600 hover:underline mr-2">Edit</button>
            <button @click="handleDelete(item.id)" class="text-red-600 hover:underline">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="editingItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div class="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">Edit Item</h3>
        <div class="space-y-4">
          <input v-model="editingItem.name" class="w-full px-3 py-2 border rounded" />
          <input v-model.number="editingItem.price" type="number" class="w-full px-3 py-2 border rounded" />
          <input v-model="editingItem.category" class="w-full px-3 py-2 border rounded" />
          <label class="flex items-center gap-2">
            <input v-model="editingItem.available" type="checkbox" />
            Available
          </label>
        </div>
        <div class="flex gap-2 mt-4">
          <button @click="saveEdit" class="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          <button @click="editingItem = null" class="px-4 py-2 border rounded">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>