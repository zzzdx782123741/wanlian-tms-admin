<template>
  <div class="store-withdrawal-page">
    <h1>提现管理</h1>

    <el-row
      :gutter="20"
      style="margin-top: 20px"
    >
      <el-col :span="8">
        <el-card class="balance-card">
          <el-statistic
            title="待结算余额"
            :value="displayBalance.pendingBalance"
            :precision="2"
            prefix="¥"
          >
            <template #suffix>
              <span class="stat-suffix">可提现</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="balance-card balance-card-success">
          <el-statistic
            title="已结算余额"
            :value="displayBalance.settledBalance"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="balance-card balance-card-info">
          <el-statistic
            title="累计收入"
            :value="displayBalance.totalEarned"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>申请提现</span>
      </template>

      <el-form
        ref="withdrawalFormRef"
        :model="withdrawalForm"
        :rules="withdrawalRules"
        label-width="120px"
      >
        <el-form-item
          label="提现金额"
          prop="withdrawalAmount"
        >
          <el-input-number
            v-model="withdrawalForm.withdrawalAmount"
            :min="0.01"
            :max="maxWithdrawalAmount"
            :precision="2"
            :step="0.01"
            :disabled="submitting || !canWithdraw"
            controls-position="right"
            style="width: 300px"
          />
          <span style="margin-left: 10px; color: #909399">元</span>
          <div class="amount-tip">
            可提现金额：¥{{ displayBalance.pendingBalance.toFixed(2) }}
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!canWithdraw"
            @click="handleSubmit"
          >
            提交提现申请
          </el-button>
          <el-button
            :disabled="submitting"
            @click="handleReset"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>提现记录</span>
          <div class="header-actions">
            <el-button
              type="success"
              size="small"
              @click="handleExport"
            >
              <el-icon><Download /></el-icon>
              导出记录
            </el-button>
            <el-radio-group
              v-model="statusFilter"
              size="small"
              @change="fetchWithdrawals"
            >
              <el-radio-button label="">
                全部
              </el-radio-button>
              <el-radio-button label="pending">
                待打款
              </el-radio-button>
              <el-radio-button label="processing">
                处理中
              </el-radio-button>
              <el-radio-button label="completed">
                已完成
              </el-radio-button>
              <el-radio-button label="rejected">
                已驳回
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="withdrawalList"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="withdrawalNo"
          label="提现单号"
          width="180"
          fixed="left"
        />
        <el-table-column
          label="提现金额"
          width="120"
          align="right"
          fixed="left"
        >
          <template #default="{ row }">
            <span class="amount-danger">¥{{ displayAmount(row.withdrawalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="平台手续费"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span class="fee-text">-¥{{ displayAmount(row.platformFee || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="申请时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.appliedAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="打款凭证"
          width="100"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.paymentProof || (row.paymentProofs && row.paymentProofs.length > 0)"
              type="primary"
              link
              size="small"
              @click="viewPaymentProof(row)"
            >
              查看
            </el-button>
            <span
              v-else
              style="color: #ccc"
            >-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="打款时间"
          width="180"
        >
          <template #default="{ row }">
            {{ row.processedAt ? formatDate(row.processedAt) : '-' }}
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
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchWithdrawals"
        @current-change="fetchWithdrawals"
      />
    </el-card>

    <el-dialog
      v-model="detailDialogVisible"
      title="提现详情"
      width="700px"
    >
      <el-descriptions
        v-if="currentWithdrawal"
        :column="2"
        border
      >
        <el-descriptions-item
          label="提现单号"
          :span="2"
        >
          {{ currentWithdrawal.withdrawalNo }}
        </el-descriptions-item>
        <el-descriptions-item label="提现金额">
          <span class="amount-danger">¥{{ displayAmount(currentWithdrawal.withdrawalAmount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单数量">
          {{ currentWithdrawal.orderCount || 0 }} 笔
        </el-descriptions-item>
        <el-descriptions-item label="平台手续费">
          ¥{{ displayAmount(currentWithdrawal.platformFee || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">
          {{ formatDate(currentWithdrawal.appliedAt) }}
        </el-descriptions-item>
        <el-descriptions-item
          label="状态"
          :span="2"
        >
          <el-tag :type="getStatusType(currentWithdrawal.status)">
            {{ getStatusText(currentWithdrawal.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentWithdrawal.status !== 'pending'"
          label="打款时间"
        >
          {{ currentWithdrawal.processedAt ? formatDate(currentWithdrawal.processedAt) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentWithdrawal.remark"
          label="备注"
          :span="2"
        >
          {{ currentWithdrawal.remark }}
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="currentWithdrawal && currentWithdrawal.paymentProof">
        <el-divider>打款凭证</el-divider>
        <el-image
          :src="currentWithdrawal.paymentProof"
          fit="contain"
          style="width: 100%; max-height: 400px"
          :preview-src-list="[currentWithdrawal.paymentProof]"
        />
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getStoreAccountBalance, createWithdrawal, getWithdrawalList } from '@/api/withdrawal'
import dayjs from 'dayjs'

const withdrawalFormRef = ref()
const loading = ref(false)
const submitting = ref(false)

const balanceData = ref({
  pendingBalance: 0,
  settledBalance: 0,
  totalEarned: 0
})

const displayBalance = computed(() => ({
  pendingBalance: (balanceData.value.pendingBalance || 0) / 100,
  settledBalance: (balanceData.value.settledBalance || 0) / 100,
  totalEarned: (balanceData.value.totalEarned || 0) / 100
}))

const maxWithdrawalAmount = computed(() => {
  const amount = Number(displayBalance.value.pendingBalance || 0)
  if (amount <= 0) return 0.01
  return Number(amount.toFixed(2))
})

const canWithdraw = computed(() => Number(displayBalance.value.pendingBalance || 0) > 0)

const withdrawalForm = ref({
  withdrawalAmount: null
})

const validateWithdrawalAmount = (_, value, callback) => {
  if (value === null || value === undefined || value === '') {
    callback(new Error('请输入提现金额'))
    return
  }

  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0.01) {
    callback(new Error('提现金额必须大于等于0.01元'))
    return
  }

  const max = Number(displayBalance.value.pendingBalance || 0)
  if (max > 0 && amount > max) {
    callback(new Error(`提现金额不能超过可提现金额 ¥${max.toFixed(2)}`))
    return
  }

  callback()
}

const withdrawalRules = {
  withdrawalAmount: [{ validator: validateWithdrawalAmount, trigger: ['blur', 'change'] }]
}

const statusFilter = ref('')
const withdrawalList = ref([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

const detailDialogVisible = ref(false)
const currentWithdrawal = ref(null)

const fetchBalance = async () => {
  try {
    const res = await getStoreAccountBalance()
    if (res?.data) {
      balanceData.value = {
        pendingBalance: res.data.pendingBalance || 0,
        settledBalance: res.data.settledBalance || 0,
        totalEarned: res.data.totalEarned || 0
      }
    }
  } catch (error) {
    console.error('获取账户余额失败:', error)
  }
}

const handleSubmit = async () => {
  if (!canWithdraw.value) {
    ElMessage.warning('当前可提现金额为0，暂不能申请提现')
    return
  }

  const valid = await withdrawalFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const amount = Number(withdrawalForm.value.withdrawalAmount)
  if (!Number.isFinite(amount) || amount < 0.01) {
    ElMessage.warning('请输入有效的提现金额')
    return
  }

  if (amount > displayBalance.value.pendingBalance) {
    ElMessage.warning('提现金额不能超过可提现余额')
    return
  }

  submitting.value = true
  try {
    await createWithdrawal({
      withdrawalAmount: Math.round(amount * 100)
    })
    ElMessage.success('提现申请已提交，等待财务审核')
    handleReset()
    await fetchBalance()
    await fetchWithdrawals()
  } catch (error) {
    console.error('提交提现申请失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  withdrawalFormRef.value?.resetFields()
  withdrawalForm.value.withdrawalAmount = canWithdraw.value ? 0.01 : null
}

watch(
  () => displayBalance.value.pendingBalance,
  (latestBalance) => {
    const max = Number(latestBalance || 0)
    if (max <= 0) {
      withdrawalForm.value.withdrawalAmount = null
      return
    }

    const current = Number(withdrawalForm.value.withdrawalAmount)
    if (!Number.isFinite(current) || current <= 0) {
      withdrawalForm.value.withdrawalAmount = 0.01
      return
    }

    if (current > max) {
      withdrawalForm.value.withdrawalAmount = Number(max.toFixed(2))
    }
  },
  { immediate: true }
)

const fetchWithdrawals = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }

    const res = await getWithdrawalList(params)
    if (res?.data) {
      withdrawalList.value = res.data.list || []
      pagination.value.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取提现记录失败:', error)
    ElMessage.error('获取提现记录失败')
  } finally {
    loading.value = false
  }
}

const viewDetail = row => {
  currentWithdrawal.value = row
  detailDialogVisible.value = true
}

const viewPaymentProof = row => {
  viewDetail(row)
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const displayAmount = amount => {
  if (amount === null || amount === undefined) return '0.00'
  return (Number(amount) / 100).toFixed(2)
}

const formatDate = date => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const getStatusType = status => {
  const statusMap = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    rejected: 'danger'
  }
  return statusMap[status] || ''
}

const getStatusText = status => {
  const statusMap = {
    pending: '待打款',
    processing: '处理中',
    completed: '已完成',
    rejected: '已驳回'
  }
  return statusMap[status] || status || '-'
}

onMounted(async () => {
  await fetchBalance()
  await fetchWithdrawals()
})
</script>

<style scoped lang="scss">
.store-withdrawal-page {
  .stat-suffix {
    font-size: 14px;
    color: #909399;
    margin-left: 8px;
  }

  .amount-tip {
    margin-top: 5px;
    color: #909399;
    font-size: 12px;
  }

  .amount-danger {
    color: #f56c6c;
    font-weight: 600;
  }

  .fee-text {
    color: #f56c6c;
  }

  .balance-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.balance-card-success :deep(.el-statistic__number) {
      color: #67c23a;
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      :deep(.el-button) {
        margin: 0;
      }

      :deep(.el-radio-group) {
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>
