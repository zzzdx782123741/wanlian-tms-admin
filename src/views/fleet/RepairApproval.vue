<template>
  <div class="repair-approval">
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
          <span>待审批维修申请</span>
          <el-button
            type="primary"
            size="small"
            @click="fetchOrders"
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
              value="awaiting_fleet_approval"
            />
            <el-option
              label="已审批"
              value="awaiting_time_confirmation"
            />
            <el-option
              label="已拒绝"
              value="rejected"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="车牌号/订单号"
            clearable
            style="width: 200px"
          />
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
        :data="orders"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="orderNumber"
          label="订单号"
          width="180"
        />
        <el-table-column
          label="车辆"
          width="150"
        >
          <template #default="{ row }">
            {{ row.vehicleId?.plateNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="vehicleId.brand"
          label="品牌"
          width="100"
        />
        <el-table-column
          prop="vehicleId.model"
          label="车型"
          width="120"
        />
        <el-table-column
          label="故障描述"
          width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.faultDescription || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="当前里程"
          width="100"
          align="right"
        >
          <template #default="{ row }">
            {{ row.milestone || '-' }} km
          </template>
        </el-table-column>
        <el-table-column
          label="报修人"
          width="100"
        >
          <template #default="{ row }">
            {{ row.reporterId?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="联系电话"
          width="130"
        >
          <template #default="{ row }">
            {{ row.reporterId?.phone || '-' }}
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
          width="180"
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
            <el-button
              size="small"
              link
              @click="viewDetail(row)"
            >
              详情
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
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchOrders"
        @current-change="fetchOrders"
      />
    </el-card>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="审批维修申请"
      width="700px"
    >
      <div v-if="currentOrder">
        <!-- 订单基本信息 -->
        <el-descriptions
          :column="2"
          border
          style="margin-bottom: 20px"
        >
          <el-descriptions-item label="订单号">
            {{ currentOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="车牌号">
            {{ currentOrder.vehicleId?.plateNumber }}
          </el-descriptions-item>
          <el-descriptions-item
            label="品牌型号"
            :span="2"
          >
            {{ currentOrder.vehicleId?.brand }} {{ currentOrder.vehicleId?.model }}
          </el-descriptions-item>
          <el-descriptions-item
            label="故障描述"
            :span="2"
          >
            {{ currentOrder.faultDescription }}
          </el-descriptions-item>
          <el-descriptions-item label="当前里程">
            {{ currentOrder.milestone || '-' }} km
          </el-descriptions-item>
          <el-descriptions-item label="报修人">
            {{ currentOrder.reporterId?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentOrder.reporterId?.phone }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(currentOrder.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 里程照片 -->
        <div
          v-if="currentOrder.milestonePhotos && currentOrder.milestonePhotos.length > 0"
          style="margin-bottom: 20px"
        >
          <div style="margin-bottom: 8px; font-weight: 600;">
            里程照片：
          </div>
          <el-image
            v-for="(photo, index) in currentOrder.milestonePhotos"
            :key="index"
            :src="photo"
            :preview-src-list="currentOrder.milestonePhotos"
            :initial-index="index"
            fit="cover"
            style="width: 100px; height: 100px; margin-right: 8px; border-radius: 4px; cursor: pointer;"
          />
        </div>

        <!-- 故障图片 -->
        <div
          v-if="currentOrder.faultImages && currentOrder.faultImages.length > 0"
          style="margin-bottom: 20px"
        >
          <div style="margin-bottom: 8px; font-weight: 600;">
            故障图片：
          </div>
          <el-image
            v-for="(photo, index) in currentOrder.faultImages"
            :key="index"
            :src="photo"
            :preview-src-list="currentOrder.faultImages"
            :initial-index="index"
            fit="cover"
            style="width: 100px; height: 100px; margin-right: 8px; border-radius: 4px; cursor: pointer;"
          />
        </div>

        <!-- 车队配置信息 -->
        <el-alert
          title="车队配置"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <div>门店选择模式：{{ fleetConfig.allowDriverSelectStore ? '司机自选门店' : '车队分配门店' }}</div>
        </el-alert>

        <!-- 司机已选择的门店信息 -->
        <el-alert
          v-if="fleetConfig.allowDriverSelectStore && currentOrder?.storeId"
          title="司机选择的门店"
          type="success"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <div>门店名称：{{ getStoreName(currentOrder.storeId) }}</div>
          <div>门店地址：{{ getStoreAddress(currentOrder.storeId) }}</div>
        </el-alert>

        <!-- 选择门店（仅当车队分配门店时显示） -->
        <el-form
          v-if="!fleetConfig.allowDriverSelectStore"
          :model="approveForm"
          label-width="100px"
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
            >
              <el-option
                v-for="store in storeList"
                :key="store._id"
                :label="`${store.name}（${store.address}）`"
                :value="store._id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="审批备注">
            <el-input
              v-model="approveForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入审批备注（可选）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="approveDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="approving"
          :disabled="!canApprove"
          @click="confirmApprove"
        >
          确认审批
        </el-button>
      </template>
    </el-dialog>

    <!-- 拒绝对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝维修申请"
      width="500px"
    >
      <el-form
        :model="rejectForm"
        label-width="100px"
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

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      width="800px"
    >
      <div v-if="currentOrder">
        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="订单号">
            {{ currentOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(currentOrder.status)">
              {{ getStatusText(currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="车牌号">
            {{ currentOrder.vehicleId?.plateNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="品牌型号">
            {{ currentOrder.vehicleId?.brand }} {{ currentOrder.vehicleId?.model }}
          </el-descriptions-item>
          <el-descriptions-item
            label="车辆类型"
            :span="2"
          >
            {{ currentOrder.vehicleId?.vehicleType || '-' }}
          </el-descriptions-item>
          <el-descriptions-item
            label="VIN码"
            :span="2"
          >
            {{ currentOrder.vehicleId?.vin || '-' }}
          </el-descriptions-item>
          <el-descriptions-item
            label="故障描述"
            :span="2"
          >
            {{ currentOrder.faultDescription }}
          </el-descriptions-item>
          <el-descriptions-item label="当前里程">
            {{ currentOrder.milestone || '-' }} km
          </el-descriptions-item>
          <el-descriptions-item label="报修人">
            {{ currentOrder.reporterId?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentOrder.reporterId?.phone }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(currentOrder.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.milestonePhotos?.length > 0"
            label="里程照片"
            :span="2"
          >
            <el-image
              v-for="(img, idx) in currentOrder.milestonePhotos"
              :key="idx"
              :src="img"
              :preview-src-list="currentOrder.milestonePhotos"
              style="width: 80px; height: 80px; margin-right: 8px;"
              fit="cover"
            />
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.faultImages?.length > 0"
            label="故障图片"
            :span="2"
          >
            <el-image
              v-for="(img, idx) in currentOrder.faultImages"
              :key="idx"
              :src="img"
              :preview-src-list="currentOrder.faultImages"
              style="width: 80px; height: 80px; margin-right: 8px;"
              fit="cover"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getStores } from '@/api/store'
import { getFleetConfig } from '@/api/fleet'
import dayjs from 'dayjs'

const loading = ref(false)
const approving = ref(false)
const rejecting = ref(false)
const orders = ref([])
const storeList = ref([])
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
  status: 'awaiting_fleet_approval',
  keyword: ''
})

const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentOrder = ref(null)

const approveForm = ref({
  storeId: null,
  remark: ''
})

const rejectForm = ref({
  reason: ''
})

const fleetConfig = ref({
  allowDriverSelectStore: false,
  maintenanceProductPermission: 'fleet_control'
})

// 获取用户车队ID
const userFleetId = computed(() => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  return userInfo.fleetInfo?.fleetId
})

// 是否可以审批
const canApprove = computed(() => {
  if (fleetConfig.value.allowDriverSelectStore) {
    // 司机自选门店，不需要选择
    return true
  } else {
    // 车队分配门店，必须选择门店
    return !!approveForm.value.storeId
  }
})

// 获取门店名称
const getStoreName = (storeId) => {
  const store = storeList.value.find(s => s._id === storeId)
  return store?.name || '-'
}

// 获取门店地址
const getStoreAddress = (storeId) => {
  const store = storeList.value.find(s => s._id === storeId)
  return store?.address || '-'
}

// 获取车队配置
const fetchFleetConfig = async () => {
  try {
    const res = await getFleetConfig(userFleetId.value)
    fleetConfig.value = res.data.fleet || {}
  } catch (error) {
    console.error('获取车队配置失败:', error)
  }
}

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      status: queryParams.value.status || undefined,
      page: queryParams.value.page,
      limit: queryParams.value.limit
    }

    if (queryParams.value.keyword) {
      params.keyword = queryParams.value.keyword
    }

    const res = await request({
      url: '/orders/fleet/pending',
      method: 'get',
      params
    })

    orders.value = res.data.orders || []
    total.value = res.data.total || 0

    stats.value = {
      ...stats.value,
      ...(res.data.stats || {})
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
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

// 查询
const handleQuery = () => {
  queryParams.value.page = 1
  fetchOrders()
}

// 重置
const handleReset = () => {
  queryParams.value = {
    page: 1,
    limit: 20,
    status: 'awaiting_fleet_approval',
    keyword: ''
  }
  fetchOrders()
}

// 审批
const handleApprove = async (order) => {
  currentOrder.value = order
  approveForm.value = {
    storeId: order.storeId || null,
    remark: ''
  }

  // 获取车队配置
  await fetchFleetConfig()

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
    const data = {
      storeId: approveForm.value.storeId,
      remark: approveForm.value.remark
    }

    await request({
      url: `/orders/${currentOrder.value._id}/fleet-approve`,
      method: 'post',
      data
    })

    ElMessage.success('审批成功')
    approveDialogVisible.value = false
    fetchOrders()
  } catch (error) {
    console.error('审批失败:', error)
    ElMessage.error(error.response?.data?.message || '审批失败')
  } finally {
    approving.value = false
  }
}

// 拒绝
const handleReject = async (order) => {
  currentOrder.value = order
  rejectForm.value = { reason: '' }
  rejectDialogVisible.value = true
}

// 确认拒绝
const confirmReject = async () => {
  rejecting.value = true
  try {
    await request({
      url: `/orders/${currentOrder.value._id}/fleet-reject`,
      method: 'post',
      data: { reason: rejectForm.value.reason }
    })

    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    fetchOrders()
  } catch (error) {
    console.error('拒绝失败:', error)
    ElMessage.error(error.response?.data?.message || '拒绝失败')
  } finally {
    rejecting.value = false
  }
}

// 查看详情
const viewDetail = (order) => {
  currentOrder.value = order
  detailDialogVisible.value = true
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'awaiting_fleet_approval': 'warning',
    'awaiting_time_confirmation': 'info',
    'pending_assessment': 'info',
    'awaiting_approval': 'warning',
    'in_repair': 'primary',
    'pending_confirmation': 'warning',
    'completed': 'success',
    'rejected': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'awaiting_fleet_approval': '待车队审批',
    'awaiting_time_confirmation': '待确认时间',
    'pending_assessment': '待接车检查',
    'awaiting_approval': '待审批报价',
    'in_repair': '维修中',
    'awaiting_addon_approval': '增项待审批',
    'pending_confirmation': '待确认',
    'completed': '已完成',
    'rejected': '已拒绝'
  }
  return textMap[status] || status
}

// 格式化日期时间
const formatDateTime = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  fetchOrders()
  fetchFleetConfig()
})
</script>

<style scoped lang="scss">
.repair-approval {
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
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;
  }

  .search-form {
    margin-bottom: 20px;
  }
}
</style>
