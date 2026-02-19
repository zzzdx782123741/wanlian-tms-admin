import request from '@/utils/request'

/**
 * 获取推荐套餐
 */
export function getRecommendedPackages(params) {
  return request({
    url: '/maintenance/recommendations',
    method: 'get',
    params
  })
}

/**
 * 提交保养申请
 */
export function submitMaintenanceApplication(data) {
  return request({
    url: '/maintenance/driver/apply',
    method: 'post',
    data
  })
}

/**
 * 获取保养申请列表
 */
export function getMaintenanceApplications(params) {
  return request({
    url: '/maintenance/fleet/applications',
    method: 'get',
    params
  })
}

/**
 * 审批保养申请
 */
export function approveMaintenanceApplication(id, data) {
  return request({
    url: `/maintenance/fleet/applications/${id}/approve`,
    method: 'put',
    data
  })
}
