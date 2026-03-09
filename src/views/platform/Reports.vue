<template>
  <div class="reports-page">
    <!-- 时间范围选择 -->
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="统计周期">
          <el-radio-group
            v-model="timeRange"
            @change="fetchData"
          >
            <el-radio-button label="7">
              近7天
            </el-radio-button>
            <el-radio-button label="30">
              近30天
            </el-radio-button>
            <el-radio-button label="90">
              近90天
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="fetchData"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标卡片 -->
    <el-row
      :gutter="20"
      style="margin-top: 20px"
    >
      <el-col :span="6">
        <el-card class="metric-card">
          <el-statistic
            title="总订单数"
            :value="overview.orders?.total || 0"
          >
            <template #suffix>
              单
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card metric-card-success">
          <el-statistic
            title="总交易额"
            :value="overview.finance?.totalAmount || 0"
            :precision="2"
          >
            <template #prefix>
              ¥
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card metric-card-warning">
          <el-statistic
            title="合作车队"
            :value="overview.fleets?.total || 0"
          >
            <template #suffix>
              个
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card metric-card-info">
          <el-statistic
            title="合作门店"
            :value="overview.stores?.total || 0"
          >
            <template #suffix>
              个
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row
      :gutter="20"
      style="margin-top: 20px"
    >
      <!-- 订单趋势图 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单趋势</span>
            </div>
          </template>
          <div
            ref="orderTrendChartRef"
            style="height: 350px"
          />
        </el-card>
      </el-col>

      <!-- 故障类型分布 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>故障类型分布</span>
            </div>
          </template>
          <div
            ref="faultChartRef"
            style="height: 350px"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row
      :gutter="20"
      style="margin-top: 20px"
    >
      <!-- 车队排名 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>车队订单排名 TOP10</span>
            </div>
          </template>
          <div
            ref="fleetRankingChartRef"
            style="height: 350px"
          />
        </el-card>
      </el-col>

      <!-- 门店排名 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>门店订单排名 TOP10</span>
            </div>
          </template>
          <div
            ref="storeRankingChartRef"
            style="height: 350px"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>运营数据详情</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="data-item">
            <div class="data-label">
              今日订单
            </div>
            <div class="data-value">
              {{ overview.orders?.today || 0 }}
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="data-item">
            <div class="data-label">
              本月订单
            </div>
            <div class="data-value">
              {{ overview.orders?.thisMonth || 0 }}
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="data-item">
            <div class="data-label">
              待处理订单
            </div>
            <div class="data-value">
              {{ overview.orders?.pending || 0 }}
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="data-item">
            <div class="data-label">
              维修中
            </div>
            <div class="data-value">
              {{ overview.orders?.repairing || 0 }}
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="data-item">
            <div class="data-label">
              已完成
            </div>
            <div class="data-value">
              {{ overview.orders?.completed || 0 }}
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="data-item">
            <div class="data-label">
              车队总余额
            </div>
            <div class="data-value">
              ¥{{ overview.finance?.totalBalance?.toLocaleString() || 0 }}
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="data-item">
            <div class="data-label">
              司机总数
            </div>
            <div class="data-value">
              {{ overview.users?.drivers || 0 }}
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="data-item">
            <div class="data-label">
              车队管理员
            </div>
            <div class="data-value">
              {{ overview.users?.fleetManagers || 0 }}
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="data-item">
            <div class="data-label">
              门店技师
            </div>
            <div class="data-value">
              {{ overview.users?.technicians || 0 }}
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getOverview, getOrderTrend, getFleetRanking, getStoreRanking, getFaultDistribution } from '@/api/stats'

const timeRange = ref('30')
const overview = ref({})

const orderTrendChartRef = ref(null)
const faultChartRef = ref(null)
const fleetRankingChartRef = ref(null)
const storeRankingChartRef = ref(null)

let orderTrendChart = null
let faultChart = null
let fleetRankingChart = null
let storeRankingChart = null

// 获取所有数据
const fetchData = async () => {
  try {
    const [overviewRes, trendRes, fleetRes, storeRes, faultRes] = await Promise.all([
      getOverview(),
      getOrderTrend({ days: timeRange.value }),
      getFleetRanking({ limit: 10, type: 'orders' }),
      getStoreRanking({ limit: 10 }),
      getFaultDistribution()
    ])

    overview.value = overviewRes.data

    // 等待 DOM 更新后渲染图表
    await nextTick()
    renderOrderTrendChart(trendRes.data)
    renderFaultChart(faultRes.data)
    renderFleetRankingChart(fleetRes.data)
    renderStoreRankingChart(storeRes.data)
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

// 渲染订单趋势图
const renderOrderTrendChart = (data) => {
  if (!orderTrendChartRef.value) return

  if (!orderTrendChart) {
    orderTrendChart = echarts.init(orderTrendChartRef.value)
  }

  const dates = data.map(item => item.date)
  const totals = data.map(item => item.total)
  const completed = data.map(item => item.completed)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['总订单', '已完成']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '总订单',
        type: 'line',
        smooth: true,
        data: totals,
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '已完成',
        type: 'line',
        smooth: true,
        data: completed,
        itemStyle: { color: '#67c23a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      }
    ]
  }

  orderTrendChart.setOption(option)
}

// 渲染故障类型分布图
const renderFaultChart = (data) => {
  if (!faultChartRef.value) return

  if (!faultChart) {
    faultChart = echarts.init(faultChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: data.map(item => ({
          value: item.value,
          name: item.name
        }))
      }
    ]
  }

  faultChart.setOption(option)
}

// 渲染车队排名图
const renderFleetRankingChart = (data) => {
  if (!fleetRankingChartRef.value) return

  if (!fleetRankingChart) {
    fleetRankingChart = echarts.init(fleetRankingChartRef.value)
  }

  const fleetNames = data.map(item => item.fleetName)
  const orderCounts = data.map(item => item.orderCount)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: fleetNames,
      inverse: true
    },
    series: [
      {
        type: 'bar',
        data: orderCounts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#66b1ff' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c} 单'
        }
      }
    ]
  }

  fleetRankingChart.setOption(option)
}

// 渲染门店排名图
const renderStoreRankingChart = (data) => {
  if (!storeRankingChartRef.value) return

  if (!storeRankingChart) {
    storeRankingChart = echarts.init(storeRankingChartRef.value)
  }

  const storeNames = data.map(item => item.storeName)
  const orderCounts = data.map(item => item.orderCount)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: storeNames,
      inverse: true
    },
    series: [
      {
        type: 'bar',
        data: orderCounts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#95d475' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c} 单'
        }
      }
    ]
  }

  storeRankingChart.setOption(option)
}

// 窗口大小改变时重绘图表
const handleResize = () => {
  orderTrendChart?.resize()
  faultChart?.resize()
  fleetRankingChart?.resize()
  storeRankingChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  orderTrendChart?.dispose()
  faultChart?.dispose()
  fleetRankingChart?.dispose()
  storeRankingChart?.dispose()
})
</script>

<style scoped lang="scss">
.reports-page {
  .filter-card {
    margin-bottom: 20px;
  }

  .metric-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
    font-weight: 600;
    color: #2c3e50;
  }

  .data-item {
    text-align: center;
    padding: 10px 0;

    .data-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 10px;
    }

    .data-value {
      font-size: 28px;
      font-weight: bold;
      color: #2c3e50;
    }
  }
}
</style>
