/**
 * 图片 URL 处理工具。
 *
 * 兼容三种场景：
 * 1. OSS / CDN 返回的完整公网 URL
 * 2. 旧数据中的相对路径，例如 /uploads/xxx.jpg
 * 3. 开发环境历史遗留的后端绝对地址，例如 http://localhost:3000/uploads/xxx.jpg
 */

const DEV_API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || 'http'
const DEV_API_HOST = import.meta.env.VITE_API_HOST || 'localhost'
const DEV_API_PORT = import.meta.env.VITE_API_PORT || '3000'
const DEV_API_PROXY_TARGET = import.meta.env.VITE_API_PROXY_TARGET ||
  `${DEV_API_PROTOCOL}://${DEV_API_HOST}:${DEV_API_PORT}`

function buildDevApiOrigins() {
  const origins = new Set()

  try {
    origins.add(new URL(DEV_API_PROXY_TARGET).origin.toLowerCase())
  } catch {
    // Ignore invalid values and keep relative-path fallback working.
  }

  if (DEV_API_HOST === 'localhost') {
    origins.add(`${DEV_API_PROTOCOL}://127.0.0.1:${DEV_API_PORT}`.toLowerCase())
  } else if (DEV_API_HOST === '127.0.0.1') {
    origins.add(`${DEV_API_PROTOCOL}://localhost:${DEV_API_PORT}`.toLowerCase())
  }

  return origins
}

const DEV_API_ORIGINS = buildDevApiOrigins()

function toDevUploadProxyUrl(pathname) {
  const cleanPath = pathname.replace(/^\/+/, '').replace(/^uploads\/+/, '')
  return `/api/uploads/${cleanPath}`
}

function normalizeDevImageUrl(url) {
  if (!url) return ''

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url)
      if (DEV_API_ORIGINS.has(parsed.origin.toLowerCase())) {
        if (parsed.pathname.startsWith('/uploads/')) {
          return `${toDevUploadProxyUrl(parsed.pathname)}${parsed.search}${parsed.hash}`
        }

        return `${parsed.pathname}${parsed.search}${parsed.hash}`
      }
    } catch {
      return url
    }
  }

  if (url.startsWith('/uploads/')) {
    return toDevUploadProxyUrl(url)
  }

  return url
}

/**
 * 获取完整的图片 URL。
 * @param {string} url 图片地址
 * @returns {string}
 */
export function getImageUrl(url) {
  if (!url) return ''

  if (import.meta.env.DEV) {
    const devUrl = normalizeDevImageUrl(url)
    if (devUrl !== url) {
      return devUrl
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  if (url.startsWith('/uploads/') || url.startsWith('/static/')) {
    return url
  }

  if (import.meta.env.DEV) {
    const baseURL = import.meta.env.VITE_API_URL || '/api'
    return `${baseURL}${url.startsWith('/') ? '' : '/'}${url}`
  }

  return url
}

/**
 * 获取多个图片的完整 URL 数组。
 * @param {string[]} urls 图片地址数组
 * @returns {string[]}
 */
export function getImageUrls(urls) {
  if (!Array.isArray(urls)) return []
  return urls.map(url => getImageUrl(url))
}
