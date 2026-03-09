/**
 * 图片URL处理工具
 *
 * 说明：
 * - 后端上传接口现在返回完整的URL（如 http://localhost:3000/uploads/xxx.jpg）
 * - 但数据库中可能存在旧数据，仍然是相对路径（如 /uploads/xxx.jpg）
 * - 此工具函数兼容处理新旧两种格式，确保图片能正确显示
 */

/**
 * 获取完整的图片URL
 * @param {string} url - 相对或绝对路径的图片URL
 * @returns {string} 完整的图片URL
 */
export function getImageUrl(url) {
  if (!url) return ''

  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 处理相对路径（兼容旧数据）
  if (url.startsWith('/uploads/') || url.startsWith('/static/')) {
    // 开发环境：使用后端服务器地址
    if (import.meta.env.DEV) {
      return `http://localhost:3000${url}`
    }
    // 生产环境：使用相对路径（通过nginx代理）
    return url
  }

  // 其他情况：如果是相对路径，拼接服务器地址
  if (import.meta.env.DEV) {
    return `http://localhost:3000${url.startsWith('/') ? url : '/' + url}`
  }

  return url
}

/**
 * 获取多个图片的完整URL数组
 * @param {string[]} urls - 图片URL数组
 * @returns {string[]} 完整的图片URL数组
 */
export function getImageUrls(urls) {
  if (!Array.isArray(urls)) return []
  return urls.map(url => getImageUrl(url))
}

