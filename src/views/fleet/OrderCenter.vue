<template>
  <div class="order-center-page">
    <div class="page-header">
      <h2>订单中心</h2>
      <el-button
        type="primary"
        :loading="exporting"
        @click="exportExcel"
      >
        <el-icon><Download /></el-icon>
        导出Excel
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row
      :gutter="20"
      class="stats-row"
    >
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="维修订单"
            :value="statistics.repairCount || 0"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="保养订单"
            :value="statistics.maintenanceCount || 0"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="已完成"
            :value="statistics.completedCount || 0"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-info">
          <el-statistic
            title="总花费"
            :value="formatAmount(statistics.totalSpent || 0)"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form
        :inline="true"
        :model="filters"
        label-width="80px"
      >
        <el-form-item label="车牌号">
          <el-select
            v-model="filters.vehicleId"
            placeholder="全部车辆"
            clearable
            filterable
            style="width: 220px"
            @change="loadOrders"
          >
            <el-option
              v-for="vehicle in vehicles"
              :key="vehicle._id"
              :label="`${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model}`"
              :value="vehicle._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select
            v-model="filters.orderType"
            placeholder="全部类型"
            clearable
            style="width: 160px"
            @change="loadOrders"
          >
            <el-option
              label="全部类型"
              value=""
            />
            <el-option
              label="维修订单"
              value="repair"
            />
            <el-option
              label="保养订单"
              value="maintenance"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            style="width: 180px"
            @change="loadOrders"
          >
            <el-option
              label="全部状态"
              value=""
            />
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
              label="已拒绝"
              value="rejected"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="门店">
          <el-select
            v-model="filters.storeId"
            placeholder="全部门店"
            clearable
            filterable
            style="width: 220px"
            @change="loadOrders"
          >
            <el-option
              v-for="store in stores"
              :key="store._id"
              :label="store.name"
              :value="store._id"
            />
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
          <el-button
            type="primary"
            @click="loadOrders"
          >
            查询
          </el-button>
          <el-button @click="resetFilters">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="orders"
        stripe
      >
        <el-table-column
          prop="orderNumber"
          label="订单号"
          width="180"
        />
        <el-table-column
          label="类型"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getOrderTypeColor(row.type)"
              size="small"
            >
              {{ getOrderTypeText(row.type) }}
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
          label="门店"
          width="150"
        >
          <template #default="{ row }">
            {{ row.storeId?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="故障/问题描述"
          min-width="200"
        >
          <template #default="{ row }">
            <div class="problem-desc">
              {{ row.faultDescription || '-' }}
            </div>
            <div
              v-if="row.receiveCheck?.diagnosis"
              class="diagnosis"
            >
              诊断：{{ row.receiveCheck.diagnosis }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="报价金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span class="amount">{{ row.quote?.total ? '¥' + formatAmount(row.quote.total) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusColor(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="创建时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="120"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="viewDetail(row)"
            >
              详情
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
        class="pagination"
        @size-change="loadOrders"
        @current-change="loadOrders"
      />
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="900px"
    >
      <el-descriptions
        v-if="currentOrder"
        :column="2"
        border
      >
        <el-descriptions-item label="订单号">
          {{ currentOrder.orderNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="订单类型">
          <el-tag :type="getOrderTypeColor(currentOrder.type)">
            {{ getOrderTypeText(currentOrder.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车牌号">
          {{ currentOrder.vehicleId?.plateNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="品牌型号">
          {{ currentOrder.vehicleId?.brand }} {{ currentOrder.vehicleId?.model }}
        </el-descriptions-item>
        <el-descriptions-item label="维修门店">
          {{ currentOrder.storeId?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="报修人">
          {{ currentOrder.reporterId?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ currentOrder.reporterId?.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="预约时间">
          {{ currentOrder.appointmentAt ? formatDate(currentOrder.appointmentAt) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="当前里程">
          {{ currentOrder.milestone ? currentOrder.milestone + ' 公里' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="故障描述"
          :span="2"
        >
          {{ currentOrder.faultDescription }}
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
            style="width: 100px; height: 100px; margin-right: 10px;"
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
            style="width: 100px; height: 100px; margin-right: 10px;"
            fit="cover"
          />
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentOrder.receiveCheck"
          label="接车检查"
          :span="2"
        >
          <div><strong>检查里程：</strong>{{ currentOrder.receiveCheck.mileage || '-' }} 公里</div>
          <div><strong>诊断结果：</strong>{{ currentOrder.receiveCheck.diagnosis || '-' }}</div>
          <div><strong>接车照片：</strong></div>
          <el-image
            v-for="(img, idx) in currentOrder.receiveCheck.checkinPhotos || []"
            :key="idx"
            :src="img"
            :preview-src-list="currentOrder.receiveCheck.checkinPhotos || []"
            style="width: 100px; height: 100px; margin-right: 10px;"
            fit="cover"
          />
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentOrder.quote"
          label="报价信息"
          :span="2"
        >
          <div><strong>报价项目：</strong></div>
          <el-table
            :data="currentOrder.quote.items"
            size="small"
            border
          >
            <el-table-column
              prop="item"
              label="项目名称"
            />
            <el-table-column
              prop="price"
              label="单价"
              width="100"
            >
              <template #default="{ row }">
                ¥{{ row.price }}
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
                ¥{{ (row.price * row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 10px;">
            <strong>报价总额：</strong>
            <span class="total-amount">¥{{ formatAmount(currentOrder.quote.total) }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentOrder.completion"
          label="完工信息"
          :span="2"
        >
          <div><strong>完工说明：</strong>{{ currentOrder.completion.description || '-' }}</div>
          <div><strong>完工照片：</strong></div>
          <el-image
            v-for="(img, idx) in currentOrder.completion.images || []"
            :key="idx"
            :src="img"
            :preview-src-list="currentOrder.completion.images || []"
            style="width: 100px; height: 100px; margin-right: 10px;"
            fit="cover"
          />
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusColor(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(currentOrder.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDate(currentOrder.updatedAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getOrderCenter, exportOrderCenter } from '@/api/orderCenter'

// 响应式数据
const loading = ref(false)
const exporting = ref(false)
const orders = ref([])
const detailVisible = ref(false)
const currentOrder = ref(null)

const filters = reactive({
  vehicleId: '',
  orderType: '',
  status: '',
  storeId: '',
  startDate: '',
  endDate: ''
})

const dateRange = ref([])

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const vehicles = ref([])
const stores = ref([])

const statistics = reactive({
  repairCount: 0,
  maintenanceCount: 0,
  completedCount: 0,
  totalSpent: 0
})

// 生命周期
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

    const res = await getOrderCenter(params)
    orders.value = res.data.list || []
    vehicles.value = res.data.vehicles || []
    stores.value = res.data.stores || []
    Object.assign(statistics, res.data.statistics || {})
    pagination.total = res.data.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载订单列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
function resetFilters() {
  Object.assign(filters, {
    vehicleId: '',
    orderType: '',
    status: '',
    storeId: ''
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

// 导出Excel
async function exportExcel() {
  try {
    exporting.value = true

    const params = {
      ...filters,
      exportExcel: 'true'
    }

    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const blob = await exportOrderCenter(params, {
      responseType: 'blob'
    })

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `订单记录_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

// 辅助函数
function getOrderTypeText(type) {
  const map = {
    repair: '维修订单',
    maintenance: '保养订单',
    product: '商品订单'
  }
  return map[type] || '未知'
}

function getOrderTypeColor(type) {
  const map = {
    repair: '',
    maintenance: 'success',
    product: 'warning'
  }
  return map[type] || ''
}

function getStatusText(status) {
  const map = {
    awaiting_fleet_approval: '待车队审批',
    awaiting_time_confirmation: '待确认时间',
    pending_assessment: '待接车检查',
    awaiting_approval: '待审批报价',
    in_repair: '维修中',
    awaiting_addon_approval: '增项待审批',
    pending_confirmation: '待确认',
    completed: '已完成',
    refunded: '已退款',
    rejected: '已拒绝'
  }
  return map[status] || '未知'
}

function getStatusColor(status) {
  const map = {
    awaiting_fleet_approval: 'warning',
    awaiting_time_confirmation: 'info',
    pending_assessment: 'info',
    awaiting_approval: 'warning',
    in_repair: 'primary',
    awaiting_addon_approval: 'warning',
    pending_confirmation: 'warning',
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
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.order-center-page {
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

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.problem-desc {
  font-size: 14px;
  color: #606266;
}

.diagnosis {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
  padding: 8px 12px;
  background: #F5F7FA;
  border-radius: 4px;
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
