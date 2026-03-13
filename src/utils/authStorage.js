function normalizeEntityId(value) {
  if (!value) {
    return ''
  }

  return typeof value === 'object' ? (value._id || value.id || '') : value
}

export function getUserScopeIds(user = {}) {
  return {
    storeId: normalizeEntityId(user?.storeInfo?.storeId),
    fleetId: normalizeEntityId(user?.fleetInfo?.fleetId)
  }
}

export function clearAuthState() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('role')
  localStorage.removeItem('storeId')
  localStorage.removeItem('fleetId')
  localStorage.removeItem('forceChangePassword')
}

export function persistAuthState({ token, user, role }) {
  clearAuthState()

  localStorage.setItem('token', token)
  localStorage.setItem('userInfo', JSON.stringify(user))
  localStorage.setItem('role', role)

  const { storeId, fleetId } = getUserScopeIds(user)

  if (storeId) {
    localStorage.setItem('storeId', storeId)
  }

  if (fleetId) {
    localStorage.setItem('fleetId', fleetId)
  }
}
