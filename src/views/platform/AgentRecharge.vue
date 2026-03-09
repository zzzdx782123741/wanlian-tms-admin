<template>
  <div class="agent-recharge-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>代客充值</span>
          <el-tag type="info">
            平台运营代车队提交充值申请
          </el-tag>
        </div>
      </template>

      <el-form
        ref="rechargeFormRef"
        :model="rechargeForm"
        :rules="rechargeRules"
        label-width="140px"
      >
        <el-form-item
          label="车队"
          prop="fleetId"
        >
          <el-select
            v-model="rechargeForm.fleetId"
            placeholder="请选择车队"
            :disabled="submitting"
            filterable
            style="width: 400px"
            @change="handleFleetChange"
          >
            <el-option
              v-for="fleet in fleetList"
              :key="fleet._id"
              :label="fleet.name"
              :value="fleet._id"
            >
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>{{ fleet.name }}</span>
                <span
                  v-if="fleet.account"
                  style="color: #909399; font-size: 12px"
                >
                  余额：¥{{ (fleet.account.balance / 100).toFixed(2) }}
                </span>
              </div>
            </el-option>
          </el-select>
          <div
            v-if="selectedFleet"
            style="margin-top: 5px; color: #909399; font-size: 12px"
          >
            当前余额：¥{{ (selectedFleet.account?.balance / 100).toFixed(2) }}
          </div>
        </el-form-item>

        <el-form-item
          label="充值金额"
          prop="amount"
        >
          <el-input-number
            v-model="rechargeForm.amount"
            :min="100"
            :max="1000000"
            :precision="2"
            :step="100"
            :disabled="submitting"
            style="width: 300px"
          />
          <span style="margin-left: 10px; color: #909399">元</span>
        </el-form-item>

        <el-form-item
          label="汇款方户名"
          prop="remitterName"
        >
          <el-input
            v-model="rechargeForm.remitterName"
            placeholder="请输入汇款账户名称"
            :disabled="submitting"
            style="width: 400px"
          />
        </el-form-item>

        <el-form-item
          label="收款账户"
          prop="receiverAccountId"
        >
          <el-select
            v-model="rechargeForm.receiverAccountId"
            placeholder="请选择收款账户"
            :disabled="submitting"
            style="width: 400px"
          >
            <el-option
              v-for="account in platformAccounts"
              :key="account._id"
              :label="`${account.bankName} - ${account.accountNumber}`"
              :value="account._id"
            >
              <div style="display: flex; justify-content: space-between">
                <span>{{ account.bankName }}</span>
                <span style="color: #8492a6; font-size: 12px">{{ account.accountNumber }}</span>
              </div>
            </el-option>
          </el-select>
          <div style="margin-top: 5px; color: #909399; font-size: 12px">
            请选择平台对公账户进行转账
          </div>
        </el-form-item>

        <el-form-item
          label="打款日期"
          prop="transferDate"
        >
          <el-date-picker
            v-model="rechargeForm.transferDate"
            type="date"
            placeholder="请选择打款日期"
            :disabled="submitting"
            value-format="YYYY-MM-DD"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item
          label="转账凭证"
          prop="proofImages"
        >
          <el-upload
            v-model:file-list="fileList"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :limit="5"
            :disabled="submitting"
            accept="image/*,.pdf"
            list-type="picture-card"
            name="file"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div style="margin-top: 5px; color: #909399; font-size: 12px">
            支持jpg、png、pdf格式，最多上传5张，单张不超过5MB
          </div>
        </el-form-item>

        <el-form-item
          label="备注"
          prop="remark"
        >
          <el-input
            v-model="rechargeForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（选填）"
            :disabled="submitting"
            style="width: 500px"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            提交充值申请
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

    <!-- 最近充值记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>最近代客充值记录</span>
          <el-button
            type="primary"
            link
            size="small"
            @click="viewAllRecords"
          >
            查看全部
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="recentRecords"
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
            <span style="color: #67c23a; font-weight: 600">
              ¥{{ (row.amount / 100).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="remitterName"
          label="汇款方"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column
          label="凭证"
          width="80"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.proofImages && row.proofImages.length > 0"
              size="small"
            >
              {{ row.proofImages.length }}张
            </el-tag>
            <span
              v-else
              style="color: #ccc"
            >无</span>
          </template>
        </el-table-column>
        <el-table-column
          label="审核状态"
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
          label="申请时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.appliedAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="100"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              link
              type="primary"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="充值详情"
      width="600px"
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
        <el-descriptions-item label="充值金额">
          <span style="color: #67c23a; font-weight: 600">
            ¥{{ (currentRecord.amount / 100).toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="汇款方户名">
          {{ currentRecord.remitterName }}
        </el-descriptions-item>
        <el-descriptions-item label="收款账户">
          {{ currentRecord.receiverAccount?.bankName }} - {{ currentRecord.receiverAccount?.accountNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="打款日期">
          {{ currentRecord.transferDate }}
        </el-descriptions-item>
        <el-descriptions-item label="申请类型">
          <el-tag type="info">
            平台代客充值
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getStatusType(currentRecord.status)">
            {{ getStatusText(currentRecord.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentRecord.status !== 'pending'"
          label="审核金额"
        >
          ¥{{ (currentRecord.actualAmount / 100).toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentRecord.reviewRemark"
          label="审核备注"
        >
          {{ currentRecord.reviewRemark }}
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">
          {{ formatDate(currentRecord.appliedAt) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentRecord.reviewedAt"
          label="审核时间"
        >
          {{ formatDate(currentRecord.reviewedAt) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentRecord.remark"
          label="备注"
        >
          {{ currentRecord.remark }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 凭证预览 -->
      <template v-if="currentRecord && currentRecord.proofImages && currentRecord.proofImages.length > 0">
        <el-divider>转账凭证</el-divider>
        <el-carousel
          :initial-index="0"
          height="400px"
          arrow="always"
          indicator-position="outside"
        >
          <el-carousel-item
            v-for="(image, index) in currentRecord.proofImages"
            :key="index"
          >
            <el-image
              :src="image"
              fit="contain"
              style="width: 100%; height: 100%"
              :preview-src-list="currentRecord.proofImages"
              :initial-index="index"
            />
          </el-carousel-item>
        </el-carousel>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createAgentRecharge, getRechargeList } from '@/api/recharge'
import { getFleets } from '@/api/fleet'
import { getPlatformBankAccounts } from '@/api/platform'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const router = useRouter()
const rechargeFormRef = ref()
const loading = ref(false)
const submitting = ref(false)

const rechargeForm = ref({
  fleetId: '',
  amount: 1000,
  remitterName: '',
  receiverAccountId: '',
  transferDate: '',
  proofImages: [],
  remark: ''
})

const rechargeRules = {
  fleetId: [
    { required: true, message: '请选择车队', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入充值金额', trigger: 'blur' },
    { type: 'number', min: 100, message: '充值金额不能少于100元', trigger: 'blur' }
  ],
  remitterName: [
    { required: true, message: '请输入汇款方户名', trigger: 'blur' }
  ],
  receiverAccountId: [
    { required: true, message: '请选择收款账户', trigger: 'change' }
  ],
  transferDate: [
    { required: true, message: '请选择打款日期', trigger: 'change' }
  ],
  proofImages: [
    { required: true, message: '请上传转账凭证', trigger: 'change' }
  ]
}

// 车队列表
const fleetList = ref([])
const selectedFleet = ref(null)

// 平台收款账户
const platformAccounts = ref([])

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

const fileList = ref([])

// 最近充值记录
const recentRecords = ref([])

// 详情
const detailDialogVisible = ref(false)
const currentRecord = ref(null)

// 获取车队列表
const fetchFleets = async () => {
  try {
    const res = await getFleets({ page: 1, limit: 1000 })
    fleetList.value = res.data.fleets || []
  } catch (error) {
    console.error('获取车队列表失败:', error)
    ElMessage.error('获取车队列表失败')
  }
}

// 获取平台收款账户
const fetchPlatformAccounts = async () => {
  try {
    const res = await getPlatformBankAccounts()
    platformAccounts.value = res.data.filter(acc => acc.status?.type === 'active')
  } catch (error) {
    console.error('获取平台收款账户失败:', error)
  }
}

// 车队选择变化
const handleFleetChange = (fleetId) => {
  selectedFleet.value = fleetList.value.find(f => f._id === fleetId)
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
const handleUploadSuccess = (response, file) => {
  if (response.success) {
    rechargeForm.value.proofImages.push(response.data.url)
  } else {
    ElMessage.error(response.message || '上传失败')
    const index = fileList.value.indexOf(file)
    if (index > -1) {
      fileList.value.splice(index, 1)
    }
  }
}

// 移除文件
const handleRemove = (file) => {
  const index = fileList.value.indexOf(file)
  if (index > -1) {
    rechargeForm.value.proofImages.splice(index, 1)
  }
}

// 提交代客充值
const handleSubmit = async () => {
  const valid = await rechargeFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (rechargeForm.value.proofImages.length === 0) {
    ElMessage.warning('请上传转账凭证')
    return
  }

  submitting.value = true
  try {
    // 将元转换为分（后端存储的是分）
    const submitData = {
      ...rechargeForm.value,
      amount: Math.round(rechargeForm.value.amount * 100)
    }
    await createAgentRecharge(submitData)
    ElMessage.success('代客充值申请已提交，等待财务审核')
    handleReset()
    fetchRecentRecords()
  } catch (error) {
    console.error('提交代客充值失败:', error)
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const handleReset = () => {
  rechargeFormRef.value.resetFields()
  rechargeForm.value = {
    fleetId: '',
    amount: 1000,
    remitterName: '',
    receiverAccountId: '',
    transferDate: '',
    proofImages: [],
    remark: ''
  }
  fileList.value = []
  selectedFleet.value = null
}

// 获取最近充值记录
const fetchRecentRecords = async () => {
  loading.value = true
  try {
    const res = await getRechargeList({
      page: 1,
      limit: 10,
      applyType: 'platform_agent'
    })
    recentRecords.value = res.data.list || []
  } catch (error) {
    console.error('获取充值记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 查看全部记录
const viewAllRecords = () => {
  router.push('/recharge-audit')
}

// 查看详情
const viewDetail = (row) => {
  currentRecord.value = row
  detailDialogVisible.value = true
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return map[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已驳回'
  }
  return map[status] || status
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchFleets()
  fetchPlatformAccounts()
  fetchRecentRecords()
})
</script>

<style scoped lang="scss">
.agent-recharge-page {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;
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
