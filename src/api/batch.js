import request from '@/utils/request'

/**
 * 下载 Excel 模板
 * @param {string} type - 模板类型: vehicles | drivers | products
 */
export function downloadTemplate(type) {
  return request({
    url: `/batch/template/${type}`,
    method: 'get',
    responseType: 'blob'
  })
}

/**
 * 批量导入车辆
 * @param {FormData} data - 包含 file 字段的 FormData
 */
export function batchImportVehicles(data) {
  return request({
    url: '/batch/vehicles',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 批量导入司机
 * @param {FormData} data - 包含 file 字段的 FormData
 */
export function batchImportDrivers(data) {
  return request({
    url: '/batch/drivers',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 批量导入商品
 * @param {FormData} data - 包含 file 字段的 FormData
 */
export function batchImportProducts(data) {
  return request({
    url: '/batch/products',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 批量导入技师
 * @param {FormData} data - 包含 file 字段的 FormData
 */
export function batchImportTechnicians(data) {
  return request({
    url: '/batch/technicians',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 批量导入门店套餐
 * @param {FormData} data - 包含 file 字段的 FormData
 */
export function batchImportStorePackages(data) {
  return request({
    url: '/batch/store-packages',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
