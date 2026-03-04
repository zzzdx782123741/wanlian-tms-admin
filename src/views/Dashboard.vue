<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="32" color="#fff"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOrders }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="32" color="#fff"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.completedOrders }}</div>
              <div class="stat-label">已完成订单</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="32" color="#fff"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingOrders }}</div>
              <div class="stat-label">进行中订单</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" v-if="userRole === 'FLEET_MANAGER'">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="32" color="#fff"><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ accountBalance }}</div>
              <div class="stat-label">账户余额</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" v-else-if="userRole === 'PLATFORM_OPERATOR'">
          <div class="stat-content">
            <div class="stat-icon" style="background: #909399">
              <el-icon :size="32" color="#fff"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalFleets }}</div>
              <div class="stat-label">合作车队</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
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
                  <el-tag :type="getRoleTagType(userRole)">{{ getRoleText(userRole) }}</el-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">系统时间：</span>
                  <span class="info-value">{{ currentTime }}</span>
                </div>
              </el-col>
              <el-col :span="12" v-if="userRole === 'PLATFORM_OPERATOR'">
                <div class="info-item">
                  <span class="info-label">待审核车队：</span>
                  <el-tag type="warning">{{ stats.pendingFleets || 0 }} 个</el-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">待审核门店：</span>
                  <el-tag type="warning">{{ stats.pendingStores || 0 }} 个</el-tag>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { getBalance } from '@/api/account'
import { getFleetStats } from '@/api/fleet'
import { getStoreStats } from '@/api/store'

const userRole = localStorage.getItem('role') || ''
const accountBalance = ref(0)
const currentTime = ref('')
const stats = ref({
  totalOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  totalFleets: 0,
  pendingFleets: 0,
  pendingStores: 0
})

let timer = null

// 获取角色文本
const getRoleText = (role) => {
  const roleMap = {
    'DRIVER': '司机',
    'FLEET_MANAGER': '车队管理员',
    'STORE_TECHNICIAN': '门店技师',
    'PLATFORM_OPERATOR': '平台运营'
  }
  return roleMap[role] || '未知角色'
}

// 获取角色标签类型
const getRoleTagType = (role) => {
  const typeMap = {
    'DRIVER': '',
    'FLEET_MANAGER': 'success',
    'STORE_TECHNICIAN': 'warning',
    'PLATFORM_OPERATOR': 'danger'
  }
  return typeMap[role] || ''
}

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取账户余额
const fetchBalance = async () => {
  if (userRole === 'FLEET_MANAGER') {
    try {
      const res = await getBalance()
      accountBalance.value = res.data.balance
    } catch (error) {
      console.error('获取余额失败:', error)
    }
  }
}

// 获取平台运营统计数据
const fetchPlatformStats = async () => {
  if (userRole === 'PLATFORM_OPERATOR') {
    try {
      const [fleetRes, storeRes] = await Promise.all([
        getFleetStats(),
        getStoreStats()
      ])
      stats.value.totalFleets = fleetRes.data.totalFleets
      stats.value.pendingFleets = fleetRes.data.pendingFleets
      stats.value.pendingStores = storeRes.data.pendingStores
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  fetchBalance()
  fetchPlatformStats()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped lang="scss">
.dashboard {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;

      .stat-icon {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
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
