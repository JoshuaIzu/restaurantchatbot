<script setup lang="ts">
import { useAdminStore } from '@/stores/admin.store'
import AdminLogin from '@/components/admin/AdminLogin.vue'
import AdminMenu from '@/components/admin/AdminMenu.vue'

const adminStore = useAdminStore()
</script>

<template>
  <AdminLogin v-if="!adminStore.isAuthenticated" />
  <AdminMenu v-else />
</template>