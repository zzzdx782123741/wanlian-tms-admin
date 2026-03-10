import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/auth/web-login',
    method: 'post',
    data
  })
}

export function testLogin(data) {
  return request({
    url: '/auth/test-login',
    method: 'post',
    data
  })
}

export function logout() {
  return Promise.resolve({ success: true })
}

export function getUserInfo() {
  return request({
    url: '/user/me',
    method: 'get'
  })
}
