<template>
  <div class="recharge-audit-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="待审核"
            :value="stats.pending"
          >
            <template #suffix>
              笔
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="今日已审核"
            :value="stats.todayApproved"
          >
            <template #suffix>
              笔
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="今日审核金额"
            :value="stats.todayAmount"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-info">
          <el-statistic
            title="本月充值"
            :value="stats.monthlyAmount"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签页：待审核列表 + 历史审核记录 -->
    <el-card style="margin-top: 20px">
      <el-tabs
        v-model="activeTab"
        @tab-change="handleTabChange"
      >
        <!-- 待审核列表 -->
        <el-tab-pane
          label="待审核列表"
          name="pending"
        >
          <template #header>
            <div class="card-header">
              <span>充值审核队列</span>
              <div class="header-actions">
                <el-button
                  type="success"
                  size="small"
                  @click="handleExport"
                >
                  <el-icon><Download /></el-icon>
                  导出列表
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  @click="fetchPendingList"
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
            <el-form-item label="车队名称">
              <el-input
                v-model="filters.fleetName"
                placeholder="请输入车队名称"
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
            :data="pendingList"
            stripe
            style="width: 100%"
          >
            <el-table-column
              type="selection"
              width="55"
            />
            <el-table-column
              prop="rechargeNo"
              label="充值单号"
              width="180"
              fixed="left"
            />
            <el-table-column
              prop="fleetName"
              label="车队名称"
              width="180"
              show-overflow-tooltip
            />
            <el-table-column
              label="充值金额"
              width="120"
              align="right"
              fixed="left"
            >
              <template #default="{ row }">
                <span style="color: #67c23a; font-weight: 600; font-size: 15px">
                  ¥{{ (row.amount / 100).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              prop="remitterName"
              label="汇款方"
              width="200"
              show-overflow-tooltip
            />
            <el-table-column
              label="收款账户"
              width="200"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.receiverAccountId?.bankName }}<br>
                <span style="color: #909399; font-size: 12px">{{ row.receiverAccountId?.accountNumber }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="凭证"
              width="100"
            >
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="viewProofImages(row)"
                >
                  <el-icon><View /></el-icon>
                  查看({{ row.proofImages?.length || 0 }})
                </el-button>
              </template>
            </el-table-column>
            <el-table-column
              label="打款日期"
              width="120"
            >
              <template #default="{ row }">
                {{ formatDate(row.transferDate) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="appliedAt"
              label="申请时间"
              width="180"
            >
              <template #default="{ row }">
                {{ formatDate(row.appliedAt) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="appliedBy.nickname"
              label="申请人"
              width="120"
            />
            <el-table-column
              prop="remark"
              label="备注"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column
              label="操作"
              width="200"
              fixed="right"
            >
              <template #default="{ row }">
                <el-button
                  type="success"
                  size="small"
                  @click="handleApprove(row)"
                >
                  <el-icon><Select /></el-icon>
                  通过
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleReject(row)"
                >
                  <el-icon><Close /></el-icon>
                  驳回
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
        </el-tab-pane>

        <!-- 历史审核记录 -->
        <el-tab-pane
          label="历史审核记录"
          name="reviewed"
        >
          <template #header>
            <div class="card-header">
              <span>历史审核记录</span>
              <div class="header-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="fetchReviewedList"
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
            <el-form-item label="车队名称">
              <el-input
                v-model="reviewedFilters.fleetName"
                placeholder="请输入车队名称"
                clearable
                style="width: 200px"
                @clear="handleReviewedSearch"
              />
            </el-form-item>
            <el-form-item label="审核状态">
              <el-select
                v-model="reviewedFilters.status"
                placeholder="全部状态"
                clearable
                style="width: 150px"
                @clear="handleReviewedSearch"
              >
                <el-option
                  label="已通过"
                  value="approved"
                />
                <el-option
                  label="已驳回"
                  value="rejected"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="审核时间">
              <el-date-picker
                v-model="reviewedDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 240px"
              />
            </el-form-item>
            <el-form-item>
              <div class="form-actions">
                <el-button
                  type="primary"
                  @click="handleReviewedSearch"
                >
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button @click="handleReviewedReset">
                  重置
                </el-button>
              </div>
            </el-form-item>
          </el-form>

          <!-- 历史记录表格 -->
          <el-table
            v-loading="reviewedLoading"
            :data="reviewedList"
            stripe
            style="width: 100%"
          >
            <el-table-column
              prop="rechargeNo"
              label="充值单号"
              width="180"
            />
            <el-table-column
              prop="fleetName"
              label="车队名称"
              width="180"
              show-overflow-tooltip
            />
            <el-table-column
              label="充值金额"
              width="120"
              align="right"
            >
              <template #default="{ row }">
                <span style="color: #409eff; font-weight: 600">
                  ¥{{ (row.amount / 100).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              label="审核状态"
              width="100"
            >
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'approved' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.status === 'approved' ? '已通过' : '已驳回' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="reviewedBy.nickname"
              label="审核人"
              width="120"
            />
            <el-table-column
              label="审核时间"
              width="180"
            >
              <template #default="{ row }">
                {{ formatDate(row.reviewedAt) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="reviewRemark"
              label="审核备注"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column
              label="操作"
              width="100"
              fixed="right"
            >
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="viewReviewedDetail(row)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 历史记录分页 -->
          <el-pagination
            v-model:current-page="reviewedPagination.page"
            v-model:page-size="reviewedPagination.limit"
            :total="reviewedPagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            style="margin-top: 20px; justify-content: flex-end"
            @size-change="fetchReviewedList"
            @current-change="fetchReviewedList"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 凭证预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="转账凭证预览"
      width="900px"
    >
      <el-carousel
        v-if="previewImages.length > 0"
        :initial-index="previewIndex"
        height="600px"
        arrow="always"
        indicator-position="outside"
      >
        <el-carousel-item
          v-for="(image, index) in previewImages"
          :key="index"
        >
          <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5">
            <el-image
              :src="image"
              fit="contain"
              style="max-width: 100%; max-height: 100%"
              :preview-src-list="previewImages"
              :initial-index="index"
            />
          </div>
        </el-carousel-item>
      </el-carousel>
      <div style="text-align: center; margin-top: 10px; color: #909399">
        提示：点击图片可以放大查看，使用鼠标滚轮可以缩放
      </div>
    </el-dialog>

    <!-- 审核通过对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="审核通过确认"
      width="500px"
    >
      <el-descriptions
        v-if="currentRecord"
        :column="1"
        border
      >
        <el-descriptions-item label="充值单号">
          {{ currentRecord.rechargeNo }}
        </el-descriptions-item>
        <el-descriptions-item label="车队名称">
          {{ currentRecord.fleetName }}
        </el-descriptions-item>
        <el-descriptions-item label="申请金额">
          <span style="color: #67c23a; font-weight: 600">
            ¥{{ (currentRecord.amount / 100).toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="汇款方">
          {{ currentRecord.remitterName }}
        </el-descriptions-item>
      </el-descriptions>

      <el-form
        ref="approveFormRef"
        :model="approveForm"
        :rules="approveRules"
        label-width="100px"
        style="margin-top: 20px"
      >
        <el-form-item
          label="实际到账"
          prop="actualAmount"
        >
          <el-input-number
            v-model="approveForm.actualAmount"
            :min="0"
            :max="1000000"
            :precision="2"
            :step="100"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399">元（若与申请金额不一致请修改）</span>
        </el-form-item>
        <el-form-item
          label="审核备注"
          prop="reviewRemark"
        >
          <el-input
            v-model="approveForm.reviewRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注（选填）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approveDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="success"
          :loading="submitting"
          @click="confirmApprove"
        >
          确认通过并充值
        </el-button>
      </template>
    </el-dialog>

    <!-- 驳回对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="驳回充值申请"
      width="500px"
    >
      <el-alert
        title="驳回后车队需要重新提交申请"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-descriptions
        v-if="currentRecord"
        :column="1"
        border
      >
        <el-descriptions-item label="充值单号">
          {{ currentRecord.rechargeNo }}
        </el-descriptions-item>
        <el-descriptions-item label="车队名称">
          {{ currentRecord.fleetName }}
        </el-descriptions-item>
        <el-descriptions-item label="申请金额">
          ¥{{ (currentRecord.amount / 100).toFixed(2) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-form
        ref="rejectFormRef"
        :model="rejectForm"
        :rules="rejectRules"
        label-width="100px"
        style="margin-top: 20px"
      >
        <el-form-item
          label="驳回原因"
          prop="reviewRemark"
        >
          <el-input
            v-model="rejectForm.reviewRemark"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因（必填）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rejectDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="danger"
          :loading="submitting"
          @click="confirmReject"
        >
          确认驳回
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, View, Select, Close, Download } from '@element-plus/icons-vue'
import {
  getPendingRecharges,
  getReviewedRecharges,
  approveRecharge,
  rejectRecharge,
  getRechargeList,
  getRechargeStats
} from '@/api/recharge'
import { exportRechargeRecords } from '@/utils/export'
import { getImageUrl, getImageUrls } from '@/utils/image'
import dayjs from 'dayjs'

// 当前激活的标签页
const activeTab = ref('pending')

const loading = ref(false)
const reviewedLoading = ref(false)
const submitting = ref(false)

// 统计数据
const stats = ref({
  pending: 0,
  todayApproved: 0,
  todayAmount: 0,
  monthlyAmount: 0
})

// 筛选条件
const filters = ref({
  fleetName: ''
})
const dateRange = ref([])

// 待审核列表
const pendingList = ref([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 凭证预览
const previewDialogVisible = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)

// 审核通过
const approveDialogVisible = ref(false)
const approveFormRef = ref()
const approveForm = ref({
  actualAmount: 0,
  reviewRemark: ''
})
const approveRules = {
  actualAmount: [
    { required: true, message: '请输入实际到账金额', trigger: 'blur' }
  ]
}

// 驳回
const rejectDialogVisible = ref(false)
const rejectFormRef = ref()
const rejectForm = ref({
  reviewRemark: ''
})
const rejectRules = {
  reviewRemark: [
    { required: true, message: '请输入驳回原因', trigger: 'blur' }
  ]
}

// 当前处理的记录
const currentRecord = ref(null)

// 历史审核记录
const reviewedList = ref([])
const reviewedPagination = ref({
  page: 1,
  limit: 20,
  total: 0
})
const reviewedFilters = ref({
  fleetName: '',
  status: ''
})
const reviewedDateRange = ref([])

const formatLocalDate = (date) => dayjs(date).format('YYYY-MM-DD')

// 获取统计数据
const fetchStats = async () => {
  try {
    const today = new Date()
    const todayStart = formatLocalDate(today)
    const todayEnd = formatLocalDate(today)

    const monthStart = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1))
    const monthEnd = formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0))

    const [pendingRes, todayRes, monthRes] = await Promise.all([
      getPendingRecharges({ page: 1, limit: 1 }),
      getRechargeStats({ startDate: todayStart, endDate: todayEnd }),
      getRechargeStats({ startDate: monthStart, endDate: monthEnd })
    ])

    stats.value.pending = pendingRes.data.total || 0
    stats.value.todayApproved = (todayRes.data.approved?.count || 0) + (todayRes.data.rejected?.count || 0)
    stats.value.todayAmount = (todayRes.data.approved?.total || 0) / 100
    stats.value.monthlyAmount = (monthRes.data.approved?.total || 0) / 100
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取待审核列表
const fetchPendingList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (filters.value.fleetName) {
      params.fleetName = filters.value.fleetName
    }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await getPendingRecharges(params)
    pendingList.value = res.data.list || []
    pagination.value.total = res.data.total || 0

    // 更新待审核数量
    stats.value.pending = res.data.total || 0
  } catch (error) {
    console.error('获取待审核列表失败:', error)
    ElMessage.error('获取待审核列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchPendingList()
}

// 重置
const handleReset = () => {
  filters.value.fleetName = ''
  dateRange.value = []
  pagination.value.page = 1
  fetchPendingList()
}

// 查看凭证
const viewProofImages = (row) => {
  previewImages.value = getImageUrls(row.proofImages || [])
  previewIndex.value = 0
  previewDialogVisible.value = true
}

// 审核通过
const handleApprove = async (row) => {
  currentRecord.value = row
  approveForm.value.actualAmount = row.amount / 100
  approveForm.value.reviewRemark = ''
  approveDialogVisible.value = true
}

// 确认通过
const confirmApprove = async () => {
  const valid = await approveFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await approveRecharge(currentRecord.value._id, {
      actualAmount: Math.round(approveForm.value.actualAmount * 100),
      reviewRemark: approveForm.value.reviewRemark
    })

    ElMessage.success({
      message: `审核通过！车队 ${currentRecord.value.fleetName} 余额已增加 ¥${approveForm.value.actualAmount.toFixed(2)}`,
      duration: 5000
    })

    approveDialogVisible.value = false
    fetchPendingList()
    fetchStats()
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error(error.message || '审核失败')
  } finally {
    submitting.value = false
  }
}

// 驳回
const handleReject = async (row) => {
  currentRecord.value = row
  rejectForm.value.reviewRemark = ''
  rejectDialogVisible.value = true
}

// 确认驳回
const confirmReject = async () => {
  const valid = await rejectFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await rejectRecharge(currentRecord.value._id, {
      reviewRemark: rejectForm.value.reviewRemark
    })

    ElMessage.success('已驳回该充值申请')
    rejectDialogVisible.value = false
    fetchPendingList()
    fetchStats()
  } catch (error) {
    console.error('驳回失败:', error)
    ElMessage.error(error.message || '驳回失败')
  } finally {
    submitting.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 标签页切换
const handleTabChange = (tabName) => {
  if (tabName === 'pending') {
    fetchPendingList()
  } else if (tabName === 'reviewed') {
    fetchReviewedList()
  }
}

// 获取历史审核记录
const fetchReviewedList = async () => {
  reviewedLoading.value = true
  try {
    const params = {
      page: reviewedPagination.value.page,
      limit: reviewedPagination.value.limit
    }

    if (reviewedFilters.value.fleetName) {
      params.fleetName = reviewedFilters.value.fleetName
    }

    if (reviewedFilters.value.status) {
      params.status = reviewedFilters.value.status
    }

    if (reviewedDateRange.value && reviewedDateRange.value.length === 2) {
      params.startDate = reviewedDateRange.value[0]
      params.endDate = reviewedDateRange.value[1]
    }

    const res = await getReviewedRecharges(params)
    reviewedList.value = res.data.list || []
    reviewedPagination.value.total = res.data.total || 0
  } catch (error) {
    console.error('获取历史审核记录失败:', error)
    ElMessage.error('获取历史审核记录失败')
  } finally {
    reviewedLoading.value = false
  }
}

// 历史记录搜索
const handleReviewedSearch = () => {
  reviewedPagination.value.page = 1
  fetchReviewedList()
}

// 历史记录重置
const handleReviewedReset = () => {
  reviewedFilters.value.fleetName = ''
  reviewedFilters.value.status = ''
  reviewedDateRange.value = []
  reviewedPagination.value.page = 1
  fetchReviewedList()
}

// 查看历史记录详情
const viewReviewedDetail = (row) => {
  const statusText = row.status === 'approved' ? '已通过' : '已驳回'
  const actualAmount = row.actualAmount ? (row.actualAmount / 100).toFixed(2) : (row.amount / 100).toFixed(2)

  ElMessageBox.alert(
    `
    <div style="line-height: 1.8">
      <p><strong>充值单号：</strong>${row.rechargeNo}</p>
      <p><strong>车队名称：</strong>${row.fleetName}</p>
      <p><strong>申请金额：</strong>¥${(row.amount / 100).toFixed(2)}</p>
      <p><strong>实际到账：</strong>¥${actualAmount}</p>
      <p><strong>审核状态：</strong>${statusText}</p>
      <p><strong>审核人：</strong>${row.reviewedBy?.nickname || '-'}</p>
      <p><strong>审核时间：</strong>${formatDate(row.reviewedAt)}</p>
      ${row.reviewRemark ? `<p><strong>审核备注：</strong>${row.reviewRemark}</p>` : ''}
      ${row.rejectReason ? `<p><strong>驳回原因：</strong>${row.rejectReason}</p>` : ''}
    </div>
    `,
    '审核记录详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 导出待审核列表
const handleExport = async () => {
  try {
    // 获取所有待审核记录
    const params = {
      page: 1,
      limit: 9999
    }

    if (filters.value.fleetName) {
      params.fleetName = filters.value.fleetName
    }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await getPendingRecharges(params)
    const allRecords = res.data.list || []

    if (allRecords.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    exportRechargeRecords(allRecords, '待审核充值列表')
    ElMessage.success(`已导出 ${allRecords.length} 条待审核记录`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchStats()
  fetchPendingList()
})
</script>

<style scoped lang="scss">
.recharge-audit-page {
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .search-form {
    margin-bottom: 20px;

    .form-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}
</style>
