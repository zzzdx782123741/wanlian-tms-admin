import request from '@/utils/request'

/**
 * 获取门店账户信息
 */
export function getStoreAccount() {
  return request({
    url: '/store/account',
    method: 'get'
  })
}

/**
 * 获取门店收入明细
 */
export function getStoreIncome(params) {
  return request({
    url: '/store/income',
    method: 'get',
    params
  })
}

/**
 * 导出服务收入明细
 */
export function exportStoreIncome(params) {
  return request({
    url: '/store/income/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 获取门店结算记录
 */
export function getStoreSettlements(params) {
  return request({
    url: '/store/settlements',
    method: 'get',
    params
  })
}

/**
 * 导出结算记录
 */
export function exportStoreSettlements(params) {
  return request({
    url: '/store/settlements/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 申请提现
 */
export function requestWithdrawal(data) {
  return request({
    url: '/store/withdraw',
    method: 'post',
    data
  })
}

/**
 * 获取打款记录
 */
export function getWithdrawals(params) {
  return request({
    url: '/store/withdrawals',
    method: 'get',
    params
  })
}
