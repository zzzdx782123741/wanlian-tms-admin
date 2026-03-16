export const VEHICLE_TYPE_OPTIONS = [
  '牵引车',
  '挂车',
  '载货车',
  '轻卡',
  '自卸车',
  '平板车',
  '冷藏车',
  '罐车',
  '其他'
]

export const UNIVERSAL_VEHICLE_GROUP_VALUE = 'ALL'
export const UNIVERSAL_VEHICLE_GROUP_LABEL = '全车型通用'

const VEHICLE_GROUP_ALIAS_MAP = {
  自卸: '自卸车',
  全部: UNIVERSAL_VEHICLE_GROUP_VALUE,
  全车型: UNIVERSAL_VEHICLE_GROUP_VALUE,
  通用: UNIVERSAL_VEHICLE_GROUP_VALUE,
  通用车型: UNIVERSAL_VEHICLE_GROUP_VALUE,
  全车型通用: UNIVERSAL_VEHICLE_GROUP_VALUE
}

export const PACKAGE_VEHICLE_GROUP_OPTIONS = [
  ...VEHICLE_TYPE_OPTIONS.map((item) => ({
    label: item,
    value: item
  })),
  {
    label: UNIVERSAL_VEHICLE_GROUP_LABEL,
    value: UNIVERSAL_VEHICLE_GROUP_VALUE
  }
]

const VEHICLE_GROUP_TAG_TYPE_MAP = {
  牵引车: 'primary',
  挂车: 'warning',
  载货车: 'success',
  轻卡: 'success',
  自卸车: 'info',
  平板车: 'info',
  冷藏车: 'danger',
  罐车: 'warning',
  其他: 'info',
  ALL: ''
}

export function normalizeVehicleGroup(value, { allowAll = true } = {}) {
  const text = String(value || '').trim()
  if (!text) {
    return ''
  }

  const normalized = VEHICLE_GROUP_ALIAS_MAP[text] || text
  if (allowAll && normalized === UNIVERSAL_VEHICLE_GROUP_VALUE) {
    return UNIVERSAL_VEHICLE_GROUP_VALUE
  }

  return VEHICLE_TYPE_OPTIONS.includes(normalized) ? normalized : ''
}

export function getVehicleGroupLabel(value) {
  const normalized = normalizeVehicleGroup(value)
  if (!normalized) {
    return String(value || '').trim()
  }

  return normalized === UNIVERSAL_VEHICLE_GROUP_VALUE
    ? UNIVERSAL_VEHICLE_GROUP_LABEL
    : normalized
}

export function getVehicleGroupTagType(value) {
  const normalized = normalizeVehicleGroup(value)
  return VEHICLE_GROUP_TAG_TYPE_MAP[normalized] || 'info'
}
