import request from '@/utils/request'

export function getOrders(params) {
  return request({
    url: '/orders',
    method: 'get',
    params
  })
}

export function getOrderDetail(id) {
  return request({
    url: `/orders/${id}`,
    method: 'get'
  })
}

export function approveQuote(id, data) {
  return request({
    url: `/orders/${id}/approve-quote`,
    method: 'post',
    data
  })
}

export function confirmOrder(id) {
  return request({
    url: `/orders/${id}/confirm`,
    method: 'post'
  })
}

export function fleetApproveOrder(id, data) {
  return request({
    url: `/orders/${id}/fleet-approve`,
    method: 'post',
    data
  })
}

export function fleetRejectOrder(id, data) {
  return request({
    url: `/orders/${id}/fleet-reject`,
    method: 'post',
    data
  })
}

export function cancelOrder(id, data) {
  return request({
    url: `/orders/${id}/cancel`,
    method: 'post',
    data
  })
}

export function resubmitOrder(id) {
  return request({
    url: `/orders/${id}/resubmit`,
    method: 'put'
  })
}

export function exportOrders(params) {
  return request({
    url: '/orders/export',
    method: 'get',
    params,
    responseType: 'blob',
    timeout: 60000
  })
}
