const FIELD_LABEL_MAP = {
  plateNumber: '车牌号',
  vehicleType: '车辆类型',
  vin: 'VIN码',
  engineNumber: '发动机号',
  engineBrand: '发动机品牌',
  engineModel: '发动机型号',
  brand: '品牌',
  model: '车型',
  driveType: '驱动形式',
  year: '年份',
  currentDriverId: '司机',
  fleetId: '车队',
  storeId: '门店',
  orderId: '订单',
  openid: '微信OpenID',
  phone: '手机号'
}

const EXACT_MESSAGE_MAP = {
  'Not Found': '请求的资源不存在',
  'Store not found': '门店不存在',
  'Invalid order amount': '订单金额无效',
  'Order not found': '订单不存在',
  'Order is not completed': '订单尚未完成，暂不能结算',
  'Network Error': '网络异常，请检查网络连接后重试'
}

function getFieldLabel(path) {
  return FIELD_LABEL_MAP[path] || path
}

function splitValidationMessage(detail) {
  return detail
    .split(/,\s+/)
    .map(item => item.replace(/^[^:]+:\s*/, '').trim())
    .filter(Boolean)
}

export function localizeErrorMessage(rawMessage, fallbackMessage = '操作失败') {
  const message = String(rawMessage || '').trim().replace(/^Error:\s*/, '')

  if (!message) {
    return fallbackMessage
  }

  if (EXACT_MESSAGE_MAP[message]) {
    return EXACT_MESSAGE_MAP[message]
  }

  if (/[\u4e00-\u9fa5]/.test(message)) {
    return message
  }

  if (/^Request failed with status code 404$/i.test(message)) {
    return '请求的资源不存在'
  }

  if (/^Request failed with status code 401$/i.test(message)) {
    return '登录已过期，请重新登录'
  }

  if (/^Request failed with status code 403$/i.test(message)) {
    return '您暂无权限执行此操作'
  }

  if (/^Request failed with status code 5\d{2}$/i.test(message)) {
    return fallbackMessage
  }

  if (/^timeout of \d+ms exceeded$/i.test(message)) {
    return '请求超时，请稍后重试'
  }

  const validationMatch = message.match(/^[^:]+ validation failed:\s*(.+)$/i)
  if (validationMatch) {
    return splitValidationMessage(validationMatch[1])
      .map(item => localizeErrorMessage(item, fallbackMessage))
      .join('；')
  }

  const enumMatch = message.match(/^`(.*)` is not a valid enum value for path `([^`]+)`\.$/)
  if (enumMatch) {
    const [, value, path] = enumMatch
    const displayValue = value === '' ? '空值' : value
    return `${getFieldLabel(path)}填写不正确，当前值“${displayValue}”不在可选范围内`
  }

  const requiredMatch = message.match(/^Path `([^`]+)` is required\.$/)
  if (requiredMatch) {
    return `${getFieldLabel(requiredMatch[1])}不能为空`
  }

  const castMatch = message.match(/^Cast to .+ failed for value ["`](.*)["`] .+ path ["`]([^"`]+)["`]/i)
  if (castMatch) {
    return `${getFieldLabel(castMatch[2])}格式不正确`
  }

  const duplicateMatch = message.match(/duplicate key error[\s\S]*dup key:\s*\{\s*([^:]+):\s*"?([^"}]*)"?\s*\}/i)
  if (duplicateMatch) {
    const [, fieldName, fieldValue] = duplicateMatch
    return `${getFieldLabel(fieldName.trim())}“${fieldValue}”已存在`
  }

  return message
}
