import axios from 'axios'
import { ElMessage } from 'element-plus'
import { localizeErrorMessage } from './errorMessage'

const service = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 检查业务逻辑是否成功
    if (res.success === false) {
      res.message = localizeErrorMessage(res.message, '请求失败')
      const errorMsg = res.message || '请求失败'
      console.error('业务错误:', errorMsg, res)
      ElMessage.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }

    return res
  },
  error => {
    console.error('响应错误:', error)
    console.error('错误配置:', error.config)
    console.error('错误响应:', error.response)

    const status = error.response?.status
    const requestUrl = error.config?.url || ''
    const isAuthLoginRequest = [
      '/auth/test-login',
      '/auth/web-login',
      '/auth/login'
    ].some(path => requestUrl.includes(path))

    // 从响应中提取错误消息
    let errorMessage = '网络错误'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    errorMessage = localizeErrorMessage(errorMessage, '网络错误')
    error.message = errorMessage
    if (error.response?.data) {
      error.response.data.message = errorMessage
    }

    if (status === 401 && !isAuthLoginRequest) {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('role')
      window.location.href = '/login'
    } else {
      ElMessage.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

export default service
