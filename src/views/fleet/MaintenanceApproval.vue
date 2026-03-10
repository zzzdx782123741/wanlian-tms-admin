<template>
  <div class="maintenance-approval">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="待审批"
            :value="stats.pending"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="今日已审批"
            :value="stats.approvedToday"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="今日已拒绝"
            :value="stats.rejectedToday"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-info">
          <el-statistic
            title="本月累计"
            :value="stats.monthTotal"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 申请列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>待审批申请</span>
          <el-button
            type="primary"
            size="small"
            @click="fetchApplications"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form
        :inline="true"
        class="search-form"
      >
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              label="待审批"
              value="pending"
            />
            <el-option
              label="已审批"
              value="approved"
            />
            <el-option
              label="已拒绝"
              value="rejected"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleQuery"
          >
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="applications"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="orderNumber"
          label="申请单号"
          width="180"
        />
        <el-table-column
          label="车辆"
          width="150"
        >
          <template #default="{ row }">
            {{ row.orderId?.vehicleId?.plateNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="保养类型"
          width="120"
        >
          <template #default="{ row }">
            {{ row.maintenanceType?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="服务地址"
          width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.orderId?.serviceLocation?.address || '-' }}
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
          label="当前里程"
          width="100"
        >
          <template #default="{ row }">
            {{ row.orderId?.milestone || '-' }} km
          </template>
        </el-table-column>
        <el-table-column
          label="里程照片"
          width="100"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.orderId?.milestonePhotos && row.orderId.milestonePhotos.length > 0"
              type="primary"
              size="small"
              link
              @click="viewMilestonePhotos(row.orderId.milestonePhotos)"
            >
              查看({{ row.orderId.milestonePhotos.length }})
            </el-button>
            <span v-else>-</span>
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
              link
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
      :title="fleetConfig.allowDriverSelectStore ? '审批保养申请（司机已选择门店）' : '审批保养申请'"
      width="900px"
    >
      <div
        v-if="currentApplication"
        class="approve-content"
      >
        <!-- 申请信息 -->
        <el-descriptions
          :column="2"
          border
          style="margin-bottom: 20px"
        >
          <el-descriptions-item label="申请单号">
            {{ currentApplication.orderId?.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="保养类型">
            {{ currentApplication.maintenanceType?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="车辆">
            {{ currentApplication.orderId?.vehicleId?.plateNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="当前里程">
            {{ currentApplication.orderId?.milestone }} km
          </el-descriptions-item>
          <el-descriptions-item label="服务地址">
            {{ currentApplication.orderId?.serviceLocation?.address || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="到店时间">
            {{ currentApplication.appointment?.expectedDate ? new Date(currentApplication.appointment.expectedDate).toLocaleDateString() : '-' }}
            {{ currentApplication.appointment?.expectedTimeSlot || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="司机备注">
            {{ currentApplication.driverRemark || '-' }}
          </el-descriptions-item>
          <el-descriptions-item
            label="里程照片"
            :span="2"
          >
            <div
              v-if="currentApplication.orderId?.milestonePhotos && currentApplication.orderId.milestonePhotos.length > 0"
              class="milestone-photos"
            >
              <el-image
                v-for="(photo, index) in currentApplication.orderId.milestonePhotos"
                :key="index"
                :src="photo"
                :preview-src-list="currentApplication.orderId.milestonePhotos"
                :initial-index="index"
                fit="cover"
                style="width: 80px; height: 80px; margin-right: 8px; border-radius: 4px; cursor: pointer;"
              />
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 车队配置信息 -->
        <el-alert
          title="车队配置"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <div>门店选择模式：{{ fleetConfig.allowDriverSelectStore ? '司机自选门店' : '车队分配门店' }}</div>
          <div>商品选择权限：{{ fleetConfig.maintenanceProductPermission === 'driver_select' ? '司机可选' : '车队管理' }}</div>
        </el-alert>

        <!-- 司机已选择的门店信息 -->
        <el-alert
          v-if="fleetConfig.allowDriverSelectStore && currentApplication?.orderId?.storeId"
          title="司机选择的门店"
          type="success"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <div>门店名称：{{ getStoreName(currentApplication.orderId.storeId) }}</div>
          <div>门店地址：{{ getStoreAddress(currentApplication.orderId.storeId) }}</div>
        </el-alert>

        <!-- 选择门店（仅当车队分配门店时显示） -->
        <el-form
          v-if="!fleetConfig.allowDriverSelectStore"
          :model="approveForm"
          label-width="120px"
        >
          <el-form-item
            label="选择门店"
            required
          >
            <el-select
              v-model="approveForm.storeId"
              placeholder="请选择维修门店"
              style="width: 100%"
              filterable
              @change="handleStoreChange"
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
        <el-form
          :model="approveForm"
          label-width="120px"
        >
          <el-form-item label="套餐选择">
            <el-select
              v-model="approveForm.packageId"
              placeholder="请选择套餐"
              style="width: 100%"
              filterable
              @change="handlePackageChange"
            >
              <el-option
                v-for="pkg in availablePackages"
                :key="pkg._id"
                :label="`${pkg.name} - ¥${pkg.price.toFixed(2)}（原价¥${pkg.originalPrice.toFixed(2)}）`"
                :value="pkg._id"
              />
            </el-select>
          </el-form-item>

          <!-- 套餐详情 -->
          <el-alert
            v-if="selectedPackage"
            title="套餐详情"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          >
            <div>套餐名称：{{ selectedPackage.name }}</div>
            <div>套餐档次：{{ selectedPackage.tier }}</div>
            <div>套餐价格：¥{{ selectedPackage.price.toFixed(2) }}</div>
            <div>适用里程：{{ selectedPackage.mileageRange?.min }}km - {{ selectedPackage.mileageRange?.max }}km</div>
            <div>预计工时：{{ selectedPackage.estimatedDuration || '-' }}小时</div>
          </el-alert>

          <!-- 最终金额 -->
          <el-form-item
            label="审批金额"
            required
          >
            <el-input-number
              v-model="approveForm.finalAmount"
              :min="0"
              :precision="2"
              :step="100"
              controls-position="right"
              style="width: 200px"
            />
            <span style="margin-left: 12px; color: #909399;">元（审批通过后将从车队账户冻结此金额）</span>
          </el-form-item>

          <!-- 资金冻结提示 -->
          <el-alert
            v-if="approveForm.finalAmount > 0"
            title="资金冻结说明"
            type="warning"
            :closable="false"
            style="margin-bottom: 16px"
          >
            <div>审批通过后将从车队账户冻结 <strong>¥{{ approveForm.finalAmount.toFixed(2) }}</strong></div>
            <div>完工结算时多退少补，剩余资金将自动解冻</div>
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
        <el-button @click="approveDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="approving"
          @click="confirmApprove"
        >
          确认通过
        </el-button>
      </template>
    </el-dialog>

    <!-- 拒绝对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝保养申请"
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
            placeholder="请输入拒绝原因"
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

    <!-- 里程照片查看对话框 -->
    <el-dialog
      v-model="milestonePhotosDialogVisible"
      title="里程照片"
      width="800px"
    >
      <div class="milestone-photos-dialog">
        <el-image
          v-for="(photo, index) in currentMilestonePhotos"
          :key="index"
          :src="photo"
          :preview-src-list="currentMilestonePhotos"
          :initial-index="index"
          fit="contain"
          style="width: 100%; margin-bottom: 12px; border-radius: 4px;"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getMaintenanceApplications, approveMaintenanceApplication, getPackages } from '@/api/maintenance'
import { getStores } from '@/api/store'
import { getFleetConfig } from '@/api/fleet'
import dayjs from 'dayjs'

const loading = ref(false)
const approving = ref(false)
const rejecting = ref(false)
const applications = ref([])
const storeList = ref([])
const availablePackages = ref([])
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
const milestonePhotosDialogVisible = ref(false)
const currentApplication = ref(null)
const currentMilestonePhotos = ref([])

const approveForm = ref({
  storeId: null,
  packageId: null,
  finalAmount: 0,
  remark: ''
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
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  return userInfo.fleetInfo?.fleetId
})

// 选中的套餐
const selectedPackage = computed(() => {
  if (!approveForm.value.packageId) return null
  return availablePackages.value.find(p => p._id === approveForm.value.packageId)
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

// 获取套餐列表
const fetchPackages = async (storeId = null) => {
  try {
    const params = { enabled: true, limit: 100 }
    // 如果提供了门店ID，则获取该门店的套餐和平台套餐
    if (storeId) {
      params.storeId = storeId
    }
    const res = await getPackages(params)
    availablePackages.value = res.data.packages || []
  } catch (error) {
    console.error('获取套餐列表失败:', error)
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

// 套餐变化
const handlePackageChange = (packageId) => {
  const pkg = availablePackages.value.find(p => p._id === packageId)
  if (pkg) {
    approveForm.value.finalAmount = pkg.price
  }
}

// 门店变化：清空已选套餐并重新加载套餐列表
const handleStoreChange = async (storeId) => {
  // 清空已选套餐
  approveForm.value.packageId = null
  approveForm.value.finalAmount = 0

  // 根据选择的门店重新加载套餐列表
  if (storeId) {
    await fetchPackages(storeId)
  } else {
    // 如果没有选择门店，加载所有套餐
    await fetchPackages()
  }
}

// 查看里程照片
const viewMilestonePhotos = (photos) => {
  currentMilestonePhotos.value = photos
  milestonePhotosDialogVisible.value = true
}

// 审批申请
const handleApprove = async (application) => {
  currentApplication.value = application
  approveForm.value = {
    storeId: null,
    packageId: application.packageId || null,
    finalAmount: 0,
    remark: ''
  }

  // 确定要查询套餐的门店ID
  let packageStoreId = null

  if (fleetConfig.value.allowDriverSelectStore) {
    // 司机已选择门店模式：使用司机选择的门店ID获取套餐
    if (application.orderId?.storeId) {
      packageStoreId = application.orderId.storeId
    }
  } else {
    // 车队分配门店模式：需要先获取门店列表
    await fetchStores()
  }

  // 获取套餐列表（根据门店ID过滤）
  await fetchPackages(packageStoreId)

  // 如果有套餐，自动填充金额
  if (application.packageId) {
    const pkg = availablePackages.value.find(p => p._id === application.packageId)
    if (pkg) {
      approveForm.value.finalAmount = pkg.price
    }
  }

  approveDialogVisible.value = true
}

// 确认审批
const confirmApprove = async () => {
  // 验证门店：仅当车队分配门店时需要验证
  if (!fleetConfig.value.allowDriverSelectStore && !approveForm.value.storeId) {
    ElMessage.warning('请选择门店')
    return
  }

  // 验证套餐
  if (!approveForm.value.packageId) {
    ElMessage.warning('请选择套餐')
    return
  }

  // 验证金额
  if (!approveForm.value.finalAmount || approveForm.value.finalAmount <= 0) {
    ElMessage.warning('请输入审批金额')
    return
  }

  approving.value = true
  try {
    // 确定门店ID
    let storeId = approveForm.value.storeId
    // 如果司机已选择门店，使用司机选择的门店ID
    if (fleetConfig.value.allowDriverSelectStore && currentApplication.value?.orderId?.storeId) {
      storeId = currentApplication.value.orderId.storeId
    }

    await approveMaintenanceApplication(currentApplication.value._id, {
      approved: true,
      storeId: storeId,
      packageId: approveForm.value.packageId,
      finalAmount: Math.round(approveForm.value.finalAmount * 100), // 转换为分
      remark: approveForm.value.remark
    })

    const successMessage = fleetConfig.value.allowDriverSelectStore
      ? '审批通过，资金已冻结，订单已发送至司机选择的门店'
      : '审批通过，资金已冻结，订单已分配门店'

    ElMessage.success(successMessage)
    approveDialogVisible.value = false
    fetchApplications()
  } catch (error) {
    console.error('审批失败:', error)
    ElMessage.error(error.response?.data?.message || '审批失败')
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
      remark: rejectForm.value.reason
    })

    ElMessage.success('已拒绝申请')
    rejectDialogVisible.value = false
    fetchApplications()
  } catch (error) {
    console.error('拒绝失败:', error)
    ElMessage.error(error.response?.data?.message || '拒绝失败')
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

// 获取门店名称
const getStoreName = (storeId) => {
  const store = storeList.value.find(s => s._id === storeId)
  return store?.name || '未知门店'
}

// 获取门店地址
const getStoreAddress = (storeId) => {
  const store = storeList.value.find(s => s._id === storeId)
  return store?.address || '未知地址'
}

onMounted(() => {
  fetchFleetConfig()
  fetchApplications()
  fetchStores() // 始终加载门店列表，用于显示司机选择的门店信息
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

  .milestone-photos {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .milestone-photos-dialog {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
