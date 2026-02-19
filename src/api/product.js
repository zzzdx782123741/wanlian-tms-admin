// 商品管理API
import request from '@/utils/request'

/**
 * 获取商品列表
 */
export function getProducts(params) {
  return request({
    url: '/products',
    method: 'get',
    params
  })
}

/**
 * 搜索商品
 */
export function searchProducts(params) {
  return request({
    url: '/products/search',
    method: 'get',
    params
  })
}

/**
 * 获取商品详情
 */
export function getProduct(id) {
  return request({
    url: `/products/${id}`,
    method: 'get'
  })
}

/**
 * 创建商品
 */
export function createProduct(data) {
  return request({
    url: '/products',
    method: 'post',
    data
  })
}

/**
 * 更新商品
 */
export function updateProduct(id, data) {
  return request({
    url: `/products/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除商品
 */
export function deleteProduct(id) {
  return request({
    url: `/products/${id}`,
    method: 'delete'
  })
}

/**
 * 审核商品（平台运营）
 */
export function auditProduct(id, data) {
  return request({
    url: `/products/${id}/audit`,
    method: 'put',
    data
  })
}

/**
 * 上架/下架商品
 */
export function toggleProductStatus(id, data) {
  return request({
    url: `/products/${id}/status`,
    method: 'put',
    data
  })
}
