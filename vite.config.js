import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ command }) => {
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host: '0.0.0.0', // 监听所有网络接口，允许局域网访问
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        // 代理上传的静态文件（通过 /api/uploads 访问，避免跨域问题）
        '/api/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          // 重写路径：/api/uploads/xxx -> /uploads/xxx
          rewrite: (path) => path.replace(/^\/api\/uploads/, '/uploads')
        }
      }
    }
  }
})
