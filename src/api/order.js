import request from '@/utils/request'

/**
 * 获取订单列表
 */
export function getOrders(params) {
  return request({
    url: '/orders',
    method: 'get',
    params
  })
}

/**
 * 获取订单详情
 */
export function getOrderDetail(id) {
  return request({
    url: `/orders/${id}`,
    method: 'get'
  })
}

/**
 * 审批报价（平台运营初审）
 */
export function approveQuote(id, data) {
  return request({
    url: `/orders/${id}/approve`,
    method: 'post',
    data
  })
}

/**
 * 确认完工
 */
export function confirmOrder(id) {
  return request({
    url: `/orders/${id}/confirm`,
    method: 'post'
  })
}

/**
 * 车队审批订单
 */
export function fleetApproveOrder(id, data) {
  return request({
    url: `/orders/${id}/fleet-approve`,
    method: 'put',
    data
  })
}

/**
 * 车队拒绝订单
 */
export function fleetRejectOrder(id, data) {
  return request({
    url: `/orders/${id}/fleet-reject`,
    method: 'put',
    data
  })
}

/**
 * 司机重新提交订单
 */
export function resubmitOrder(id) {
  return request({
    url: `/orders/${id}/resubmit`,
    method: 'put'
  })
}
