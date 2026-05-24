import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://restaurantchatbot-f116c9f47ce0.herokuapp.com',
        changeOrigin: true,
         cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/',
        selfHandleResponse: false,  // Don't intercept response
      },
      '/socket.io': {
        target: 'https://restaurantchatbot-f116c9f47ce0.herokuapp.com',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
