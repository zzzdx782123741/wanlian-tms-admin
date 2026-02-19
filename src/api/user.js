import request from '@/utils/request'

/**
 * 获取用户列表
 */
export function getUsers(params) {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

/**
 * 获取用户详情
 */
export function getUserDetail(id) {
  return request({
    url: `/users/${id}`,
    method: 'get'
  })
}

/**
 * 更新用户状态
 */
export function updateUserStatus(id, data) {
  return request({
    url: `/users/${id}/status`,
    method: 'put',
    data
  })
}

/**
 * 获取用户统计
 */
export function getUserStats() {
  return request({
    url: '/users/stats/summary',
    method: 'get'
  })
}
