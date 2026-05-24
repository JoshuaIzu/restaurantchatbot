import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import Admin from '@/pages/Admin.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/admin', component: Admin },
  ],
})

export default router