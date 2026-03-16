import request from '@/utils/request'

function normalizeBatchImportErrorResponse(error) {
  const payload = error?.response?.data
  if (!payload) {
    return Promise.reject(error)
  }

  const summary = payload.data || payload
  const hasBatchSummary = Array.isArray(summary?.errors) || summary?.total !== undefined || summary?.failed !== undefined || summary?.failedCount !== undefined
  if (!hasBatchSummary) {
    return Promise.reject(error)
  }

  return {
    success: false,
    message: payload.message || summary.message || error.message || '批量导入失败',
    data: {
      total: Number(summary?.total ?? 0),
      success: Number(summary?.success ?? summary?.successCount ?? 0),
      failed: Number(summary?.failed ?? summary?.failedCount ?? 0),
      errors: Array.isArray(summary?.errors) ? summary.errors : []
    }
  }
}

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
export function batchImportVehicles(data, options = {}) {
  return request({
    url: '/batch/vehicles',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...options
  }).catch(normalizeBatchImportErrorResponse)
}

/**
 * 批量导入司机
 * @param {FormData} data - 包含 file 字段的 FormData
 */
export function batchImportDrivers(data, options = {}) {
  return request({
    url: '/batch/drivers',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...options
  }).catch(normalizeBatchImportErrorResponse)
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
