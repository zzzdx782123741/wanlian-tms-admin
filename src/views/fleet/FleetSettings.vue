<template>
  <div class="fleet-settings">
    <!-- 车队配置 -->
    <el-card>
      <template #header>
        <span class="card-header-title">车队配置</span>
      </template>

      <el-form
        :model="fleetConfig"
        label-width="180px"
        style="max-width: 600px"
      >
        <!-- 门店选择权限配置 -->
        <el-divider content-position="left">
          门店选择权限
        </el-divider>

        <el-form-item label="维修订单">
          <el-switch
            v-model="fleetConfig.storeSelectionConfig.repair"
            active-text="司机选择"
            inactive-text="车队管理选择"
            @change="handleConfigChange"
          />
          <div class="form-item-tip">
            {{ fleetConfig.storeSelectionConfig.repair
              ? '司机提交维修单时可自行选择门店'
              : '司机提交维修单后，由车队管理员审批时选择门店' }}
          </div>
        </el-form-item>

        <el-form-item label="保养订单">
          <el-switch
            v-model="fleetConfig.storeSelectionConfig.maintenance"
            active-text="司机选择"
            inactive-text="车队管理选择"
            @change="handleConfigChange"
          />
          <div class="form-item-tip">
            {{ fleetConfig.storeSelectionConfig.maintenance
              ? '司机提交保养单时可自行选择门店'
              : '司机提交保养单后，由车队管理员审批时选择门店' }}
          </div>
        </el-form-item>

        <el-form-item label="当前配置状态">
          <el-space
            direction="vertical"
            :size="8"
          >
            <el-tag
              :type="fleetConfig.storeSelectionConfig.repair ? 'success' : 'info'"
              size="large"
            >
              维修门店: {{ fleetConfig.storeSelectionConfig.repair ? '司机选择' : '车队管理选择' }}
            </el-tag>
            <el-tag
              :type="fleetConfig.storeSelectionConfig.maintenance ? 'success' : 'info'"
              size="large"
            >
              保养门店: {{ fleetConfig.storeSelectionConfig.maintenance ? '司机选择' : '车队管理选择' }}
            </el-tag>
          </el-space>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 快捷入口 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span class="card-header-title">快捷入口</span>
      </template>
      <el-space :size="16">
        <el-button
          type="primary"
          @click="openMaintenanceApproval"
        >
          <el-icon><Document /></el-icon>
          保养申请审批
        </el-button>
        <el-button @click="openPackageManagement">
          <el-icon><Box /></el-icon>
          保养套餐管理
        </el-button>
      </el-space>
    </el-card>

    <!-- 待审批订单 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>待审批订单</span>
          <div class="header-actions">
            <el-button
              type="primary"
              size="small"
              @click="fetchPendingOrders"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计信息 -->
      <el-row
        :gutter="20"
        style="margin-bottom: 20px"
      >
        <el-col :span="8">
          <el-statistic
            title="待审批"
            :value="stats.pending"
          />
        </el-col>
        <el-col :span="8">
          <el-statistic
            title="今日已审批"
            :value="stats.approvedToday"
          />
        </el-col>
        <el-col :span="8">
          <el-statistic
            title="今日已拒绝"
            :value="stats.rejectedToday"
          />
        </el-col>
      </el-row>

      <!-- 订单列表 -->
      <el-table
        v-loading="loading"
        :data="pendingOrders"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="orderNumber"
          label="订单号"
          width="180"
        />
        <el-table-column
          label="类型"
          width="80"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.type === 'maintenance' ? 'warning' : 'danger'"
              size="small"
            >
              {{ row.type === 'maintenance' ? '保养' : '维修' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="车辆"
          width="150"
        >
          <template #default="{ row }">
            {{ row.vehicleId?.plateNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="报修司机"
          width="120"
        >
          <template #default="{ row }">
            {{ row.reporterId?.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="司机电话"
          width="140"
        >
          <template #default="{ row }">
            {{ row.reporterId?.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="faultDescription"
          label="故障描述"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          label="服务地址"
          width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.serviceLocation?.address || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="提交时间"
          width="110"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleApprove(row)"
            >
              审批
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && pendingOrders.length === 0"
        description="暂无待审批订单"
        :image-size="120"
      />
    </el-card>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="审批订单"
      width="600px"
    >
      <div
        v-if="currentOrder"
        class="approve-content"
      >
        <!-- 订单详情 -->
        <el-descriptions
          :column="2"
          border
          style="margin-bottom: 20px"
        >
          <el-descriptions-item label="订单号">
            {{ currentOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag
              :type="currentOrder.type === 'maintenance' ? 'warning' : 'danger'"
              size="small"
            >
              {{ currentOrder.type === 'maintenance' ? '保养' : '维修' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="车辆">
            {{ currentOrder.vehicleId?.plateNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="报修司机">
            {{ currentOrder.reporterId?.nickname }}
          </el-descriptions-item>
          <el-descriptions-item label="司机电话">
            {{ currentOrder.reporterId?.phone }}
          </el-descriptions-item>
          <el-descriptions-item
            label="服务地址"
            :span="2"
          >
            {{ currentOrder.serviceLocation?.address || '-' }}
          </el-descriptions-item>
          <el-descriptions-item
            label="故障描述"
            :span="2"
          >
            {{ currentOrder.faultDescription }}
          </el-descriptions-item>
          <el-descriptions-item
            label="提交时间"
            :span="2"
          >
            {{ formatDateTime(currentOrder.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 选择门店（如果车队配置为车队管理选择门店） -->
        <el-form
          v-if="!currentOrderTypeAllowSelect"
          :model="approveForm"
          label-width="100px"
        >
          <el-form-item
            label="选择门店"
            required
          >
            <el-select
              v-model="approveForm.storeId"
              placeholder="请选择门店"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="store in storeList"
                :key="store._id"
                :label="`${store.name}（${formatAddress(store.address)}）`"
                :value="store._id"
              />
            </el-select>
            <div class="form-item-tip">
              推荐按服务地址选择附近门店
            </div>
          </el-form-item>

          <!-- 显示附近门店推荐 -->
          <el-form-item
            v-if="nearbyStores.length > 0"
            label="附近门店"
          >
            <div class="nearby-stores">
              <div
                v-for="store in nearbyStores.slice(0, 5)"
                :key="store._id"
                class="nearby-store-item"
                :class="{ selected: approveForm.storeId === store._id }"
                @click="approveForm.storeId = store._id"
              >
                <div class="store-name">
                  {{ store.name }}
                </div>
                <div class="store-address">
                  {{ formatAddress(store.address) }}
                </div>
                <div class="store-distance">
                  <el-tag
                    size="small"
                    type="success"
                  >
                    {{ store.distance }}公里
                  </el-tag>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-form>

        <!-- 司机已选择门店的情况 -->
        <el-alert
          v-if="currentOrderTypeAllowSelect && currentOrder.storeId"
          title="司机已选择门店"
          type="info"
          :closable="false"
          style="margin-top: 10px"
        >
          {{ currentOrder.storeId?.name }}（{{ formatAddress(currentOrder.storeId?.address) }}）
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="approveDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="approving"
          :disabled="!currentOrderTypeAllowSelect && !approveForm.storeId"
          @click="confirmApprove"
        >
          审批通过
        </el-button>
      </template>
    </el-dialog>

    <!-- 拒绝对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝订单"
      width="500px"
    >
      <el-form
        :model="rejectForm"
        label-width="80px"
      >
        <el-form-item
          label="拒绝原因"
          required
        >
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因，司机将根据原因进行调整后重新提交"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="danger"
          :loading="rejecting"
          :disabled="!rejectForm.reason.trim()"
          @click="confirmReject"
        >
          确认拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Document, Box } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import {
  getOrders,
  fleetApproveOrder,
  fleetRejectOrder
} from '@/api/order'
import { getStores, getNearbyStores } from '@/api/store'
import { updateFleetStoreConfig } from '@/api/fleet'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const approving = ref(false)
const rejecting = ref(false)
const pendingOrders = ref([])
const storeList = ref([])
const nearbyStores = ref([])

const stats = ref({
  pending: 0,
  approvedToday: 0,
  rejectedToday: 0
})

const fleetConfig = ref({
  storeSelectionConfig: {
    repair: false,
    maintenance: true
  }
})

const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const currentOrder = ref(null)

const approveForm = ref({
  storeId: null
})

const rejectForm = ref({
  reason: ''
})

// 根据当前订单类型判断是否允许司机选择门店
const currentOrderTypeAllowSelect = computed(() => {
  if (!currentOrder.value) return false
  const orderType = currentOrder.value.type || 'repair'
  if (orderType === 'maintenance') {
    return fleetConfig.value.storeSelectionConfig?.maintenance ?? true
  } else {
    return fleetConfig.value.storeSelectionConfig?.repair ?? false
  }
})

// 获取用户所属车队ID
const userFleetId = computed(() => {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}')
  return user.fleetInfo?.fleetId
})

// 获取车队配置
const fetchFleetConfig = async () => {
  try {
    const res = await request({
      url: `/fleets/${userFleetId.value}`,
      method: 'get'
    })
    const fleet = res.data.fleet || {}

    // 支持新旧配置结构
    if (fleet.storeSelectionConfig) {
      fleetConfig.value = {
        storeSelectionConfig: {
          repair: fleet.storeSelectionConfig.repair ?? false,
          maintenance: fleet.storeSelectionConfig.maintenance ?? true
        }
      }
    } else {
      // 兼容旧配置
      const allowDriverSelectStore = fleet.allowDriverSelectStore || false
      fleetConfig.value = {
        storeSelectionConfig: {
          repair: allowDriverSelectStore,
          maintenance: allowDriverSelectStore
        }
      }
    }
  } catch (error) {
    console.error('获取车队配置失败:', error)
  }
}

// 更新车队配置
const handleConfigChange = async () => {
  try {
    await updateFleetStoreConfig(userFleetId.value, {
      storeSelectionConfig: fleetConfig.value.storeSelectionConfig
    })
    ElMessage.success('配置更新成功')
  } catch (error) {
    console.error('更新配置失败:', error)
    // 失败时恢复原值
    await fetchFleetConfig()
  }
}

// 打开保养审批页面
const openMaintenanceApproval = () => {
  router.push('/fleet/maintenance-approval')
}

// 打开保养套餐管理页面
const openPackageManagement = () => {
  router.push('/fleet-maintenance-packages')
}

// 获取待审批订单
const fetchPendingOrders = async () => {
  loading.value = true
  try {
    const res = await getOrders({ status: 'awaiting_fleet_approval' })
    pendingOrders.value = res.data?.orders || []
    stats.value.pending = pendingOrders.value.length
  } catch (error) {
    console.error('获取待审批订单失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取门店列表
const fetchStores = async () => {
  try {
    const res = await getStores({ status: 'normal', limit: 100 })
    storeList.value = res.data.stores || []
  } catch (error) {
    console.error('获取门店列表失败:', error)
  }
}

// 获取附近门店
const fetchNearbyStores = async (latitude, longitude) => {
  try {
    const res = await getNearbyStores({ latitude, longitude, radius: 50 })
    nearbyStores.value = res.data.stores || []
  } catch (error) {
    console.error('获取附近门店失败:', error)
  }
}

// 审批订单
const handleApprove = async (order) => {
  currentOrder.value = order
  approveForm.value.storeId = null
  nearbyStores.value = []

  // 如果服务地址有坐标，获取附近门店
  if (order.serviceLocation?.latitude && order.serviceLocation?.longitude) {
    await fetchNearbyStores(
      order.serviceLocation.latitude,
      order.serviceLocation.longitude
    )
  }

  approveDialogVisible.value = true
}

// 确认审批
const confirmApprove = async () => {
  // 如果司机没有选择门店，车队必须选择
  if (!currentOrderTypeAllowSelect.value && !approveForm.value.storeId) {
    ElMessage.warning('请选择门店')
    return
  }

  approving.value = true
  try {
    await fleetApproveOrder(currentOrder.value._id, {
      storeId: approveForm.value.storeId
    })
    ElMessage.success('审批通过')
    approveDialogVisible.value = false
    fetchPendingOrders()
  } catch (error) {
    console.error('审批失败:', error)
  } finally {
    approving.value = false
  }
}

// 拒绝订单
const handleReject = (order) => {
  currentOrder.value = order
  rejectForm.value.reason = ''
  rejectDialogVisible.value = true
}

// 确认拒绝
const confirmReject = async () => {
  if (!rejectForm.value.reason.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }

  rejecting.value = true
  try {
    await fleetRejectOrder(currentOrder.value._id, {
      reason: rejectForm.value.reason
    })
    ElMessage.success('订单已拒绝')
    rejectDialogVisible.value = false
    fetchPendingOrders()
  } catch (error) {
    console.error('拒绝失败:', error)
  } finally {
    rejecting.value = false
  }
}

// 格式化地址
const formatAddress = (address) => {
  if (!address) return '-'
  if (typeof address === 'string') return address
  // 如果是对象，拼接省份、城市、区、详细地址
  const parts = [address.province, address.city, address.district, address.detail].filter(Boolean)
  return parts.join('') || '-'
}

// 格式化日期时间
const formatDateTime = (date) => {
  return dayjs(date).format('MM-DD HH:mm')
}

onMounted(() => {
  fetchFleetConfig()
  fetchPendingOrders()
  fetchStores()
})
</script>

<style scoped lang="scss">
.fleet-settings {
  .card-header-title {
    font-weight: 600;
    color: #2c3e50;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .form-item-tip {
    margin-top: 8px;
    font-size: 13px;
    color: #909399;
    line-height: 1.5;
  }

  .approve-content {
    :deep(.el-descriptions) {
      .el-descriptions__label {
        font-weight: 500;
      }
    }
  }

  .nearby-stores {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;

    .nearby-store-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
        background-color: #f0f7ff;
      }

      &.selected {
        border-color: #409eff;
        background-color: #ecf5ff;
      }

      .store-name {
        flex: 1;
        font-weight: 500;
        color: #303133;
      }

      .store-address {
        flex: 2;
        font-size: 13px;
        color: #606266;
      }

      .store-distance {
        flex-shrink: 0;
      }
    }
  }
}
</style>
