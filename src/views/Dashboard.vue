<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="总订单数"
            :value="stats.totalOrders"
          />
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            :title="isPlatformOperator ? '待接单' : '已完成订单'"
            :value="isPlatformOperator ? stats.pendingOrders : stats.completedOrders"
          />
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            :title="isPlatformOperator ? '维修中' : '进行中订单'"
            :value="isPlatformOperator ? stats.repairingOrders : stats.pendingOrders"
          />
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card
          v-if="isFleetManager"
          class="stat-card stat-card-info"
        >
          <el-statistic
            title="账户余额"
            :value="accountBalance"
            :precision="2"
            prefix="¥"
          />
        </el-card>
        <el-card
          v-else-if="isPlatformOperator"
          class="stat-card stat-card-primary"
        >
          <el-statistic
            title="已完成"
            :value="stats.completedOrders"
          />
        </el-card>
        <el-card
          v-else
          class="stat-card stat-card-info"
        >
          <el-statistic
            title="总交易额"
            :value="stats.totalAmount"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row
      :gutter="20"
      style="margin-top: 20px"
    >
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>欢迎使用万联驿站2.0管理后台</span>
            </div>
          </template>
          <div class="welcome-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <span class="info-label">当前角色：</span>
                  <el-tag :type="getRoleTagType(userRole)">
                    {{ getRoleText(userRole) }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">系统时间：</span>
                  <span class="info-value">{{ currentTime }}</span>
                </div>
              </el-col>
              <el-col
                v-if="isPlatformOperator"
                :span="12"
              >
                <div class="info-item">
                  <span class="info-label">待审核车队：</span>
                  <el-tag type="warning">
                    {{ stats.pendingFleets || 0 }} 个
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">待审核门店：</span>
                  <el-tag type="warning">
                    {{ stats.pendingStores || 0 }} 个
                  </el-tag>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getBalance } from '@/api/account'
import { getCurrentFleetStats, getFleetStats } from '@/api/fleet'
import { getOverview } from '@/api/stats'
import { getStoreOrders, getStoreStatistics, getStoreStats } from '@/api/store'

const normalizeRole = (role) => (role || '').toUpperCase()

const userRole = computed(() => localStorage.getItem('role') || '')
const isFleetManager = computed(() => normalizeRole(userRole.value) === 'FLEET_MANAGER')
const isPlatformOperator = computed(() => normalizeRole(userRole.value) === 'PLATFORM_OPERATOR')

const accountBalance = ref(0)
const currentTime = ref('')
const stats = ref({
  totalOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  repairingOrders: 0,
  totalAmount: 0,
  totalFleets: 0,
  pendingFleets: 0,
  pendingStores: 0
})

let clockTimer = null
let balanceRefreshTimer = null

const getRoleText = (role) => {
  const roleMap = {
    DRIVER: '司机',
    FLEET_MANAGER: '车队管理员',
    STORE_TECHNICIAN: '门店技师',
    STORE_MANAGER: '门店管理员',
    PLATFORM_OPERATOR: '平台运营'
  }

  return roleMap[normalizeRole(role)] || '未知角色'
}

const getRoleTagType = (role) => {
  const typeMap = {
    DRIVER: 'info',
    FLEET_MANAGER: 'success',
    STORE_TECHNICIAN: 'warning',
    STORE_MANAGER: 'warning',
    PLATFORM_OPERATOR: 'danger'
  }

  return typeMap[normalizeRole(role)] || 'info'
}

const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const fetchBalance = async () => {
  if (!isFleetManager.value) {
    return
  }

  try {
    const res = await getBalance()
    // 后端已返回元，直接使用
    accountBalance.value = Number(res.data?.balance || 0)
  } catch (error) {
    console.error('获取余额失败:', error)
  }
}

const fetchPlatformStats = async () => {
  if (!isPlatformOperator.value) {
    return
  }

  try {
    const [fleetRes, storeRes, overviewRes] = await Promise.all([
      getFleetStats(),
      getStoreStats(),
      getOverview()
    ])

    const overview = overviewRes.data || {}

    stats.value.totalOrders = Number(overview.orders?.total ?? 0)
    stats.value.pendingOrders = Number(overview.orders?.pending ?? 0)
    stats.value.repairingOrders = Number(overview.orders?.repairing ?? 0)
    stats.value.completedOrders = Number(overview.orders?.completed ?? 0)
    stats.value.totalFleets = Number(fleetRes.data?.totalFleets ?? 0)
    stats.value.pendingFleets = Number(fleetRes.data?.pendingFleets ?? 0)
    stats.value.pendingStores = Number(storeRes.data?.pendingStores ?? 0)
  } catch (error) {
    console.error('获取平台统计数据失败:', error)
  }
}

const fetchFleetManagerStats = async () => {
  if (!isFleetManager.value) {
    return
  }

  try {
    const res = await getCurrentFleetStats()
    const fleetStats = res.data || {}

    stats.value.totalOrders = Number(fleetStats.totalOrders ?? 0)
    stats.value.completedOrders = Number(fleetStats.completedOrders ?? 0)
    stats.value.pendingOrders = Number(fleetStats.inTransitOrders ?? 0)
    stats.value.repairingOrders = Number(fleetStats.pendingOrders ?? 0)
  } catch (error) {
    console.error('获取车队管理员首页统计失败:', error)
  }
}

const fetchStoreManagerStats = async () => {
  if (normalizeRole(userRole.value) !== 'STORE_MANAGER') {
    return
  }

  try {
    const [ordersRes, statisticsRes] = await Promise.all([
      getStoreOrders({ page: 1, limit: 1 }),
      getStoreStatistics()
    ])

    const totalOrders = Number(ordersRes.data?.total ?? 0)
    const completedOrders = Number(statisticsRes.data?.summary?.completedOrders ?? 0)
    const totalRevenue = Number(statisticsRes.data?.summary?.totalRevenue ?? 0)

    stats.value.totalOrders = totalOrders
    stats.value.completedOrders = completedOrders
    stats.value.pendingOrders = Math.max(totalOrders - completedOrders, 0)
    stats.value.totalAmount = Number(totalRevenue.toFixed(2))
  } catch (error) {
    console.error('获取门店管理员首页统计失败:', error)
  }
}

onMounted(() => {
  updateTime()
  clockTimer = setInterval(updateTime, 1000)

  fetchBalance()
  fetchFleetManagerStats()
  fetchPlatformStats()
  fetchStoreManagerStats()

  if (isFleetManager.value) {
    balanceRefreshTimer = setInterval(fetchBalance, 30000)
  }
})

onUnmounted(() => {
  if (clockTimer) {
    clearInterval(clockTimer)
  }

  if (balanceRefreshTimer) {
    clearInterval(balanceRefreshTimer)
  }
})
</script>

<style scoped lang="scss">
.dashboard {
  .stat-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.stat-card-success :deep(.el-statistic__number) {
      color: #67c23a;
    }

    &.stat-card-warning :deep(.el-statistic__number) {
      color: #e6a23c;
    }

    &.stat-card-info :deep(.el-statistic__number) {
      color: #409eff;
    }

    &.stat-card-primary :deep(.el-statistic__number) {
      color: #409eff;
    }
  }

  .card-header {
    font-weight: 600;
    color: #2c3e50;
  }

  .welcome-content {
    padding: 20px 0;

    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      font-size: 14px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        color: #909399;
        margin-right: 10px;
        min-width: 100px;
      }

      .info-value {
        color: #606266;
      }
    }
  }
}
</style>
