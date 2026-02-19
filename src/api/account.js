import request from '@/utils/request'

/**
 * 获取账户余额
 */
export function getBalance() {
  return request({
    url: '/account/balance',
    method: 'get'
  })
}

/**
 * 账户充值
 */
export function recharge(data) {
  return request({
    url: '/account/recharge',
    method: 'post',
    data
  })
}

/**
 * 订单支付
 */
export function payOrder(data) {
  return request({
    url: '/account/pay',
    method: 'post',
    data
  })
}

/**
 * 获取交易记录
 */
export function getTransactions(params) {
  return request({
    url: '/account/transactions',
    method: 'get',
    params
  })
}

/**
 * 获取账户统计
 */
export function getStatistics() {
  return request({
    url: '/account/statistics',
    method: 'get'
  })
}
