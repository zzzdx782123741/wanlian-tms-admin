<template>
  <div class="settlement-management-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="待打款" :value="stats.pending">
            <template #suffix>笔</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic title="待打款金额" :value="stats.pendingAmount" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic title="今日已打款" :value="stats.todayPaid" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-info">
          <el-statistic title="本月已打款" :value="stats.monthlyPaid" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 待打款列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>待打款管理</span>
          <div style="display: flex; gap: 10px">
            <el-button type="warning" size="small" @click="handleExportPending">
              <el-icon><Download /></el-icon>
              导出待打款
            </el-button>
            <el-button type="primary" size="small" @click="handleGenerateSettlement">
              <el-icon><Plus /></el-icon>
              生成结算单
            </el-button>
            <el-button type="success" size="small" @click="fetchPendingList">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="门店名称">
          <el-input
            v-model="filters.storeName"
            placeholder="请输入门店名称"
            clearable
            style="width: 200px"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="申请时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="pendingList"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="withdrawalNo" label="提现单号" width="180" fixed="left" />
        <el-table-column prop="storeName" label="门店名称" width="180" show-overflow-tooltip />
        <el-table-column label="提现金额" width="120" align="right" fixed="left">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600; font-size: 15px">
              ¥{{ (row.withdrawalAmount / 100).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数量" width="100" align="center" />
        <el-table-column prop="platformFee" label="平台手续费" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #67c23a">
              +¥{{ (row.platformFee / 100).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="收款账户" width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.bankAccount?.bankName }}</div>
            <div style="color: #909399; font-size: 12px">{{ row.bankAccount?.accountNumber }}</div>
            <div style="color: #909399; font-size: 12px">{{ row.bankAccount?.accountName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="申请类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.applyType === 'platform_auto' ? 'info' : 'primary'" size="small">
              {{ row.applyType === 'platform_auto' ? '系统生成' : '门店申请' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="appliedAt" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.appliedAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleConfirmPayment(row)"
            >
              <el-icon><Check /></el-icon>
              确认打款
            </el-button>
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
        @size-change="fetchPendingList"
        @current-change="fetchPendingList"
      />
    </el-card>

    <!-- 打款记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>打款记录</span>
          <div>
            <el-button type="success" size="small" @click="handleExportHistory">
              <el-icon><Download /></el-icon>
              导出记录
            </el-button>
            <el-radio-group v-model="historyStatusFilter" size="small" @change="fetchHistoryList" style="margin-left: 10px">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="completed">已打款</el-radio-button>
              <el-radio-button value="rejected">已驳回</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table
        v-loading="historyLoading"
        :data="historyList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="withdrawalNo" label="提现单号" width="180" />
        <el-table-column prop="storeName" label="门店名称" width="180" show-overflow-tooltip />
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ (row.withdrawalAmount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数" width="100" align="center" />
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
        <el-table-column label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.appliedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="打款时间" width="180">
          <template #default="{ row }">
            {{ row.processedAt ? formatDate(row.processedAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
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
        v-model:current-page="historyPagination.page"
        v-model:page-size="historyPagination.limit"
        :total="historyPagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchHistoryList"
        @current-change="fetchHistoryList"
      />
    </el-card>

    <!-- 确认打款对话框 -->
    <el-dialog
      v-model="confirmDialogVisible"
      title="确认打款"
      width="600px"
    >
      <el-alert
        title="请确保已通过网银完成转账，并上传打款回单"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-descriptions v-if="currentWithdrawal" :column="2" border>
        <el-descriptions-item label="提现单号" :span="2">
          {{ currentWithdrawal.withdrawalNo }}
        </el-descriptions-item>
        <el-descriptions-item label="门店名称" :span="2">
          {{ currentWithdrawal.storeName || '未知门店' }}
        </el-descriptions-item>
        <el-descriptions-item label="提现金额">
          <span style="color: #f56c6c; font-weight: 600; font-size: 16px">
            ¥{{ ((currentWithdrawal.withdrawalAmount || 0) / 100).toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="订单数量">
          {{ currentWithdrawal.orderCount || 0 }} 笔
        </el-descriptions-item>
        <el-descriptions-item label="开户行" :span="2">
          {{ currentWithdrawal.bankAccount?.bankName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="账号" :span="2">
          {{ currentWithdrawal.bankAccount?.accountNumber || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="户名" :span="2">
          {{ currentWithdrawal.bankAccount?.accountName || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-form
        ref="confirmFormRef"
        :model="confirmForm"
        :rules="confirmRules"
        label-width="100px"
        style="margin-top: 20px"
      >
        <el-form-item label="打款回单" prop="paymentProof">
          <el-upload
            v-model:file-list="confirmFileList"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :limit="5"
            accept="image/*,.pdf"
            list-type="picture-card"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div style="margin-top: 5px; color: #909399; font-size: 12px">
            支持jpg、png、pdf格式，最多上传5张
          </div>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="confirmForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（选填）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="confirmPayment"
        >
          确认已打款
        </el-button>
      </template>
    </el-dialog>

    <!-- 生成结算单对话框 -->
    <el-dialog
      v-model="generateDialogVisible"
      title="生成结算单"
      width="600px"
    >
      <el-alert
        title="将自动为所有有待结算余额的门店生成结算单"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-form
        ref="generateFormRef"
        :model="generateForm"
        label-width="100px"
      >
        <el-form-item label="选择门店">
          <el-select
            v-model="generateForm.storeIds"
            multiple
            placeholder="留空则为所有有待结算余额的门店生成结算单"
            style="width: 100%"
          >
            <el-option
              v-for="store in allStores"
              :key="store._id"
              :label="store.name"
              :value="store._id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="confirmGenerateSettlement"
        >
          确认生成
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="提现详情"
      width="700px"
    >
      <el-descriptions v-if="currentWithdrawal" :column="2" border>
        <el-descriptions-item label="提现单号" :span="2">
          {{ currentWithdrawal.withdrawalNo }}
        </el-descriptions-item>
        <el-descriptions-item label="门店名称" :span="2">
          {{ currentWithdrawal.storeName || '未知门店' }}
        </el-descriptions-item>
        <el-descriptions-item label="提现金额">
          <span style="color: #f56c6c; font-weight: 600">
            ¥{{ ((currentWithdrawal.withdrawalAmount || 0) / 100).toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="订单数量">
          {{ currentWithdrawal.orderCount || 0 }} 笔
        </el-descriptions-item>
        <el-descriptions-item label="平台手续费">
          ¥{{ ((currentWithdrawal.platformFee || 0) / 100).toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentWithdrawal.status)">
            {{ getStatusText(currentWithdrawal.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间" :span="2">
          {{ formatDate(currentWithdrawal.appliedAt) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentWithdrawal.processedAt" label="打款时间" :span="2">
          {{ formatDate(currentWithdrawal.processedAt) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentWithdrawal.remark" label="备注" :span="2">
          {{ currentWithdrawal.remark }}
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="currentWithdrawal && (currentWithdrawal.paymentProof || currentWithdrawal.paymentProofs)">
        <el-divider>打款凭证</el-divider>
        <el-image
          v-if="currentWithdrawal.paymentProof"
          :src="currentWithdrawal.paymentProof"
          fit="contain"
          style="width: 100%; max-height: 400px"
          :preview-src-list="[currentWithdrawal.paymentProof]"
        />
        <div v-else-if="currentWithdrawal.paymentProofs && currentWithdrawal.paymentProofs.length > 0">
          <el-carousel
            :initial-index="0"
            height="400px"
            arrow="always"
            indicator-position="outside"
          >
            <el-carousel-item v-for="(image, index) in currentWithdrawal.paymentProofs" :key="index">
              <el-image
                :src="image"
                fit="contain"
                style="width: 100%; height: 100%"
                :preview-src-list="currentWithdrawal.paymentProofs"
                :initial-index="index"
              />
            </el-carousel-item>
          </el-carousel>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Search, Check, Download } from '@element-plus/icons-vue'
import {
  getPendingWithdrawals,
  confirmWithdrawal,
  generateSettlement,
  getWithdrawalList
} from '@/api/withdrawal'
import { getStores } from '@/api/store'
import { exportWithdrawalRecords } from '@/utils/export'
import dayjs from 'dayjs'

const loading = ref(false)
const historyLoading = ref(false)
const submitting = ref(false)

// 统计数据
const stats = ref({
  pending: 0,
  pendingAmount: 0,
  todayPaid: 0,
  monthlyPaid: 0
})

// 筛选条件
const filters = ref({
  storeName: ''
})
const dateRange = ref([])
const historyStatusFilter = ref('')

// 待打款列表
const pendingList = ref([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 打款记录
const historyList = ref([])
const historyPagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 确认打款
const confirmDialogVisible = ref(false)
const confirmFormRef = ref()
const confirmForm = ref({
  paymentProofs: [],
  remark: ''
})
const confirmRules = {
  paymentProofs: [
    { required: true, message: '请上传打款回单', trigger: 'change' }
  ]
}

const confirmFileList = ref([])

// 上传配置
const uploadUrl = computed(() => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  return `${baseURL}/api/upload`
})

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: `Bearer ${token}`
  }
})

// 生成结算单
const generateDialogVisible = ref(false)
const generateFormRef = ref()
const generateForm = ref({
  storeIds: []
})
const allStores = ref([])

// 当前处理的记录
const currentWithdrawal = ref(null)

// 详情
const detailDialogVisible = ref(false)

// 获取待打款列表
const fetchPendingList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (filters.value.storeName) {
      params.storeName = filters.value.storeName
    }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await getPendingWithdrawals(params)
    const list = res.data.list || []

    // 确保收款账户字段存在
    pendingList.value = list.map(item => ({
      ...item,
      bankAccount: item.bankAccount || {}
    }))

    pagination.value.total = res.data.total || 0

    // 更新统计数据
    stats.value.pending = res.data.total || 0
    stats.value.pendingAmount = pendingList.value.reduce((sum, item) => sum + (item.withdrawalAmount || 0), 0) / 100
  } catch (error) {
    console.error('获取待打款列表失败:', error)
    ElMessage.error('获取待打款列表失败')
  } finally {
    loading.value = false
  }
}

// 获取打款记录
const fetchHistoryList = async () => {
  historyLoading.value = true
  try {
    const params = {
      page: historyPagination.value.page,
      limit: historyPagination.value.limit
    }
    if (historyStatusFilter.value) {
      params.status = historyStatusFilter.value
    }
    const res = await getWithdrawalList(params)
    const list = res.data.list || []

    // 确保收款账户字段存在
    historyList.value = list.map(item => ({
      ...item,
      bankAccount: item.bankAccount || {}
    }))

    historyPagination.value.total = res.data.total || 0
  } catch (error) {
    console.error('获取打款记录失败:', error)
    ElMessage.error('获取打款记录失败')
  } finally {
    historyLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchPendingList()
}

// 重置
const handleReset = () => {
  filters.value.storeName = ''
  dateRange.value = []
  pagination.value.page = 1
  fetchPendingList()
}

// 确认打款
const handleConfirmPayment = (row) => {
  // 确保对象包含所有必要的字段
  currentWithdrawal.value = {
    ...row,
    bankAccount: row.bankAccount || {}
  }
  confirmForm.value.paymentProofs = []
  confirmForm.value.remark = ''
  confirmFileList.value = []
  confirmDialogVisible.value = true
}

// 上传前校验
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/') || file.type === 'application/pdf'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片或PDF文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('上传文件大小不能超过 5MB！')
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = (response) => {
  if (response.success) {
    confirmForm.value.paymentProofs.push(response.data.url)
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 移除文件
const handleRemove = (file) => {
  const index = confirmFileList.value.indexOf(file)
  if (index > -1) {
    confirmForm.value.paymentProofs.splice(index, 1)
  }
}

// 确认打款
const confirmPayment = async () => {
  if (confirmForm.value.paymentProofs.length === 0) {
    ElMessage.warning('请上传打款回单')
    return
  }

  submitting.value = true
  try {
    await confirmWithdrawal(currentWithdrawal.value._id, {
      paymentProofs: confirmForm.value.paymentProofs,
      remark: confirmForm.value.remark
    })

    ElMessage.success('打款确认完成')
    confirmDialogVisible.value = false
    fetchPendingList()
    fetchHistoryList()
  } catch (error) {
    console.error('确认打款失败:', error)
    ElMessage.error(error.message || '确认失败')
  } finally {
    submitting.value = false
  }
}

// 生成结算单
const handleGenerateSettlement = async () => {
  try {
    const res = await getStores({ page: 1, limit: 1000 })
    allStores.value = res.data.stores || []
    generateForm.value.storeIds = []
    generateDialogVisible.value = true
  } catch (error) {
    console.error('获取门店列表失败:', error)
    ElMessage.error('获取门店列表失败')
  }
}

// 确认生成结算单
const confirmGenerateSettlement = async () => {
  submitting.value = true
  try {
    await generateSettlement({
      storeIds: generateForm.value.storeIds
    })

    ElMessage.success('结算单生成成功')
    generateDialogVisible.value = false
    fetchPendingList()
  } catch (error) {
    console.error('生成结算单失败:', error)
    ElMessage.error(error.message || '生成失败')
  } finally {
    submitting.value = false
  }
}

// 查看详情
const viewDetail = (row) => {
  // 确保对象包含所有必要的字段
  currentWithdrawal.value = {
    ...row,
    bankAccount: row.bankAccount || {}
  }
  detailDialogVisible.value = true
}

// 查看打款凭证
const viewPaymentProof = (row) => {
  viewDetail(row)
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

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 导出待打款列表
const handleExportPending = async () => {
  try {
    const params = {
      page: 1,
      limit: 9999
    }

    if (filters.value.storeName) {
      params.storeName = filters.value.storeName
    }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await getPendingWithdrawals(params)
    const allRecords = res.data.list || []

    if (allRecords.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    exportWithdrawalRecords(allRecords, '待打款列表')
    ElMessage.success(`已导出 ${allRecords.length} 条待打款记录`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 导出打款记录
const handleExportHistory = async () => {
  try {
    const params = {
      page: 1,
      limit: 9999
    }

    if (historyStatusFilter.value) {
      params.status = historyStatusFilter.value
    }

    const res = await getWithdrawalList(params)
    const allRecords = res.data.list || []

    if (allRecords.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    exportWithdrawalRecords(allRecords, '打款记录')
    ElMessage.success(`已导出 ${allRecords.length} 条打款记录`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchPendingList()
  fetchHistoryList()
})
</script>

<style scoped lang="scss">
.settlement-management-page {
  .stat-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.stat-card-warning :deep(.el-statistic__number) {
      color: #e6a23c;
    }

    &.stat-card-success :deep(.el-statistic__number) {
      color: #67c23a;
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

  .search-form {
    margin-bottom: 20px;
  }

  :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
  }

  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 100px;
    height: 100px;
  }
}
</style>
