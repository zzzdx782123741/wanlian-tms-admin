import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

function resolveApiProxyTarget(env) {
  if (env.VITE_API_PROXY_TARGET) {
    return env.VITE_API_PROXY_TARGET
  }

  const protocol = env.VITE_API_PROTOCOL || 'http'
  const host = env.VITE_API_HOST || 'localhost'
  const port = env.VITE_API_PORT || '3000'

  return `${protocol}://${host}:${port}`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = resolveApiProxyTarget(env)

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true
        },
        '/api/uploads': {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api\/uploads/, '/uploads')
        }
      }
    }
  }
})
