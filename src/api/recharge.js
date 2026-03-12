import request from '@/utils/request'

/**
 * 车队端 - 提交充值申请
 */
export function createRecharge(data) {
  return request({
    url: '/recharge/apply',
    method: 'post',
    data
  })
}

/**
 * 车队端 - 获取我的充值记录
 */
export function getMyRechargeRecords(params) {
  return request({
    url: '/recharge/my-records',
    method: 'get',
    params
  })
}

/**
 * 车队端 - 获取充值统计
 */
export function getRechargeStats(params) {
  return request({
    url: '/recharge/stats',
    method: 'get',
    params
  })
}

/**
 * 车队端 - 获取活跃的平台收款账户
 */
export function getActivePlatformAccounts() {
  return request({
    url: '/recharge/active-platform-accounts',
    method: 'get'
  })
}

/**
 * 平台运营 - 代客充值申请
 */
export function createAgentRecharge(data) {
  return request({
    url: '/recharge/agent-apply',
    method: 'post',
    data
  })
}

/**
 * 平台运营 - 获取充值记录列表
 */
export function getRechargeList(params) {
  return request({
    url: '/recharge/list',
    method: 'get',
    params
  })
}

/**
 * 财务审核 - 获取待审核充值列表
 */
export function getPendingRecharges(params) {
  return request({
    url: '/recharge/pending',
    method: 'get',
    params
  })
}

/**
 * 财务审核 - 审核通过
 */
export function approveRecharge(id, data) {
  return request({
    url: `/recharge/${id}/approve`,
    method: 'post',
    data
  })
}

/**
 * 财务审核 - 审核驳回
 */
export function rejectRecharge(id, data) {
  return request({
    url: `/recharge/${id}/reject`,
    method: 'post',
    data
  })
}

/**
 * 财务审核 - 获取历史审核记录
 */
export function getReviewedRecharges(params) {
  return request({
    url: '/recharge/reviewed',
    method: 'get',
    params
  })
}

/**
 * 获取充值详情
 */
export function getRechargeDetail(id) {
  return request({
    url: `/recharge/${id}`,
    method: 'get'
  })
}
