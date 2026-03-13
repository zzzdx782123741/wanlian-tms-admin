import request from '@/utils/request'

/**
 * 门店端 - 查询账户余额
 */
export function getStoreAccountBalance() {
  return request({
    url: '/withdrawal/account/balance',
    method: 'get'
  })
}

/**
 * 门店端 - 申请提现
 */
export function createWithdrawal(data) {
  return request({
    url: '/withdrawal/apply',
    method: 'post',
    data
  })
}

export function cancelWithdrawal(id, data) {
  return request({
    url: `/withdrawal/${id}/cancel`,
    method: 'post',
    data
  })
}

/**
 * 获取提现记录列表
 */
export function getWithdrawalList(params) {
  return request({
    url: '/withdrawal/records',
    method: 'get',
    params
  })
}

/**
 * 获取提现详情
 */
export function getWithdrawalDetail(id) {
  return request({
    url: `/withdrawal/${id}`,
    method: 'get'
  })
}

/**
 * 平台端 - 生成结算单
 */
export function generateSettlement(data) {
  return request({
    url: '/withdrawal/generate-settlement',
    method: 'post',
    data
  })
}

/**
 * 平台端 - 获取待打款列表
 */
export function getPendingWithdrawals(params) {
  return request({
    url: '/withdrawal/pending',
    method: 'get',
    params
  })
}

/**
 * 平台端 - 确认打款
 */
export function confirmWithdrawal(id, data) {
  return request({
    url: `/withdrawal/${id}/confirm`,
    method: 'post',
    data
  })
}
