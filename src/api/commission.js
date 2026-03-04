import request from '@/utils/request'

/**
 * 获取佣金配置列表
 */
export function getCommissionConfigs(params) {
  return request({
    url: '/commission-config',
    method: 'get',
    params
  })
}

/**
 * 获取配置统计
 */
export function getCommissionConfigStats() {
  return request({
    url: '/commission-config/statistics',
    method: 'get'
  })
}

/**
 * 获取配置详情
 */
export function getCommissionConfigDetail(id) {
  return request({
    url: `/commission-config/${id}`,
    method: 'get'
  })
}

/**
 * 创建佣金配置
 */
export function createCommissionConfig(data) {
  return request({
    url: '/commission-config',
    method: 'post',
    data
  })
}

/**
 * 更新佣金配置
 */
export function updateCommissionConfig(id, data) {
  return request({
    url: `/commission-config/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除佣金配置
 */
export function deleteCommissionConfig(id) {
  return request({
    url: `/commission-config/${id}`,
    method: 'delete'
  })
}

/**
 * 切换配置启用状态
 */
export function toggleCommissionConfig(id) {
  return request({
    url: `/commission-config/${id}/toggle`,
    method: 'patch'
  })
}
