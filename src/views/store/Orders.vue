<template>
  <div class="store-orders">
    <div class="page-header">
      <h2>门店订单</h2>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="待接车" :value="stats.pending_assessment" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic title="待报价" :value="stats.awaiting_approval" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-primary">
          <el-statistic title="维修中" :value="stats.in_repair" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic title="本月完成" :value="stats.completed_this_month" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="订单状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="loadOrders">
            <el-option label="全部状态" value=""></el-option>
            <el-option label="待接车" value="pending_assessment"></el-option>
            <el-option label="待报价" value="awaiting_approval"></el-option>
            <el-option label="维修中" value="in_repair"></el-option>
            <el-option label="增项待审批" value="awaiting_addon_approval"></el-option>
            <el-option label="待确认" value="completed"></el-option>
            <el-option label="已拒绝" value="rejected"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable @change="loadOrders">
            <el-option label="全部类型" value=""></el-option>
            <el-option label="维修订单" value="repair"></el-option>
            <el-option label="保养订单" value="maintenance"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadOrders"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadOrders">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card">
      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="orderNumber" label="订单号" width="180" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'repair' ? '' : 'success'" size="small">
              {{ row.type === 'repair' ? '维修' : '保养' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="车辆" width="150">
          <template #default="{ row }">
            {{ row.vehicleId?.plateNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="报修人" width="120">
          <template #default="{ row }">
            {{ row.reporterId?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="故障描述" min-width="200">
          <template #default="{ row }">
            {{ row.faultDescription || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="报价金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">{{ row.quote?.total ? '¥' + formatAmount(row.quote.total) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending_assessment'"
              link
              type="primary"
              size="small"
              @click="handleReceive(row)"
            >
              接车
            </el-button>
            <el-button
              v-if="row.status === 'in_repair'"
              link
              type="success"
              size="small"
              @click="handleComplete(row)"
            >
              完工
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadOrders"
        @current-change="loadOrders"
        class="pagination"
      />
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="900px">
      <el-descriptions v-if="currentOrder" :column="2" border>
        <el-descriptions-item label="订单号">{{ currentOrder.orderNumber }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">
          <el-tag :type="currentOrder.type === 'repair' ? '' : 'success'">
            {{ currentOrder.type === 'repair' ? '维修订单' : '保养订单' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentOrder.vehicleId?.plateNumber }}</el-descriptions-item>
        <el-descriptions-item label="品牌型号">
          {{ currentOrder.vehicleId?.brand }} {{ currentOrder.vehicleId?.model }}
        </el-descriptions-item>
        <el-descriptions-item label="报修人">{{ currentOrder.reporterId?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.reporterId?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">
          {{ currentOrder.appointmentAt ? formatDate(currentOrder.appointmentAt) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="当前里程">
          {{ currentOrder.milestone ? currentOrder.milestone + ' 公里' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">
          {{ currentOrder.faultDescription }}
        </el-descriptions-item>
        <el-descriptions-item label="接车检查" :span="2" v-if="currentOrder.receiveCheck">
          <div><strong>检查里程：</strong>{{ currentOrder.receiveCheck.mileage || '-' }} 公里</div>
          <div><strong>诊断结果：</strong>{{ currentOrder.receiveCheck.diagnosis || '-' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="报价信息" :span="2" v-if="currentOrder.quote">
          <div><strong>报价总额：</strong>
            <span class="total-amount">¥{{ formatAmount(currentOrder.quote.total) }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusColor(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(currentOrder.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const orders = ref([])
const detailVisible = ref(false)
const currentOrder = ref(null)

const filters = reactive({
  status: '',
  type: '',
  startDate: '',
  endDate: ''
})

const dateRange = ref([])

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const stats = reactive({
  pending_assessment: 0,
  awaiting_approval: 0,
  in_repair: 0,
  completed_this_month: 0
})

onMounted(() => {
  loadOrders()
})

// 加载订单列表
async function loadOrders() {
  try {
    loading.value = true

    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }

    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await request({
      url: '/store/orders',
      method: 'get',
      params
    })

    orders.value = res.data.list || []
    pagination.total = res.data.total || 0
    Object.assign(stats, res.data.stats || {})
  } catch (error) {
    ElMessage.error(error.message || '加载订单列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
function resetFilters() {
  Object.assign(filters, {
    status: '',
    type: ''
  })
  dateRange.value = []
  pagination.page = 1
  loadOrders()
}

// 查看详情
function viewDetail(row) {
  currentOrder.value = row
  detailVisible.value = true
}

// 接车检查
function handleReceive(row) {
  // 跳转到接车检查页面或打开接车对话框
  ElMessage.info('接车检查功能开发中')
}

// 完工
function handleComplete(row) {
  // 跳转到完工页面或打开完工对话框
  ElMessage.info('完工功能开发中')
}

// 辅助函数
function getStatusText(status) {
  const map = {
    pending_assessment: '待接车',
    awaiting_approval: '待报价',
    in_repair: '维修中',
    awaiting_addon_approval: '增项待审批',
    completed: '待确认',
    refunded: '已退款',
    rejected: '已拒绝'
  }
  return map[status] || '未知'
}

function getStatusColor(status) {
  const map = {
    pending_assessment: 'warning',
    awaiting_approval: '',
    in_repair: 'primary',
    awaiting_addon_approval: 'warning',
    completed: 'success',
    refunded: 'info',
    rejected: 'danger'
  }
  return map[status] || ''
}

function formatAmount(amount) {
  if (!amount) return '0.00'
  return parseFloat(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.store-orders {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card :deep(.el-statistic__number) {
  color: #409EFF;
}

.stat-card-warning :deep(.el-statistic__number) {
  color: #E6A23C;
}

.stat-card-primary :deep(.el-statistic__number) {
  color: #409EFF;
}

.stat-card-success :deep(.el-statistic__number) {
  color: #67C23A;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.amount {
  color: #F56C6C;
  font-weight: 600;
}

.total-amount {
  color: #F56C6C;
  font-size: 18px;
  font-weight: bold;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
