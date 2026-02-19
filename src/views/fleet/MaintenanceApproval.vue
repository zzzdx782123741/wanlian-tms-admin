<template>
  <div class="maintenance-approval">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="待审批" :value="stats.pending" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic title="今日已审批" :value="stats.approvedToday" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic title="今日已拒绝" :value="stats.rejectedToday" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-info">
          <el-statistic title="本月累计" :value="stats.monthTotal" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 申请列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>待审批申请</span>
          <el-button type="primary" size="small" @click="fetchApplications">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审批" value="pending" />
            <el-option label="已审批" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="applications"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="orderNumber" label="申请单号" width="180" />
        <el-table-column label="车辆" width="150">
          <template #default="{ row }">
            {{ row.orderId?.vehicleId?.plateNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="保养类型" width="120">
          <template #default="{ row }">
            {{ row.maintenanceType?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="服务地址" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.orderId?.serviceLocation?.address || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="110">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="当前里程" width="100">
          <template #default="{ row }">
            {{ row.orderId?.milestone || '-' }} km
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleApprove(row)">
              审批
            </el-button>
            <el-button type="danger" size="small" link @click="handleReject(row)">
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px"
        @size-change="fetchApplications"
        @current-change="fetchApplications"
      />
    </el-card>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="审批保养申请"
      width="900px"
    >
      <div v-if="currentApplication" class="approve-content">
        <!-- 申请信息 -->
        <el-descriptions :column="2" border style="margin-bottom: 20px">
          <el-descriptions-item label="申请单号">{{ currentApplication.orderId?.orderNumber }}</el-descriptions-item>
          <el-descriptions-item label="保养类型">{{ currentApplication.maintenanceType?.name }}</el-descriptions-item>
          <el-descriptions-item label="车辆">{{ currentApplication.orderId?.vehicleId?.plateNumber }}</el-descriptions-item>
          <el-descriptions-item label="当前里程">{{ currentApplication.orderId?.milestone }} km</el-descriptions-item>
          <el-descriptions-item label="服务地址">
            {{ currentApplication.orderId?.serviceLocation?.address || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="到店时间">
            {{ currentApplication.preferredTime?.date }} {{ currentApplication.preferredTime?.timeSlot || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="司机备注">
            {{ currentApplication.driverRemark || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 车队配置信息 -->
        <el-alert
          title="车队配置"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <div>门店选择：{{ fleetConfig.allowDriverSelectStore ? '司机选择' : '车队选择' }}</div>
          <div>商品选择：{{ fleetConfig.maintenanceProductPermission === 'driver_select' ? '司机可选' : '车队管理' }}</div>
        </el-alert>

        <!-- 选择门店 -->
        <el-form :model="approveForm" label-width="120px" v-if="!fleetConfig.allowDriverSelectStore">
          <el-form-item label="选择门店" required>
            <el-select
              v-model="approveForm.storeId"
              placeholder="请选择维修门店"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="store in storeList"
                :key="store._id"
                :label="`${store.name}（${store.address}）`"
                :value="store._id"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <!-- 套餐调整 -->
        <el-form :model="approveForm" label-width="120px">
          <el-form-item label="套餐调整">
            <el-radio-group v-model="approveForm.adjustType">
              <el-radio label="keep">保持套餐</el-radio>
              <el-radio label="change">更换套餐</el-radio>
              <el-radio label="customize">自定义商品</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 保持或更换套餐 -->
          <el-form-item v-if="approveForm.adjustType !== 'customize'">
            <el-select
              v-model="approveForm.packageId"
              placeholder="请选择套餐"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="pkg in currentApplication.recommendedPackages"
                :key="pkg._id"
                :label="`${pkg.name} - ¥${pkg.price}`"
                :value="pkg._id"
              />
            </el-select>
          </el-form-item>

          <!-- 自定义商品 -->
          <template v-if="approveForm.adjustType === 'customize'">
            <el-form-item label="选择商品">
              <el-checkbox-group v-model="approveForm.selectedProductIds">
                <el-checkbox
                  v-for="product in allProducts"
                  :key="product._id"
                  :label="`${product.name} - ¥${product.price}`"
                  :value="product._id"
                />
              </el-checkbox-group>
            </el-form-item>
          </template>

          <!-- 最终金额 -->
          <el-form-item label="最终金额">
            <el-input-number
              v-model="approveForm.finalAmount"
              :min="0"
              :precision="2"
              :step="100"
              controls-position="right"
              style="width: 200px"
            />
            <span style="margin-left: 12px; color: #909399;">元</span>
          </el-form-item>

          <!-- 超过阈值提示 -->
          <el-alert
            v-if="finalAmount > fleetConfig.maintenanceBudgetThreshold"
            title="超出预算阈值"
            type="warning"
            :closable="false"
            style="margin-top: 12px"
          >
            当前金额 ¥{{ finalAmount }} 超过预算阈值 ¥{{ fleetConfig.maintenanceBudgetThreshold }}
          </el-alert>
        </el-form>

        <!-- 审批备注 -->
        <el-form-item label="审批备注">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审批备注（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </div>

      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove" :loading="approving">确认通过</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝保养申请"
      width="500px"
    >
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="rejecting" :disabled="!rejectForm.reason.trim()">
          确认拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getMaintenanceApplications, approveMaintenanceApplication } from '@/api/maintenance'
import { getStores } from '@/api/store'
import { getFleetConfig } from '@/api/fleet'
import dayjs from 'dayjs'

const loading = ref(false)
const approving = ref(false)
const rejecting = ref(false)
const applications = ref([])
const storeList = ref([])
const allProducts = ref([])
const total = ref(0)

const stats = ref({
  pending: 0,
  approvedToday: 0,
  rejectedToday: 0,
  monthTotal: 0
})

const queryParams = ref({
  page: 1,
  limit: 20,
  status: ''
})

const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const currentApplication = ref(null)

const approveForm = ref({
  storeId: null,
  adjustType: 'keep',
  packageId: null,
  selectedProductIds: [],
  finalAmount: 0
})

const rejectForm = ref({
  reason: ''
})

const fleetConfig = ref({
  allowDriverSelectStore: false,
  maintenanceProductPermission: 'fleet_control',
  maintenanceBudgetThreshold: 5000
})

const userFleetId = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.fleetInfo?.fleetId
})

const finalAmount = computed(() => {
  return approveForm.value.finalAmount || 0
})

// 获取车队配置
const fetchFleetConfig = async () => {
  try {
    const res = await getFleetConfig(userFleetId.value)
    fleetConfig.value = res.data.fleet || {}
  } catch (error) {
    console.error('获取车队配置失败:', error)
  }
}

// 获取申请列表
const fetchApplications = async () => {
  loading.value = true
  try {
    const res = await getMaintenanceApplications({
      status: queryParams.value.status || undefined,
      page: queryParams.value.page,
      limit: queryParams.value.limit
    })
    applications.value = res.data.applications || []
    total.value = res.data.total || 0

    // 更新统计
    stats.value.pending = applications.value.filter(a => a.fleetApproval?.status === 'pending').length
    stats.value.approvedToday = applications.value.filter(a => {
      const date = new Date(a.fleetApproval?.approvedAt)
      return date && dayjs(date).isSame(dayjs(), 'day') && a.fleetApproval?.status === 'approved'
    }).length
    stats.value.rejectedToday = applications.value.filter(a => {
      const date = new Date(a.fleetApproval?.approvedAt)
      return date && dayjs(date).isSame(dayjs(), 'day') && a.fleetApproval?.status === 'rejected'
    }).length
  } catch (error) {
    console.error('获取申请列表失败:', error)
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

// 审批申请
const handleApprove = async (application) => {
  currentApplication.value = application
  approveForm.value = {
    storeId: null,
    adjustType: 'keep',
    packageId: null,
    selectedProductIds: [],
    finalAmount: 0
  }

  // 如果需要选择门店
  if (!fleetConfig.value.allowDriverSelectStore) {
    await fetchStores()
  }

  approveDialogVisible.value = true
}

// 确认审批
const confirmApprove = async () => {
  approving.value = true
  try {
    await approveMaintenanceApplication(currentApplication.value._id, {
      storeId: approveForm.value.storeId,
      packageId: approveForm.value.packageId,
      adjustedProducts: approveForm.value.adjustType === 'customize'
        ? allProducts.value.filter(p => approveForm.value.selectedProductIds.includes(p._id))
          : undefined,
      finalAmount: approveForm.value.finalAmount,
      remark: approveForm.value.remark
    })

    ElMessage.success('审批通过')
    approveDialogVisible.value = false
    fetchApplications()
  } catch (error) {
    console.error('审批失败:', error)
  } finally {
    approving.value = false
  }
}

// 拒绝申请
const handleReject = (application) => {
  currentApplication.value = application
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
    await approveMaintenanceApplication(currentApplication.value._id, {
      approved: false,
      reason: rejectForm.value.reason
    })

    ElMessage.success('已拒绝申请')
    rejectDialogVisible.value = false
    fetchApplications()
  } catch (error) {
    console.error('拒绝失败:', error)
  } finally {
    rejecting.value = false
  }
}

// 查询
const handleQuery = () => {
  queryParams.value.page = 1
  fetchApplications()
}

// 重置
const handleReset = () => {
  queryParams.value = {
    page: 1,
    limit: 20,
    status: ''
  }
  fetchApplications()
}

// 格式化日期时间
const formatDateTime = (date) => {
  return dayjs(date).format('MM-DD HH:mm')
}

onMounted(() => {
  fetchFleetConfig()
  fetchApplications()
})
</script>

<style scoped lang="scss">
.maintenance-approval {
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
      color: #909399;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;

    > div {
      display: flex;
      gap: 10px;
    }
  }

  .search-form {
    margin-bottom: 20px;
  }

  .approve-content {
    :deep(.el-descriptions) {
      .el-descriptions__label {
        font-weight: 500;
      }
    }
  }
}
</style>
