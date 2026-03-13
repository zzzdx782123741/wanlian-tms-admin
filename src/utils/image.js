/**
 * 图片 URL 处理工具。
 *
 * 兼容三种场景：
 * 1. OSS / CDN 返回的完整公网 URL
 * 2. 旧数据中的相对路径，如 /uploads/xxx.jpg
 * 3. 开发环境历史遗留的 http://localhost:3000/uploads/xxx.jpg
 */

const LOCAL_BACKEND_URL_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1):3000(?=\/)/i

function toDevUploadProxyUrl(pathname) {
  const cleanPath = pathname.replace(/^\/+/, '').replace(/^uploads\/+/, '')
  return `/api/uploads/${cleanPath}`
}

function normalizeDevImageUrl(url) {
  if (!url) return ''

  if (LOCAL_BACKEND_URL_RE.test(url)) {
    try {
      const parsed = new URL(url)
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${toDevUploadProxyUrl(parsed.pathname)}${parsed.search}${parsed.hash}`
      }
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
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
