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
    method: 'post',
    data
  })
}

/**
 * 车队拒绝订单
 */
export function fleetRejectOrder(id, data) {
  return request({
    url: `/orders/${id}/fleet-reject`,
    method: 'post',
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

/**
 * 导出订单列表
 * @param {Object} params - 查询参数 { status, keyword, all }
 */
export function exportOrders(params) {
  return request({
    url: '/orders/export',
    method: 'get',
    params,
    responseType: 'blob',
    timeout: 60000
  })
}
