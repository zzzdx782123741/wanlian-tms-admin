import request from '@/utils/request'

/**
 * 获取门店列表
 */
export function getStores(params) {
  return request({
    url: '/stores',
    method: 'get',
    params
  })
}

/**
 * 获取门店详情
 */
export function getStoreDetail(id) {
  return request({
    url: `/stores/${id}`,
    method: 'get'
  })
}

/**
 * 审核门店
 */
export function approveStore(id, data) {
  return request({
    url: `/stores/${id}/approve`,
    method: 'post',
    data
  })
}

/**
 * 更新门店状态
 */
export function updateStoreStatus(id, data) {
  return request({
    url: `/stores/${id}/status`,
    method: 'put',
    data
  })
}

/**
 * 删除门店
 */
export function deleteStore(id) {
  return request({
    url: `/stores/${id}`,
    method: 'delete'
  })
}

/**
 * 获取门店统计
 */
export function getStoreStats() {
  return request({
    url: '/stores/stats/summary',
    method: 'get'
  })
}

/**
 * 获取附近门店
 */
export function getNearbyStores(params) {
  return request({
    url: '/stores/nearby',
    method: 'get',
    params
  })
}
