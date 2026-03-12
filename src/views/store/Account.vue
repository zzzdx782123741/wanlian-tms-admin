<template>
  <div class="store-account-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="账户余额"
            :value="account.balance"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="本月收入"
            :value="stats.monthlyIncome"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="待结算金额"
            :value="stats.pendingSettlement"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-info">
          <el-statistic
            title="本月订单数"
            :value="stats.monthlyOrders"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 收入明细 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>服务收入明细</span>
          <div class="header-actions">
            <el-button
              type="success"
              size="small"
              @click="handleExportIncome"
            >
              <el-icon><Download /></el-icon>
              导出
            </el-button>
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
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button
              type="primary"
              @click="handleSearch"
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
        :data="incomeList"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="orderNumber"
          label="订单号"
          width="180"
        />
        <el-table-column
          label="服务类型"
          width="150"
        >
          <template #default="{ row }">
            <el-tag size="small">
              {{ row.serviceType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="amount"
          label="收入金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: 600">
              ¥{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="platformFee"
          label="平台费"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span style="color: #f56c6c">
              -¥{{ row.platformFee.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="actualAmount"
          label="实际到账"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: 600">
              ¥{{ row.actualAmount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="结算状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getSettlementStatusType(row.status)"
              size="small"
            >
              {{ getSettlementStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="结算日期"
          width="120"
        >
          <template #default="{ row }">
            {{ row.settlementDate ? formatDate(row.settlementDate) : '-' }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchIncomeList"
        @current-change="fetchIncomeList"
      />
    </el-card>

    <!-- 结算记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>结算记录</span>
          <div class="header-actions">
            <el-button
              type="success"
              size="small"
              @click="handleExportSettlements"
            >
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="fetchSettlements"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="settlementList"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="settlementNumber"
          label="结算批次号"
          width="180"
        />
        <el-table-column
          label="结算周期"
          width="150"
        >
          <template #default="{ row }">
            {{ row.startDate }} 至 {{ row.endDate }}
          </template>
        </el-table-column>
        <el-table-column
          prop="orderCount"
          label="订单数量"
          width="100"
          align="center"
        />
        <el-table-column
          prop="totalAmount"
          label="总金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="platformFee"
          label="平台费"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ row.platformFee.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="storeIncome"
          label="门店收入"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: 600">
              ¥{{ row.storeIncome.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getSettlementStatusType(row.status)"
              size="small"
            >
              {{ getSettlementStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="结算日期"
          width="120"
        >
          <template #default="{ row }">
            {{ row.settlementDate ? formatDate(row.settlementDate) : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="100"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              @click="viewSettlementDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="settlementPagination.page"
        v-model:page-size="settlementPagination.limit"
        :total="settlementPagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchSettlements"
        @current-change="fetchSettlements"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import { getStoreAccount, getStoreIncome, getStoreSettlements, exportStoreIncome, exportStoreSettlements } from '@/api/store'
import dayjs from 'dayjs'

const loading = ref(false)
const dateRange = ref([])
const incomeList = ref([])
const settlementList = ref([])

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

const settlementPagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

const account = ref({
  balance: 0
})

const stats = ref({
  monthlyIncome: 0,
  pendingSettlement: 0,
  monthlyOrders: 0
})

// 获取账户信息
const fetchAccount = async () => {
  try {
    const res = await getStoreAccount()
    account.value = res.data.account
    stats.value = res.data.stats
  } catch (error) {
    console.error('获取账户信息失败:', error)
    ElMessage.error('获取账户信息失败')
  }
}

// 获取收入明细
const fetchIncomeList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await getStoreIncome(params)
    incomeList.value = res.data.incomes || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    console.error('获取收入明细失败:', error)
    ElMessage.error('获取收入明细失败')
  } finally {
    loading.value = false
  }
}

// 获取结算记录
const fetchSettlements = async () => {
  loading.value = true
  try {
    const res = await getStoreSettlements({
      page: settlementPagination.value.page,
      limit: settlementPagination.value.limit
    })
    settlementList.value = res.data.settlements || []
    settlementPagination.value.total = res.data.total || 0
  } catch (error) {
    console.error('获取结算记录失败:', error)
    ElMessage.error('获取结算记录失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchIncomeList()
}

// 重置
const handleReset = () => {
  dateRange.value = []
  pagination.value.page = 1
  fetchIncomeList()
}

// 刷新
const handleRefresh = () => {
  fetchAccount()
  fetchIncomeList()
  fetchSettlements()
}

// 查看结算详情
const viewSettlementDetail = (row) => {
  ElMessage.info('结算详情功能开发中')
}

// 导出收入明细
const handleExportIncome = async () => {
  try {
    const params = {}

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const blob = await exportStoreIncome(params)

    // 从响应头获取文件名
    const contentDisposition = blob.headers?.['content-disposition'] || ''
    let filename = `服务收入明细_${dayjs().format('YYYY-MM-DD')}.xlsx`

    const match = contentDisposition.match(/filename\*?=['"]*UTF-8['"]*''([^;]+)/i)
    if (match && match[1]) {
      filename = decodeURIComponent(match[1])
    }

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([blob.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 导出结算记录
const handleExportSettlements = async () => {
  try {
    const blob = await exportStoreSettlements()

    // 从响应头获取文件名
    const contentDisposition = blob.headers?.['content-disposition'] || ''
    let filename = `结算记录_${dayjs().format('YYYY-MM-DD')}.xlsx`

    const match = contentDisposition.match(/filename\*?=['"]*UTF-8['"]*''([^;]+)/i)
    if (match && match[1]) {
      filename = decodeURIComponent(match[1])
    }

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([blob.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 获取结算状态类型
const getSettlementStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'processing': 'info',
    'completed': 'success',
    'failed': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取结算状态文本
const getSettlementStatusText = (status) => {
  const textMap = {
    'pending': '待结算',
    'processing': '结算中',
    'completed': '已结算',
    'failed': '结算失败'
  }
  return textMap[status] || status
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  fetchAccount()
  fetchIncomeList()
  fetchSettlements()
})
</script>

<style scoped lang="scss">
.store-account-page {
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .form-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .search-form {
    margin-bottom: 20px;
  }
}
</style>
