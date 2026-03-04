<template>
  <div class="store-withdrawal-page">
    <h1>提现管理</h1>

    <!-- 账户余额卡片 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <el-card class="balance-card">
          <el-statistic title="待结算余额" :value="displayBalance.pendingBalance" :precision="2" prefix="¥">
            <template #suffix>
              <span style="font-size: 14px; color: #909399; margin-left: 8px">可提现</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="balance-card balance-card-success">
          <el-statistic title="已结算余额" :value="displayBalance.settledBalance" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="balance-card balance-card-info">
          <el-statistic title="累计收入" :value="displayBalance.totalEarned" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 申请提现 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>申请提现</span>
      </template>

      <el-form ref="withdrawalFormRef" :model="withdrawalForm" :rules="withdrawalRules" label-width="120px">
        <el-form-item label="提现金额" prop="withdrawalAmount">
          <el-input-number
            v-model="withdrawalForm.withdrawalAmount"
            :min="0.01"
            :max="displayBalance.pendingBalance > 0 ? displayBalance.pendingBalance : undefined"
            :precision="2"
            :step="100"
            :disabled="submitting || displayBalance.pendingBalance <= 0"
            style="width: 300px"
          />
          <span style="margin-left: 10px; color: #909399">元</span>
          <div style="margin-top: 5px; color: #909399; font-size: 12px">
            可提现金额：¥{{ displayBalance.pendingBalance }}
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="displayBalance.pendingBalance <= 0"
            @click="handleSubmit"
          >
            提交提现申请
          </el-button>
          <el-button @click="handleReset" :disabled="submitting">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 提现记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>提现记录</span>
          <div class="header-actions">
            <el-button type="success" size="small" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出记录
            </el-button>
            <el-radio-group v-model="statusFilter" size="small" @change="fetchWithdrawals">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="pending">待打款</el-radio-button>
              <el-radio-button label="processing">处理中</el-radio-button>
              <el-radio-button label="completed">已完成</el-radio-button>
              <el-radio-button label="rejected">已驳回</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table :data="withdrawalList" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="withdrawalNo" label="提现单号" width="180" fixed="left" />
        <el-table-column label="提现金额" width="120" align="right" fixed="left">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">¥{{ displayAmount(row.withdrawalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="platformFee" label="平台手续费" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c">-¥{{ displayAmount(row.platformFee || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="180">
          <template #default="{ row }">{{ formatDate(row.appliedAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="打款凭证" width="100">
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
            <span v-else style="color: #ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="打款时间" width="180">
          <template #default="{ row }">{{ row.processedAt ? formatDate(row.processedAt) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="提现详情" width="700px">
      <el-descriptions v-if="currentWithdrawal" :column="2" border>
        <el-descriptions-item label="提现单号" :span="2">{{ currentWithdrawal.withdrawalNo }}</el-descriptions-item>
        <el-descriptions-item label="提现金额">
          <span style="color: #f56c6c; font-weight: 600">¥{{ displayAmount(currentWithdrawal.withdrawalAmount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单数量">{{ currentWithdrawal.orderCount || 0 }} 笔</el-descriptions-item>
        <el-descriptions-item label="平台手续费">¥{{ displayAmount(currentWithdrawal.platformFee || 0) }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDate(currentWithdrawal.appliedAt) }}</el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="getStatusType(currentWithdrawal.status)">{{ getStatusText(currentWithdrawal.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentWithdrawal.status !== 'pending'" label="打款时间">
          {{ currentWithdrawal.processedAt ? formatDate(currentWithdrawal.processedAt) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentWithdrawal.remark" label="备注" :span="2">
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import {
  getStoreAccountBalance,
  createWithdrawal,
  getWithdrawalList
} from '@/api/withdrawal'
import dayjs from 'dayjs'

const withdrawalFormRef = ref()
const loading = ref(false)
const submitting = ref(false)

// 账户余额 - 使用原始值（分为单位）
const balanceData = ref({
  pendingBalance: 0,
  settledBalance: 0,
  totalEarned: 0
})

// 显示用的余额（转换为元）
const displayBalance = computed(() => ({
  pendingBalance: (balanceData.value.pendingBalance || 0) / 100,
  settledBalance: (balanceData.value.settledBalance || 0) / 100,
  totalEarned: (balanceData.value.totalEarned || 0) / 100
}))

// 提现表单
const withdrawalForm = ref({
  withdrawalAmount: 0
})

const withdrawalRules = {
  withdrawalAmount: [
    { required: true, message: '请输入提现金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '提现金额必须大于0', trigger: 'blur' }
  ]
}

// 提现记录列表
const statusFilter = ref('')
const withdrawalList = ref([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentWithdrawal = ref(null)

// 获取账户余额
const fetchBalance = async () => {
  try {
    const res = await getStoreAccountBalance()
    if (res && res.data) {
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

// 提交提现申请
const handleSubmit = async () => {
  const valid = await withdrawalFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await createWithdrawal({
      withdrawalAmount: Math.round(withdrawalForm.value.withdrawalAmount * 100)
    })
    ElMessage.success('提现申请已提交，等待财务审核')
    handleReset()
    fetchBalance()
    fetchWithdrawals()
  } catch (error) {
    console.error('提交提现申请失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const handleReset = () => {
  withdrawalFormRef.value?.resetFields()
  withdrawalForm.value = {
    withdrawalAmount: 0
  }
}

// 获取提现记录
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
    if (res && res.data) {
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

// 查看详情
const viewDetail = (row) => {
  currentWithdrawal.value = row
  detailDialogVisible.value = true
}

// 查看打款凭证
const viewPaymentProof = (row) => {
  viewDetail(row)
}

// 导出记录
const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

// 显示金额（分转元）
const displayAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return (amount / 100).toFixed(2)
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'processing': 'info',
    'completed': 'success',
    'rejected': 'danger'
  }
  return map[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'pending': '待打款',
    'processing': '处理中',
    'completed': '已完成',
    'rejected': '已驳回'
  }
  return map[status] || status
}

onMounted(() => {
  fetchBalance()
  fetchWithdrawals()
})
</script>

<style scoped lang="scss">
.store-withdrawal-page {
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
