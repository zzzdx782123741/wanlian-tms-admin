import request from '@/utils/request'

/**
 * 获取车队车辆列表
 */
export function getFleetVehicles(params) {
  return request({
    url: '/fleet/vehicles',
    method: 'get',
    params
  })
}

/**
 * 添加车辆
 */
export function addVehicle(data) {
  return request({
    url: '/fleet/vehicles',
    method: 'post',
    data
  })
}

/**
 * 更新车辆
 */
export function updateVehicle(id, data) {
  return request({
    url: `/fleet/vehicles/${id}`,
    method: 'put',
    data
  })
}

/**
 * 更新车辆状态
 */
export function updateVehicleStatus(id, data) {
  return request({
    url: `/fleet/vehicles/${id}/status`,
    method: 'put',
    data
  })
}

/**
 * 删除车辆
 */
export function deleteVehicle(id) {
  return request({
    url: `/fleet/vehicles/${id}`,
    method: 'delete'
  })
}

/**
 * 获取车队司机列表
 */
export function getFleetDrivers() {
  return request({
    url: '/fleet/vehicles/drivers',
    method: 'get'
  })
}

/**
 * 获取车辆统计
 */
export function getVehicleStats() {
  return request({
    url: '/fleet/vehicles/stats',
    method: 'get'
  })
}

/**
 * 导出车辆列表
 * @param {Object} params - 查询参数 { status, keyword, all }
 */
export function exportVehicles(params) {
  return request({
    url: '/fleet/vehicles/export',
    method: 'get',
    params,
    responseType: 'blob',
    timeout: 60000
  })
}
