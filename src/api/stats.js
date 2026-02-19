import request from '@/utils/request'

/**
 * 获取概览统计
 */
export function getOverview() {
  return request({
    url: '/stats/overview',
    method: 'get'
  })
}

/**
 * 获取订单趋势
 */
export function getOrderTrend(params) {
  return request({
    url: '/stats/order-trend',
    method: 'get',
    params
  })
}

/**
 * 获取车队排名
 */
export function getFleetRanking(params) {
  return request({
    url: '/stats/fleet-ranking',
    method: 'get',
    params
  })
}

/**
 * 获取门店排名
 */
export function getStoreRanking(params) {
  return request({
    url: '/stats/store-ranking',
    method: 'get',
    params
  })
}

/**
 * 获取故障类型分布
 */
export function getFaultDistribution() {
  return request({
    url: '/stats/fault-distribution',
    method: 'get'
  })
}
