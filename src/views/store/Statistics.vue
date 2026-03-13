<template>
  <div class="store-statistics">
    <div class="page-header">
      <h2>数据统计</h2>
      <el-date-picker
        v-model="dateRange"
        type="monthrange"
        range-separator="-"
        start-placeholder="开始月份"
        end-placeholder="结束月份"
        value-format="YYYY-MM"
        @change="loadStatistics"
      />
    </div>

    <!-- 核心指标 -->
    <el-row
      :gutter="20"
      class="metrics-row"
    >
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div
              class="metric-icon"
              style="background: #ecf5ff"
            >
              <el-icon
                :size="32"
                color="#409EFF"
              >
                <Document />
              </el-icon>
            </div>
            <div class="metric-data">
              <div class="metric-value">
                {{ statistics.totalOrders || 0 }}
              </div>
              <div class="metric-label">
                总订单数
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div
              class="metric-icon"
              style="background: #f0f9ff"
            >
              <el-icon
                :size="32"
                color="#67C23A"
              >
                <CircleCheck />
              </el-icon>
            </div>
            <div class="metric-data">
              <div class="metric-value">
                {{ statistics.completedOrders || 0 }}
              </div>
              <div class="metric-label">
                完成订单
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div
              class="metric-icon"
              style="background: #fef0f0"
            >
              <el-icon
                :size="32"
                color="#F56C6C"
              >
                <Money />
              </el-icon>
            </div>
            <div class="metric-data">
              <div class="metric-value">
                ¥{{ formatAmount(statistics.totalRevenue || 0) }}
              </div>
              <div class="metric-label">
                总营收
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div
              class="metric-icon"
              style="background: #fdf6ec"
            >
              <el-icon
                :size="32"
                color="#E6A23C"
              >
                <Star />
              </el-icon>
            </div>
            <div class="metric-data">
              <div class="metric-value">
                {{ statistics.avgScore || '-' }}
              </div>
              <div class="metric-label">
                平均评分
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row
      :gutter="20"
      class="charts-row"
    >
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>订单趋势</span>
          </template>
          <div
            ref="orderTrendRef"
            style="height: 300px"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>营收趋势</span>
          </template>
          <div
            ref="revenueTrendRef"
            style="height: 300px"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据 -->
    <el-row
      :gutter="20"
      class="detail-row"
    >
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>订单类型分布</span>
          </template>
          <el-table
            :data="orderTypeData"
            stripe
          >
            <el-table-column
              prop="type"
              label="类型"
              width="120"
            >
              <template #default="{ row }">
                {{ row.type === 'repair' ? '维修订单' : '保养订单' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="count"
              label="订单数"
              width="100"
            />
            <el-table-column
              prop="amount"
              label="金额"
            >
              <template #default="{ row }">
                ¥{{ formatAmount(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="percentage"
              label="占比"
              width="100"
            >
              <template #default="{ row }">
                {{ row.percentage }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>技师工作量</span>
          </template>
          <el-table
            :data="technicianWorkData"
            stripe
          >
            <el-table-column
              prop="name"
              label="技师姓名"
              width="120"
            />
            <el-table-column
              prop="completedOrders"
              label="完成订单"
              width="100"
            />
            <el-table-column
              prop="revenue"
              label="创收"
            >
              <template #default="{ row }">
                ¥{{ formatAmount(row.revenue) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="avgRating"
              label="平均评分"
              width="100"
            >
              <template #default="{ row }">
                <el-rate
                  v-model="row.avgRating"
                  disabled
                  show-score
                  :score-template="`${row.avgRating} 分`"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, CircleCheck, Money, Star } from '@element-plus/icons-vue'
import request from '@/utils/request'
import * as echarts from 'echarts'

const dateRange = ref([])
const orderTrendRef = ref()
const revenueTrendRef = ref()

const statistics = reactive({
  totalOrders: 0,
  completedOrders: 0,
  totalRevenue: 0,
  avgScore: '-'
})

const orderTypeData = ref([])
const technicianWorkData = ref([])

function normalizeAmount(amount) {
  return Number(amount || 0)
}

onMounted(async () => {
  // 设置默认日期范围（最近6个月）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 5)

  const endMonth = endDate.toISOString().slice(0, 7)
  const startMonth = startDate.toISOString().slice(0, 7)

  dateRange.value = [startMonth, endMonth]

  await loadStatistics()
})

async function loadStatistics() {
  try {
    if (!dateRange.value || dateRange.value.length !== 2) {
      ElMessage.warning('请选择日期范围')
      return
    }

    const [startMonth, endMonth] = dateRange.value

    const res = await request({
      url: '/store/statistics',
      method: 'get',
      params: { startMonth, endMonth }
    })

    Object.assign(statistics, {
      ...res.data.summary,
      totalRevenue: normalizeAmount(res.data.summary?.totalRevenue)
    })
    orderTypeData.value = (res.data.orderTypes || []).map(item => ({
      ...item,
      amount: normalizeAmount(item.amount)
    }))
    technicianWorkData.value = (res.data.technicianWork || []).map(item => ({
      ...item,
      revenue: normalizeAmount(item.revenue)
    }))

    // 渲染图表
    await nextTick()
    renderOrderTrend(res.data.orderTrend || [])
    renderRevenueTrend((res.data.revenueTrend || []).map(item => ({
      ...item,
      amount: normalizeAmount(item.amount)
    })))

  } catch (error) {
    ElMessage.error(error.message || '加载统计数据失败')
  }
}

function renderOrderTrend(data) {
  if (!orderTrendRef.value) return

  const chart = echarts.init(orderTrendRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.month)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '维修订单',
        type: 'line',
        data: data.map(d => d.repair),
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '保养订单',
        type: 'line',
        data: data.map(d => d.maintenance),
        smooth: true,
        itemStyle: { color: '#67C23A' }
      }
    ],
    legend: {
      data: ['维修订单', '保养订单']
    }
  }

  chart.setOption(option)
}

function renderRevenueTrend(data) {
  if (!revenueTrendRef.value) return

  const chart = echarts.init(revenueTrendRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>营收: ¥{c}'
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.month)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '营收',
        type: 'bar',
        data: data.map(d => d.amount),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  }

  chart.setOption(option)
}

function formatAmount(amount) {
  if (!amount) return '0'
  return parseFloat(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
</script>

<style scoped>
.store-statistics {
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

.metrics-row {
  margin-bottom: 20px;
}

.metric-card {
  cursor: pointer;
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-data {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-bottom: 20px;
}

.detail-row {
  margin-bottom: 20px;
}
</style>
