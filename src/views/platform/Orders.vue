<template>
  <div class="platform-orders">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="4">
        <el-card class="stat-card">
          <el-statistic title="总订单" :value="stats.totalOrders" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-warning">
          <el-statistic title="待接单" :value="stats.pendingOrders" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-info">
          <el-statistic title="维修中" :value="stats.repairingOrders" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-success">
          <el-statistic title="已完成" :value="stats.completedOrders" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-primary">
          <el-statistic title="待初审" :value="stats.quotedOrders" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-danger">
          <el-statistic title="今日订单" :value="stats.todayOrders" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 订单列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>全平台订单监控</span>
          <div class="header-actions">
            <el-dropdown split-button type="warning" size="small" @click="handleExport('filtered')" :loading="exporting">
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
            <el-button type="primary" size="small" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="订单状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待车队审批" value="awaiting_fleet_approval" />
            <el-option label="待评估" value="pending_assessment" />
            <el-option label="待审批" value="awaiting_approval" />
            <el-option label="维修中" value="in_repair" />
            <el-option label="已完成" value="completed" />
            <el-option label="已拒绝" value="rejected" />
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
            <el-button type="primary" @click="handleQuery">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset">重置</el-button>
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
        <el-table-column prop="orderNumber" label="订单号" width="180" fixed="left" />
        <el-table-column label="车牌号" width="120">
          <template #default="{ row }">
            {{ row.vehicleId?.plateNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="车队" width="150">
          <template #default="{ row }">
            {{ row.vehicleId?.fleetId?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="faultDescription" label="故障描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="报价金额" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.quote" style="color: #f56c6c; font-weight: 600">
              ¥{{ row.quote.total }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="维修门店" width="180">
          <template #default="{ row }">
            {{ row.storeId?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="110">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="row.status === 'awaiting_fleet_approval'"
              type="success"
              size="small"
              link
              @click="handleApprove(row)"
            >
              审批
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
      <el-descriptions v-if="currentOrder._id" :column="2" border>
        <el-descriptions-item label="订单号" :span="2">
          {{ currentOrder.orderNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="车牌号">
          {{ currentOrder.vehicleId?.plateNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="车队">
          {{ currentOrder.vehicleId?.fleetId?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">
          {{ currentOrder.faultDescription }}
        </el-descriptions-item>
        <el-descriptions-item label="维修门店">
          {{ currentOrder.storeId?.name || '未分配' }}
        </el-descriptions-item>
        <el-descriptions-item label="接单技师">
          {{ currentOrder.technicianId?.nickname || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="报价金额" v-if="currentOrder.quote">
          <span style="color: #f56c6c; font-weight: 600; font-size: 18px">
            ¥{{ currentOrder.quote.total }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatDateTime(currentOrder.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 报价明细 -->
      <template v-if="currentOrder.quote && currentOrder.quote.items">
        <el-divider content-position="left">报价明细</el-divider>
        <el-table :data="currentOrder.quote.items" size="small" border>
          <el-table-column prop="item" label="项目" />
          <el-table-column prop="price" label="单价" width="100">
            <template #default="{ row }">
              ¥{{ row.price }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column label="小计" width="100">
            <template #default="{ row }">
              ¥{{ row.price * row.quantity }}
            </template>
          </el-table-column>
        </el-table>
        <el-row style="margin-top: 10px; text-align: right">
          <el-col :span="24">
            <span style="font-size: 16px">合计：</span>
            <span style="color: #f56c6c; font-size: 20px; font-weight: bold">
              ¥{{ currentOrder.quote.total }}
            </span>
          </el-col>
        </el-row>
      </template>

      <!-- 维修日志 -->
      <template v-if="currentOrder.logs && currentOrder.logs.length">
        <el-divider content-position="left">维修日志</el-divider>
        <el-timeline>
          <el-timeline-item
            v-for="log in currentOrder.logs"
            :key="log._id"
            :timestamp="formatDateTime(log.createdAt)"
          >
            {{ log.content }}
            <div v-if="log.images && log.images.length" style="margin-top: 5px">
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

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="订单初审"
      width="600px"
    >
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="订单号">
          <el-input :value="currentOrder.orderNumber" disabled />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input :value="currentOrder.vehicleId?.plateNumber" disabled />
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input
            :value="currentOrder.faultDescription"
            type="textarea"
            :rows="2"
            disabled
          />
        </el-form-item>
        <el-form-item label="报价金额">
          <el-input :value="`¥${currentOrder.quote?.total || 0}`" disabled>
            <template #prepend>总计</template>
          </el-input>
        </el-form-item>
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.approved">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import { getOrders, getOrderDetail, approveQuote, exportOrders } from '@/api/order'
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

const queryParams = ref({
  page: 1,
  limit: 20,
  status: '',
  keyword: ''
})

const detailDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const currentOrder = ref({})
const approveForm = ref({
  approved: true,
  remark: ''
})

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrders(queryParams.value)
    orderList.value = res.data.orders || []
    total.value = res.data.total || 0

    // 计算统计数据
    calculateStats(orderList.value)
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
    completedOrders: orders.filter(o => ['completed', 'confirmed'].includes(o.status)).length,
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

// 审批
const handleApprove = (row) => {
  currentOrder.value = row
  approveForm.value = {
    approved: true,
    remark: ''
  }
  approveDialogVisible.value = true
}

// 确认审批
const confirmApprove = async () => {
  try {
    await approveQuote(currentOrder.value._id, approveForm.value)
    ElMessage.success('审批成功')
    approveDialogVisible.value = false
    fetchOrders()
  } catch (error) {
    console.error('审批失败:', error)
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'awaiting_fleet_approval': 'info',
    'pending_assessment': 'warning',
    'awaiting_approval': 'warning',
    'in_repair': 'primary',
    'awaiting_addon_approval': 'warning',
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
    'pending_assessment': '待评估',
    'awaiting_approval': '待审批',
    'in_repair': '维修中',
    'awaiting_addon_approval': '增项待审批',
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
