/**
 * 套餐规范和门店套餐管理API
 */
import request from '@/utils/request'

// ==================== 套餐规范（平台运营） ====================

/**
 * 获取套餐规范列表
 */
export function getPackageStandards(params) {
  return request({
    url: '/maintenance/platform/standards',
    method: 'get',
    params
  })
}

/**
 * 获取套餐规范详情
 */
export function getPackageStandardDetail(id) {
  return request({
    url: `/maintenance/platform/standards/${id}`,
    method: 'get'
  })
}

/**
 * 创建套餐规范
 */
export function createPackageStandard(data) {
  return request({
    url: '/maintenance/platform/standards',
    method: 'post',
    data
  })
}

/**
 * 更新套餐规范
 */
export function updatePackageStandard(id, data) {
  return request({
    url: `/maintenance/platform/standards/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除套餐规范
 */
export function deletePackageStandard(id) {
  return request({
    url: `/maintenance/platform/standards/${id}`,
    method: 'delete'
  })
}

// ==================== 门店套餐审核（平台运营） ====================

/**
 * 获取待审核门店套餐列表
 */
export function getPendingStorePackages(params) {
  return request({
    url: '/maintenance/platform/store-packages/pending',
    method: 'get',
    params
  })
}

/**
 * 获取所有门店套餐列表
 */
export function getStorePackages(params) {
  return request({
    url: '/maintenance/platform/store-packages',
    method: 'get',
    params
  })
}

/**
 * 审核门店套餐
 */
export function auditStorePackage(id, data) {
  return request({
    url: `/maintenance/platform/store-packages/${id}/audit`,
    method: 'put',
    data
  })
}

/**
 * 批量审核门店套餐
 */
export function batchAuditPackages(data) {
  return request({
    url: '/maintenance/platform/store-packages/batch-audit',
    method: 'post',
    data
  })
}

// ==================== 门店套餐管理（门店管理员） ====================

/**
 * 获取可用的套餐类型列表（供选择）
 */
export function getAvailablePackageTypes(params) {
  return request({
    url: '/maintenance/store/package-types',
    method: 'get',
    params
  })
}

/**
 * 获取门店商品列表（用于套餐商品选择）
 */
export function getStoreProducts(params) {
  return request({
    url: '/maintenance/store/products',
    method: 'get',
    params
  })
}

/**
 * 获取套餐规范列表（门店端参考用）
 */
export function getStandardsForStore(params) {
  return request({
    url: '/maintenance/store/packages/standards',
    method: 'get',
    params
  })
}

/**
 * 获取价格区间参考
 */
export function getPriceRange(params) {
  return request({
    url: '/maintenance/store/packages/price-range',
    method: 'get',
    params
  })
}

/**
 * 获取本门店套餐列表
 */
export function getMyStorePackages(params) {
  return request({
    url: '/maintenance/store/packages',
    method: 'get',
    params
  })
}

/**
 * 创建门店套餐
 */
export function createStorePackage(data) {
  return request({
    url: '/maintenance/store/packages',
    method: 'post',
    data
  })
}

/**
 * 更新门店套餐
 */
export function updateStorePackage(id, data) {
  return request({
    url: `/maintenance/store/packages/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除门店套餐
 */
export function deleteStorePackage(id) {
  return request({
    url: `/maintenance/store/packages/${id}`,
    method: 'delete'
  })
}

/**
 * 提交套餐审核
 */
export function submitPackageForAudit(id) {
  return request({
    url: `/maintenance/store/packages/${id}/submit`,
    method: 'post'
  })
}
