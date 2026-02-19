<template>
  <div class="fleet-account">
    <!-- 账户概览 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <el-statistic title="账户余额" :precision="2">
            <template #prefix>¥</template>
            <template #default>{{ accountInfo.balance }}</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="总充值" :precision="2">
            <template #prefix>¥</template>
            <template #default>{{ statistics.totalRecharge }}</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="总支出" :precision="2">
            <template #prefix>¥</template>
            <template #default>{{ statistics.totalPayment }}</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="交易笔数">
            <template #default>{{ statistics.transactionCount }}</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 充值操作 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>账户充值</span>
        </div>
      </template>
      <el-form
        ref="rechargeFormRef"
        :model="rechargeForm"
        :rules="rechargeRules"
        :inline="true"
      >
        <el-form-item label="充值金额" prop="amount">
          <el-input-number
            v-model="rechargeForm.amount"
            :min="1"
            :max="100000"
            :precision="2"
            :step="100"
          />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input
            v-model="rechargeForm.description"
            placeholder="请输入备注"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRecharge">
            立即充值
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 交易记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>交易记录</span>
          <el-radio-group v-model="transactionType" size="small" style="float: right">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="recharge">充值</el-radio-button>
            <el-radio-button label="payment">支付</el-radio-button>
          </el-radio-group>
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
            <el-tag :type="row.type === 'recharge' ? 'success' : 'danger'">
              {{ row.type === 'recharge' ? '充值' : '支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="150">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'recharge' ? '#67c23a' : '#f56c6c' }">
              {{ row.type === 'recharge' ? '+' : '' }}¥{{ Math.abs(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" show-overflow-tooltip />
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
        layout="total, prev, pager, next"
        style="margin-top: 20px"
        @current-change="fetchTransactions"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getBalance, recharge, getTransactions, getStatistics } from '@/api/account'
import dayjs from 'dayjs'

const rechargeFormRef = ref()
const loading = ref(false)

const accountInfo = ref({
  balance: 0
})

const statistics = ref({
  totalRecharge: 0,
  totalPayment: 0,
  transactionCount: 0
})

const rechargeForm = ref({
  amount: 1000,
  description: ''
})

const rechargeRules = {
  amount: [
    { required: true, message: '请输入充值金额', trigger: 'blur' }
  ]
}

const transactionType = ref('')
const transactionList = ref([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 获取账户余额
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

// 充值
const handleRecharge = async () => {
  const valid = await rechargeFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await recharge(rechargeForm.value)
    ElMessage.success('充值成功')
    rechargeForm.value.amount = 1000
    rechargeForm.value.description = ''
    fetchBalance()
    fetchStatistics()
    fetchTransactions()
  } catch (error) {
    console.error('充值失败:', error)
  }
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
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
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;
  }
}
</style>
