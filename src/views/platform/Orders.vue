<template>
  <div class="platform-orders">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="4">
        <el-card class="stat-card">
          <el-statistic
            title="总订单"
            :value="stats.totalOrders"
          />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="待接单"
            :value="stats.pendingOrders"
          />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-info">
          <el-statistic
            title="维修中"
            :value="stats.repairingOrders"
          />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="已完成"
            :value="stats.completedOrders"
          />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-primary">
          <el-statistic
            title="待初审"
            :value="stats.quotedOrders"
          />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-danger">
          <el-statistic
            title="今日订单"
            :value="stats.todayOrders"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 订单列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>全平台订单监控</span>
          <div class="header-actions">
            <el-dropdown
              split-button
              type="warning"
              size="small"
              :loading="exporting"
              @click="handleExport('filtered')"
            >
              <el-icon><Download /></el-icon>
              导出数据
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleExport('filtered')">
                    导出当前页 ({{ orderList.length }} 条)
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport('all')">
                    导出全部
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              type="primary"
              size="small"
              @click="handleRefresh"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form
        :inline="true"
        class="search-form"
      >
        <el-form-item label="订单状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部"
            clearable
            style="width: 160px"
          >
            <el-option
              label="待车队审批"
              value="awaiting_fleet_approval"
            />
            <el-option
              label="待确认时间"
              value="awaiting_time_confirmation"
            />
            <el-option
              label="待接车检查"
              value="pending_assessment"
            />
            <el-option
              label="待审批报价"
              value="awaiting_approval"
            />
            <el-option
              label="维修中"
              value="in_repair"
            />
            <el-option
              label="增项待审批"
              value="awaiting_addon_approval"
            />
            <el-option
              label="待确认"
              value="pending_confirmation"
            />
            <el-option
              label="已完成"
              value="completed"
            />
            <el-option
              label="已退款"
              value="refunded"
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
            placeholder="订单号/车牌号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
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
          </div>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="orderList"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="orderNumber"
          label="订单号"
          width="180"
          fixed="left"
        />
        <el-table-column
          label="车牌号"
          width="120"
        >
          <template #default="{ row }">
            {{ row.vehicleId?.plateNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="车队"
          width="150"
        >
          <template #default="{ row }">
            {{ row.vehicleId?.fleetId?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="faultDescription"
          label="故障描述"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          label="报价金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span
              v-if="row.quote"
              style="color: #f56c6c; font-weight: 600"
            >
              ¥{{ formatAmount(row.quote.actualTotal || row.quote.total) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="维修门店"
          width="180"
        >
          <template #default="{ row }">
            {{ row.storeId?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          width="110"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
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
              @click="handleViewDetail(row)"
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
        style="margin-top: 20px"
        @size-change="fetchOrders"
        @current-change="fetchOrders"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      width="900px"
    >
      <el-descriptions
        v-if="currentOrder._id"
        :column="2"
        border
      >
        <el-descriptions-item
          label="订单号"
          :span="2"
        >
          {{ currentOrder.orderNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="车牌号">
          {{ currentOrder.vehicleId?.plateNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="车队">
          {{ currentOrder.vehicleId?.fleetId?.name }}
        </el-descriptions-item>
        <el-descriptions-item
          label="故障描述"
          :span="2"
        >
          {{ currentOrder.faultDescription }}
        </el-descriptions-item>
        <el-descriptions-item label="维修门店">
          {{ currentOrder.storeId?.name || '未分配' }}
        </el-descriptions-item>
        <el-descriptions-item label="接单技师">
          {{ currentOrder.technicianId?.nickname || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentOrder.quote"
          label="报价金额"
        >
          <span style="color: #f56c6c; font-weight: 600; font-size: 18px">
            ¥{{ formatAmount(currentOrder.quote.actualTotal || currentOrder.quote.total) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item
          label="创建时间"
          :span="2"
        >
          {{ formatDateTime(currentOrder.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 报价明细 -->
      <template v-if="currentOrder.quote && currentOrder.quote.items">
        <el-divider content-position="left">
          报价明细
        </el-divider>
        <el-table
          :data="currentOrder.quote.items"
          size="small"
          border
        >
          <el-table-column
            prop="item"
            label="项目"
          />
          <el-table-column
            prop="price"
            label="单价"
            width="100"
          >
            <template #default="{ row }">
              ¥{{ formatAmount(row.price) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="quantity"
            label="数量"
            width="80"
          />
          <el-table-column
            label="小计"
            width="100"
          >
            <template #default="{ row }">
              ¥{{ formatAmount(row.price * row.quantity) }}
            </template>
          </el-table-column>
        </el-table>
        <el-row style="margin-top: 10px; text-align: right">
          <el-col :span="24">
            <span style="font-size: 16px">合计：</span>
            <span style="color: #f56c6c; font-size: 20px; font-weight: bold">
              ¥{{ formatAmount(currentOrder.quote.actualTotal || currentOrder.quote.total) }}
            </span>
          </el-col>
        </el-row>
      </template>

      <!-- 维修日志 -->
      <template v-if="currentOrder.logs && currentOrder.logs.length">
        <el-divider content-position="left">
          维修日志
        </el-divider>
        <el-timeline>
          <el-timeline-item
            v-for="log in currentOrder.logs"
            :key="log._id"
            :timestamp="formatDateTime(log.createdAt)"
          >
            {{ log.content }}
            <div
              v-if="log.images && log.images.length"
              style="margin-top: 5px"
            >
              <el-image
                v-for="(img, idx) in log.images"
                :key="idx"
                :src="img"
                style="width: 60px; height: 60px; margin-right: 5px"
                fit="cover"
                :preview-src-list="log.images"
                :initial-index="idx"
              />
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import { getOrders, getOrderDetail, exportOrders } from '@/api/order'
import { getOverview } from '@/api/stats'
import dayjs from 'dayjs'

const loading = ref(false)
const exporting = ref(false)
const orderList = ref([])
const total = ref(0)
const stats = ref({
  totalOrders: 0,
  pendingOrders: 0,
  quotedOrders: 0,
  approvedOrders: 0,
  repairingOrders: 0,
  completedOrders: 0,
  todayOrders: 0
})

const fetchOverviewStats = async () => {
  try {
    const res = await getOverview()
    const overview = res.data || {}

    stats.value = {
      ...stats.value,
      totalOrders: Number(overview.orders?.total ?? 0),
      pendingOrders: Number(overview.orders?.pending ?? 0),
      quotedOrders: Number(overview.orders?.quoted ?? 0),
      repairingOrders: Number(overview.orders?.repairing ?? 0),
      completedOrders: Number(overview.orders?.completed ?? 0),
      todayOrders: Number(overview.orders?.today ?? 0)
    }
  } catch (error) {
    console.error('获取订单概览失败:', error)
  }
}

const queryParams = ref({
  page: 1,
  limit: 20,
  status: '',
  keyword: ''
})

const detailDialogVisible = ref(false)
const currentOrder = ref({})

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrders(queryParams.value)
    orderList.value = res.data.orders || []
    total.value = res.data.total || 0

    // 计算统计数据
    fetchOverviewStats()
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 计算统计数据
const calculateStats = (orders) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  stats.value = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'awaiting_fleet_approval').length,
    quotedOrders: orders.filter(o => o.status === 'awaiting_fleet_approval').length,
    approvedOrders: orders.filter(o => o.status === 'awaiting_approval').length,
    repairingOrders: orders.filter(o => o.status === 'in_repair').length,
    pendingConfirmationOrders: orders.filter(o => o.status === 'pending_confirmation').length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    todayOrders: orders.filter(o => new Date(o.createdAt) >= today).length
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
    status: '',
    keyword: ''
  }
  fetchOrders()
}

// 刷新
const handleRefresh = () => {
  fetchOrders()
}

// 导出订单列表
const handleExport = async (type = 'all') => {
  exporting.value = true
  try {
    const params = {}
    if (type === 'filtered') {
      // 导出当前页数据（支持筛选）
      if (queryParams.value.status) params.status = queryParams.value.status
      if (queryParams.value.keyword) params.keyword = queryParams.value.keyword
      params.limit = orderList.value.length
    } else {
      // 导出全部数据（支持筛选）
      if (queryParams.value.status) params.status = queryParams.value.status
      if (queryParams.value.keyword) params.keyword = queryParams.value.keyword
      params.all = 'true'
    }

    const response = await exportOrders(params)
    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `订单列表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

// 查看详情
const handleViewDetail = async (row) => {
  try {
    const res = await getOrderDetail(row._id)
    currentOrder.value = res.data
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'awaiting_fleet_approval': 'info',
    'awaiting_time_confirmation': 'info',
    'pending_assessment': 'warning',
    'awaiting_approval': 'warning',
    'in_repair': 'primary',
    'awaiting_addon_approval': 'warning',
    'pending_confirmation': 'warning',
    'completed': 'success',
    'refunded': 'info',
    'rejected': 'danger'
  }
  return typeMap[status] || ''
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
    'refunded': '已退款',
    'rejected': '已拒绝'
  }
  return textMap[status] || status
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 格式化日期时间
const formatDateTime = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return (Number(amount) / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped lang="scss">
.platform-orders {
  .stat-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.stat-card-warning :deep(.el-statistic__number) {
      color: #e6a23c;
    }

    &.stat-card-info :deep(.el-statistic__number) {
      color: #909399;
    }

    &.stat-card-success :deep(.el-statistic__number) {
      color: #67c23a;
    }

    &.stat-card-primary :deep(.el-statistic__number) {
      color: #409eff;
    }

    &.stat-card-danger :deep(.el-statistic__number) {
      color: #f56c6c;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .search-form {
    margin-bottom: 20px;

    .form-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}
</style>
