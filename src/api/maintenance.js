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
 * 获取套餐列表
 */
export function getPackages(params) {
  return request({
    url: '/maintenance/platform/packages',
    method: 'get',
    params
  })
}

/**
 * 创建套餐
 */
export function createPackage(data) {
  return request({
    url: '/maintenance/platform/packages',
    method: 'post',
    data
  })
}

/**
 * 更新套餐
 */
export function updatePackage(id, data) {
  return request({
    url: `/maintenance/platform/packages/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除套餐
 */
export function deletePackage(id) {
  return request({
    url: `/maintenance/platform/packages/${id}`,
    method: 'delete'
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

/**
 * 获取车队门店套餐列表（用于车队管理员选择门店套餐）
 */
export function getFleetStorePackages(params) {
  return request({
    url: '/maintenance/fleet/store-packages',
    method: 'get',
    params
  })
}
