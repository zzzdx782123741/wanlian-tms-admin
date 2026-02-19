// 订单中心API
import request from '@/utils/request'

/**
 * 获取订单中心列表
 */
export function getOrderCenter(params) {
  return request({
    url: '/order-center',
    method: 'get',
    params
  })
}

/**
 * 导出订单中心Excel
 */
export function exportOrderCenter(params, config = {}) {
  return request({
    url: '/order-center',
    method: 'get',
    params: {
      ...params,
      exportExcel: 'true'
    },
    ...config
  })
}

/**
 * 获取车辆订单记录
 */
export function getVehicleOrders(vehicleId, params) {
  return request({
    url: `/order-center/vehicle/${vehicleId}`,
    method: 'get',
    params
  })
}
