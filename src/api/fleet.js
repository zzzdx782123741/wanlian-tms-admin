import request from '@/utils/request'

/**
 * 获取车队列表
 */
export function getFleets(params) {
  return request({
    url: '/fleets',
    method: 'get',
    params
  })
}

/**
 * 获取车队详情
 */
export function getFleetDetail(id) {
  return request({
    url: `/fleets/${id}`,
    method: 'get'
  })
}

/**
 * 审核车队
 */
export function approveFleet(id, data) {
  return request({
    url: `/fleets/${id}/approve`,
    method: 'post',
    data
  })
}

/**
 * 更新车队状态
 */
export function updateFleetStatus(id, data) {
  return request({
    url: `/fleets/${id}/status`,
    method: 'put',
    data
  })
}

/**
 * 删除车队
 */
export function deleteFleet(id) {
  return request({
    url: `/fleets/${id}`,
    method: 'delete'
  })
}

/**
 * 获取车队统计
 */
export function getFleetStats() {
  return request({
    url: '/fleets/stats/summary',
    method: 'get'
  })
}

/**
 * 更新车队门店选择配置
 */
export function updateFleetStoreConfig(id, data) {
  return request({
    url: `/fleets/${id}/store-config`,
    method: 'put',
    data
  })
}

/**
 * 获取车队配置信息
 */
export function getFleetConfig(id) {
  return request({
    url: `/fleets/${id}`,
    method: 'get'
  })
}
