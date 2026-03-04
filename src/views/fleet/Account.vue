<template>
  <div class="fleet-account">
    <!-- 未关联车队提示 -->
    <el-card v-if="!hasFleet">
      <el-result
        icon="warning"
        title="未关联车队"
        sub-title="您的账号尚未关联车队，无法访问账户管理功能"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
        </template>
      </el-result>
    </el-card>

    <!-- 账户概览 -->
    <template v-else>
      <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="balance-card">
          <el-statistic title="账户总余额" :precision="2">
            <template #prefix>¥</template>
            <template #default>{{ formatMoney(accountInfo.balance || 0) }}</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="balance-card balance-card-success">
          <el-statistic title="可用余额" :precision="2">
            <template #prefix>¥</template>
            <template #default>{{ formatMoney(availableBalance) }}</template>
          </el-statistic>
          <div style="margin-top: 8px; font-size: 12px; color: #909399">
            总余额 - 冻结金额
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="balance-card balance-card-warning">
          <el-statistic title="冻结金额" :precision="2">
            <template #prefix>¥</template>
            <template #default>{{ formatMoney(accountInfo.frozenAmount || 0) }}</template>
          </el-statistic>
          <div style="margin-top: 8px; font-size: 12px; color: #909399">
            订单审批中冻结的金额
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="balance-card balance-card-info">
          <el-statistic title="总充值" :precision="2">
            <template #prefix>¥</template>
            <template #default>{{ formatMoney(statistics.totalRecharge || 0) }}</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 充值入口 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>充值管理</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="recharge-option" @click="$router.push('/fleet-recharge')">
            <el-icon size="40" color="#409eff"><Money /></el-icon>
            <div style="margin-top: 10px; font-weight: 600">申请充值</div>
            <div style="margin-top: 5px; font-size: 12px; color: #909399">
              线下转账后提交申请
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="recharge-option" @click="$router.push('/fleet-recharge')">
            <el-icon size="40" color="#67c23a"><Document /></el-icon>
            <div style="margin-top: 10px; font-weight: 600">充值记录</div>
            <div style="margin-top: 5px; font-size: 12px; color: #909399">
              查看充值历史和审核状态
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 交易记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>交易明细</span>
          <div class="header-actions">
            <el-radio-group v-model="transactionType" size="small">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="recharge">充值</el-radio-button>
              <el-radio-button value="freeze">冻结</el-radio-button>
              <el-radio-button value="unfreeze">解冻</el-radio-button>
              <el-radio-button value="deduct">扣除</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="transactionList"
        stripe
        style="width: 100%"
      >
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTransactionTypeTag(row.type)" size="small">
              {{ getTransactionTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="150" align="right">
          <template #default="{ row }">
            <span :style="{ color: getTransactionAmountColor(row.type), fontWeight: 600 }">
              {{ getTransactionAmountPrefix(row.type) }}¥{{ formatMoney(Math.abs(row.amount)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="余额" width="150" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney(row.balance) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column label="关联订单" width="120">
          <template #default="{ row }">
            <el-button v-if="row.orderId" type="primary" link size="small" @click="viewOrder(row.orderId)">
              查看订单
            </el-button>
            <span v-else style="color: #ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchTransactions"
        @current-change="fetchTransactions"
      />
    </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage, ElResult } from 'element-plus'
import { Money, Document } from '@element-plus/icons-vue'
import { getBalance, getTransactions, getStatistics } from '@/api/account'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const router = useRouter()

const rechargeFormRef = ref()
const loading = ref(false)

// 获取用户信息，检查是否有车队
const userInfo = computed(() => {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}')
  return user
})

// 检查是否有关联车队
const hasFleet = computed(() => {
  return !!(userInfo.value.fleetInfo?.fleetId || userInfo.value.fleets?.length > 0)
})

const accountInfo = ref({
  balance: 0,
  frozenAmount: 0
})

// 计算可用余额
const availableBalance = computed(() => {
  return (accountInfo.value.balance || 0) - (accountInfo.value.frozenAmount || 0)
})

const statistics = ref({
  totalRecharge: 0,
  totalPayment: 0,
  transactionCount: 0
})

const transactionType = ref('')
const transactionList = ref([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 格式化金额（分转元）
const formatMoney = (amount) => {
  return (amount / 100).toFixed(2)
}

// 获取交易类型标签
const fetchBalance = async () => {
  try {
    const res = await getBalance()
    accountInfo.value = res.data
  } catch (error) {
    console.error('获取余额失败:', error)
  }
}

// 获取统计信息
const fetchStatistics = async () => {
  try {
    const res = await getStatistics()
    statistics.value = res.data
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 获取交易记录
const fetchTransactions = async () => {
  loading.value = true
  try {
    const res = await getTransactions({
      page: pagination.value.page,
      limit: pagination.value.limit,
      type: transactionType.value
    })
    transactionList.value = res.data.transactions || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    console.error('获取交易记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 充值功能已移除，使用充值页面
const handleRecharge = () => {
  router.push('/fleet-recharge')
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取交易类型标签
const getTransactionTypeTag = (type) => {
  const map = {
    'recharge': 'success',
    'payment': 'danger',
    'refund': 'warning',
    'freeze': 'info',
    'unfreeze': 'info'
  }
  return map[type] || ''
}

// 获取交易类型文本
const getTransactionTypeText = (type) => {
  const map = {
    'recharge': '充值',
    'payment': '支付',
    'refund': '退款',
    'freeze': '冻结',
    'unfreeze': '解冻'
  }
  return map[type] || type
}

// 获取交易金额颜色
const getTransactionAmountColor = (type) => {
  const map = {
    'recharge': '#67c23a',
    'payment': '#f56c6c',
    'refund': '#e6a23c',
    'freeze': '#909399',
    'unfreeze': '#409eff'
  }
  return map[type] || '#606266'
}

// 获取交易金额前缀
const getTransactionAmountPrefix = (type) => {
  const map = {
    'recharge': '+',
    'payment': '-',
    'refund': '+',
    'freeze': '',
    'unfreeze': ''
  }
  return map[type] || ''
}

// 监听交易类型变化
watch(transactionType, () => {
  pagination.value.page = 1
  fetchTransactions()
})

onMounted(() => {
  fetchBalance()
  fetchStatistics()
  fetchTransactions()
})
</script>

<style scoped lang="scss">
.fleet-account {
  .balance-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.balance-card-success :deep(.el-statistic__number) {
      color: #67c23a;
    }

    &.balance-card-warning :deep(.el-statistic__number) {
      color: #e6a23c;
    }

    &.balance-card-info :deep(.el-statistic__number) {
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

  .recharge-option {
    padding: 30px;
    text-align: center;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      background-color: #f0f7ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
