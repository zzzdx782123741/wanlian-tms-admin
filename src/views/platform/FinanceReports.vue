<template>
  <div class="finance-reports-page">
    <!-- 时间范围选择 -->
    <el-card style="margin-bottom: 20px">
      <el-form
        :inline="true"
        label-width="100px"
      >
        <el-form-item label="统计周期">
          <el-radio-group
            v-model="dateRangeType"
            size="small"
            @change="handleDateRangeTypeChange"
          >
            <el-radio-button label="today">
              今日
            </el-radio-button>
            <el-radio-button label="week">
              本周
            </el-radio-button>
            <el-radio-button label="month">
              本月
            </el-radio-button>
            <el-radio-button label="custom">
              自定义
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="dateRangeType === 'custom'"
          label="日期范围"
        >
          <el-date-picker
            v-model="customDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="fetchReportsData"
          >
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出报表
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="metric-card metric-card-primary">
          <el-statistic
            title="充值总额"
            :value="reportsData.totalRecharge"
            :precision="2"
            prefix="¥"
          />
          <div style="margin-top: 10px; font-size: 12px; color: #909399">
            {{ reportsData.rechargeCount || 0 }} 笔
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card metric-card-success">
          <el-statistic
            title="平台收入"
            :value="reportsData.totalIncome"
            :precision="2"
            prefix="¥"
          />
          <div style="margin-top: 10px; font-size: 12px; color: #909399">
            3% 手续费
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card metric-card-warning">
          <el-statistic
            title="提现总额"
            :value="reportsData.totalWithdrawal"
            :precision="2"
            prefix="¥"
          />
          <div style="margin-top: 10px; font-size: 12px; color: #909399">
            门店提现
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card metric-card-info">
          <el-statistic
            title="平台净收入"
            :value="reportsData.netIncome"
            :precision="2"
            prefix="¥"
          />
          <div style="margin-top: 10px; font-size: 12px; color: #909399">
            收入 - 提现
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-row
      :gutter="20"
      style="margin-top: 20px"
    >
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>充值趋势</span>
            </div>
          </template>
          <div
            ref="rechargeChartRef"
            style="height: 300px"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>收入趋势</span>
            </div>
          </template>
          <div
            ref="incomeChartRef"
            style="height: 300px"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据 -->
    <el-row
      :gutter="20"
      style="margin-top: 20px"
    >
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>充值明细</span>
              <el-button
                type="primary"
                link
                size="small"
                @click="$router.push('/recharge-audit')"
              >
                查看全部
              </el-button>
            </div>
          </template>

          <el-table
            v-loading="loading"
            :data="reportsData.rechargeList"
            stripe
            style="width: 100%"
            max-height="400"
          >
            <el-table-column
              prop="rechargeNo"
              label="充值单号"
              width="160"
              show-overflow-tooltip
            />
            <el-table-column
              prop="fleetName"
              label="车队"
              width="120"
              show-overflow-tooltip
            />
            <el-table-column
              label="金额"
              width="100"
              align="right"
            >
              <template #default="{ row }">
                ¥{{ (row.amount / 100).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column
              label="状态"
              width="80"
            >
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'approved' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ row.status === 'approved' ? '已通过' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="时间"
              width="140"
            >
              <template #default="{ row }">
                {{ formatDate(row.appliedAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>提现明细</span>
              <el-button
                type="primary"
                link
                size="small"
                @click="$router.push('/settlement-management')"
              >
                查看全部
              </el-button>
            </div>
          </template>

          <el-table
            v-loading="loading"
            :data="reportsData.withdrawalList"
            stripe
            style="width: 100%"
            max-height="400"
          >
            <el-table-column
              prop="withdrawalNo"
              label="提现单号"
              width="160"
              show-overflow-tooltip
            />
            <el-table-column
              prop="storeName"
              label="门店"
              width="120"
              show-overflow-tooltip
            />
            <el-table-column
              label="金额"
              width="100"
              align="right"
            >
              <template #default="{ row }">
                ¥{{ (row.withdrawalAmount / 100).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column
              label="状态"
              width="80"
            >
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'completed' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ row.status === 'completed' ? '已完成' : '待打款' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="时间"
              width="140"
            >
              <template #default="{ row }">
                {{ formatDate(row.appliedAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 收入统计 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>平台收入统计</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="reportsData.incomeList"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="incomeNo"
          label="收入单号"
          width="160"
        />
        <el-table-column
          prop="orderNumber"
          label="订单号"
          width="160"
        />
        <el-table-column
          prop="fleetName"
          label="车队"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="storeName"
          label="门店"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="订单金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ (row.orderAmount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          label="平台费(3%)"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: 600">
              ¥{{ (row.feeAmount / 100).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="结算时间"
          width="160"
        >
          <template #default="{ row }">
            {{ formatDate(row.settledAt) }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="incomePagination.page"
        v-model:page-size="incomePagination.limit"
        :total="incomePagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchIncomeList"
        @current-change="fetchIncomeList"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import { getRechargeList } from '@/api/recharge'
import { getWithdrawalList } from '@/api/withdrawal'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import ExcelJS from 'exceljs'

const loading = ref(false)
const dateRangeType = ref('month')
const customDateRange = ref([])

// 报表数据
const reportsData = ref({
  totalRecharge: 0,
  rechargeCount: 0,
  totalIncome: 0,
  totalWithdrawal: 0,
  netIncome: 0,
  rechargeList: [],
  withdrawalList: [],
  incomeList: []
})

const incomePagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 图表实例
const rechargeChartRef = ref()
const incomeChartRef = ref()
let rechargeChart = null
let incomeChart = null

// 日期范围类型变化
const handleDateRangeTypeChange = () => {
  if (dateRangeType.value !== 'custom') {
    customDateRange.value = []
  }
  fetchReportsData()
}

// 获取日期范围
const getDateRange = () => {
  const today = dayjs()
  switch (dateRangeType.value) {
  case 'today':
    return [today.format('YYYY-MM-DD'), today.format('YYYY-MM-DD')]
  case 'week':
    return [today.startOf('week').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')]
  case 'month':
    return [today.startOf('month').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')]
  case 'custom':
    return customDateRange.value
  default:
    return [today.format('YYYY-MM-DD'), today.format('YYYY-MM-DD')]
  }
}

// 获取报表数据
const fetchReportsData = async () => {
  loading.value = true
  try {
    const dateRange = getDateRange()
    if (!dateRange[0] || !dateRange[1]) {
      ElMessage.warning('请选择日期范围')
      return
    }

    // 并行获取数据
    const [rechargeRes, withdrawalRes] = await Promise.all([
      getRechargeList({
        page: 1,
        limit: 10,
        startDate: dateRange[0],
        endDate: dateRange[1],
        status: 'approved'
      }),
      getWithdrawalList({
        page: 1,
        limit: 10,
        startDate: dateRange[0],
        endDate: dateRange[1],
        status: 'completed'
      })
    ])

    const rechargeList = rechargeRes.data.list || []
    const withdrawalList = withdrawalRes.data.list || []

    // 计算统计数据
    const totalRecharge = rechargeList.reduce((sum, item) => sum + item.amount, 0)
    const totalWithdrawal = withdrawalList.reduce((sum, item) => sum + item.withdrawalAmount, 0)

    // 平台收入（从提现记录中获取平台手续费）
    const totalIncome = withdrawalList.reduce((sum, item) => sum + (item.platformFee || 0), 0)

    reportsData.value = {
      totalRecharge: totalRecharge / 100,
      rechargeCount: rechargeList.length,
      totalIncome: totalIncome / 100,
      totalWithdrawal: totalWithdrawal / 100,
      netIncome: (totalIncome - totalWithdrawal) / 100,
      rechargeList,
      withdrawalList,
      incomeList: []
    }

    // 更新图表
    nextTick(() => {
      updateCharts()
    })

    // 获取收入列表
    fetchIncomeList()
  } catch (error) {
    console.error('获取报表数据失败:', error)
    ElMessage.error('获取报表数据失败')
  } finally {
    loading.value = false
  }
}

// 获取收入列表
const fetchIncomeList = async () => {
  try {
    // 这里应该调用平台收入API，暂时模拟数据
    reportsData.value.incomeList = []
    incomePagination.value.total = 0
  } catch (error) {
    console.error('获取收入列表失败:', error)
  }
}

// 更新图表
const updateCharts = () => {
  // 充值趋势图
  if (!rechargeChart) {
    rechargeChart = echarts.init(rechargeChartRef.value)
  }

  const rechargeOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: reportsData.value.rechargeList.map(item => dayjs(item.appliedAt).format('MM-DD'))
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '充值金额',
        type: 'line',
        data: reportsData.value.rechargeList.map(item => item.amount / 100),
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        },
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  }

  rechargeChart.setOption(rechargeOption)

  // 收入趋势图
  if (!incomeChart) {
    incomeChart = echarts.init(incomeChartRef.value)
  }

  const incomeOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: reportsData.value.withdrawalList.map(item => dayjs(item.appliedAt).format('MM-DD'))
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '平台收入',
        type: 'bar',
        data: reportsData.value.withdrawalList.map(item => item.platformFee / 100),
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }

  incomeChart.setOption(incomeOption)
}

// 导出报表
const handleExport = async () => {
  if (!reportsData.value.rechargeList.length && !reportsData.value.withdrawalList.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    const workbook = new ExcelJS.Workbook()

    // 汇总Sheet
    const summarySheet = workbook.addWorksheet('财务汇总')
    summarySheet.columns = [
      { header: '指标名称', width: 20 },
      { header: '数值', width: 20 }
    ]
    summarySheet.addRow(['统计周期', `${getDateRange()[0]} 至 ${getDateRange()[1]}`])
    summarySheet.addRow(['充值总额', `¥${reportsData.value.totalRecharge.toFixed(2)}`])
    summarySheet.addRow(['充值笔数', `${reportsData.value.rechargeCount} 笔`])
    summarySheet.addRow(['平台收入', `¥${reportsData.value.totalIncome.toFixed(2)}`])
    summarySheet.addRow(['提现总额', `¥${reportsData.value.totalWithdrawal.toFixed(2)}`])
    summarySheet.addRow(['平台净收入', `¥${reportsData.value.netIncome.toFixed(2)}`])

    // 充值记录Sheet
    if (reportsData.value.rechargeList.length > 0) {
      const rechargeSheet = workbook.addWorksheet('充值记录')
      rechargeSheet.columns = [
        { header: '订单号', width: 20 },
        { header: '车队名称', width: 20 },
        { header: '充值金额', width: 15 },
        { header: '充值方式', width: 12 },
        { header: '状态', width: 12 },
        { header: '创建时间', width: 20 },
        { header: '审核时间', width: 20 }
      ]

      reportsData.value.rechargeList.forEach(item => {
        rechargeSheet.addRow([
          item.orderNumber,
          item.fleetId?.name || '-',
          `¥${(item.amount / 100).toFixed(2)}`,
          item.paymentMethod || '-',
          item.status === 'approved' ? '已审核' : item.status === 'pending' ? '待审核' : item.status,
          formatDate(item.createdAt),
          item.approvedAt ? formatDate(item.approvedAt) : '-'
        ])
      })
    }

    // 提现记录Sheet
    if (reportsData.value.withdrawalList.length > 0) {
      const withdrawalSheet = workbook.addWorksheet('提现记录')
      withdrawalSheet.columns = [
        { header: '订单号', width: 20 },
        { header: '门店名称', width: 20 },
        { header: '提现金额', width: 15 },
        { header: '平台手续费', width: 15 },
        { header: '实际到账', width: 15 },
        { header: '状态', width: 12 },
        { header: '申请时间', width: 20 },
        { header: '完成时间', width: 20 }
      ]

      reportsData.value.withdrawalList.forEach(item => {
        const actualAmount = item.withdrawalAmount - (item.platformFee || 0)
        withdrawalSheet.addRow([
          item.orderNumber,
          item.storeId?.name || '-',
          `¥${(item.withdrawalAmount / 100).toFixed(2)}`,
          `¥${((item.platformFee || 0) / 100).toFixed(2)}`,
          `¥${(actualAmount / 100).toFixed(2)}`,
          item.status === 'completed' ? '已完成' : item.status === 'pending' ? '待审核' : item.status,
          formatDate(item.createdAt),
          item.completedAt ? formatDate(item.completedAt) : '-'
        ])
      })
    }

    // 生成并下载
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `财务报表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  fetchReportsData()

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    rechargeChart?.resize()
    incomeChart?.resize()
  })
})

onUnmounted(() => {
  rechargeChart?.dispose()
  incomeChart?.dispose()
})
</script>

<style scoped lang="scss">
.finance-reports-page {
  .metric-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.metric-card-primary :deep(.el-statistic__number) {
      color: #409eff;
    }

    &.metric-card-success :deep(.el-statistic__number) {
      color: #67c23a;
    }

    &.metric-card-warning :deep(.el-statistic__number) {
      color: #e6a23c;
    }

    &.metric-card-info :deep(.el-statistic__number) {
      color: #909399;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;
  }
}
</style>
