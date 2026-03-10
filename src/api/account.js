import request from '@/utils/request'

export function getBalance() {
  return request({
    url: '/account/balance',
    method: 'get'
  })
}

export function recharge(data) {
  return request({
    url: '/account/recharge/create',
    method: 'post',
    data
  })
}

export function getTransactions(params) {
  return request({
    url: '/account/transactions',
    method: 'get',
    params
  })
}

export function getStatistics() {
  return request({
    url: '/account/statistics',
    method: 'get'
  })
}
