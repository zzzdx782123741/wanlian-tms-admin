import request from '@/utils/request'

/**
 * 获取平台收款账户列表
 */
export function getPlatformBankAccounts() {
  return request({
    url: '/platform/bank-accounts',
    method: 'get'
  })
}

/**
 * 创建平台收款账户
 */
export function createPlatformBankAccount(data) {
  return request({
    url: '/platform/bank-accounts',
    method: 'post',
    data
  })
}

/**
 * 更新平台收款账户
 */
export function updatePlatformBankAccount(id, data) {
  return request({
    url: `/platform/bank-accounts/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除平台收款账户
 */
export function deletePlatformBankAccount(id) {
  return request({
    url: `/platform/bank-accounts/${id}`,
    method: 'delete'
  })
}
