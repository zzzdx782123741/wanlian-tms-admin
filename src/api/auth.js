import request from '@/utils/request'

/**
 * 正式登录（使用用户名密码）
 */
export function login(data) {
  return request({
    url: '/auth/web-login',
    method: 'post',
    data
  })
}

/**
 * 测试登录（开发环境使用）
 */
export function testLogin(data) {
  return request({
    url: '/auth/test-login',
    method: 'post',
    data
  })
}

/**
 * 退出登录
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return request({
    url: '/auth/user-info',
    method: 'get'
  })
}
