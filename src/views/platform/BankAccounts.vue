<template>
  <div class="bank-accounts-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>平台收款账户管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增账户
          </el-button>
        </div>
      </template>

      <div class="filter-section">
        <el-form :inline="true" :model="filters">
          <el-form-item label="收款方式">
            <el-select v-model="filters.paymentMethod" placeholder="全部方式" clearable style="width: 180px" @change="loadAccounts">
              <el-option label="全部" value="" />
              <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 160px" @change="loadAccounts">
              <el-option label="全部" value="" />
              <el-option label="启用" value="active" />
              <el-option label="冻结" value="frozen" />
              <el-option label="关闭" value="closed" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ statistics.total }}</div>
            <div class="stat-label">账户总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ statistics.active }}</div>
            <div class="stat-label">启用账户</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ statistics.default }}</div>
            <div class="stat-label">默认账户</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">¥ {{ formatCentAmount(statistics.totalReceived) }}</div>
            <div class="stat-label">累计收款</div>
          </div>
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="accountList" stripe>
        <el-table-column label="收款方式" width="140">
          <template #default="{ row }">
            <el-tag :type="getPaymentMethodColor(row.paymentMethod)" size="small">
              {{ getPaymentMethodText(row.paymentMethod) }}
            </el-tag>
            <el-tag v-if="row.isDefault" type="success" size="small" style="margin-left: 6px">
              默认
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="账户信息" min-width="260">
          <template #default="{ row }">
            <div class="account-info">
              <div class="account-name">{{ getAccountDisplayName(row) }}</div>
              <div class="account-detail">{{ getAccountDetail(row) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="使用场景" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="scenario in row.usageScenarios || []" :key="scenario" size="small" class="scenario-tag">
              {{ getScenarioText(scenario) }}
            </el-tag>
            <span v-if="!row.usageScenarios || row.usageScenarios.length === 0">-</span>
          </template>
        </el-table-column>

        <el-table-column label="联系人" min-width="180">
          <template #default="{ row }">
            <div>{{ row.contactPerson || '-' }}</div>
            <div class="muted-text">{{ row.contactPhone || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status?.type)" size="small">
              {{ getStatusText(row.status?.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="累计收款" width="160" align="right">
          <template #default="{ row }">
            <div>¥ {{ formatCentAmount(row.totalReceived || 0) }}</div>
            <div class="muted-text">{{ row.transactionCount || 0 }} 笔</div>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row.isDefault" type="success" size="small" link @click="handleSetDefault(row)">设为默认</el-button>
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" size="small" link @click="openStatusDialog(row)">状态</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="收款方式" prop="paymentMethod">
          <el-select v-model="formData.paymentMethod" placeholder="请选择收款方式" :disabled="isEdit" style="width: 100%" @change="handlePaymentMethodChange">
            <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <template v-if="formData.paymentMethod === 'bank'">
          <el-form-item label="账户名称" prop="accountName">
            <el-input v-model="formData.accountName" placeholder="请输入账户名称" />
          </el-form-item>
          <el-form-item label="开户银行" prop="bankName">
            <el-input v-model="formData.bankName" placeholder="请输入开户银行" />
          </el-form-item>
          <el-form-item label="银行账号" prop="accountNumber">
            <el-input v-model="formData.accountNumber" placeholder="请输入银行账号" />
          </el-form-item>
          <el-form-item label="开户支行">
            <el-input v-model="formData.branch" placeholder="选填" />
          </el-form-item>
        </template>

        <template v-if="formData.paymentMethod === 'alipay'">
          <el-form-item label="支付宝账号" prop="alipayAccount.accountId">
            <el-input v-model="formData.alipayAccount.accountId" placeholder="请输入支付宝企业账号" />
          </el-form-item>
          <el-form-item label="企业名称" prop="alipayAccount.companyName">
            <el-input v-model="formData.alipayAccount.companyName" placeholder="请输入企业名称" />
          </el-form-item>
          <el-form-item label="Partner ID">
            <el-input v-model="formData.alipayAccount.pid" placeholder="选填" />
          </el-form-item>
        </template>

        <template v-if="formData.paymentMethod === 'wechat'">
          <el-form-item label="商户号" prop="wechatAccount.merchantId">
            <el-input v-model="formData.wechatAccount.merchantId" placeholder="请输入微信商户号" />
          </el-form-item>
          <el-form-item label="商户名称" prop="wechatAccount.merchantName">
            <el-input v-model="formData.wechatAccount.merchantName" placeholder="请输入商户名称" />
          </el-form-item>
          <el-form-item label="子商户号">
            <el-input v-model="formData.wechatAccount.subMchId" placeholder="选填" />
          </el-form-item>
        </template>

        <template v-if="formData.paymentMethod === 'aggregation'">
          <el-form-item label="服务商" prop="aggregationAccount.provider">
            <el-select v-model="formData.aggregationAccount.provider" placeholder="请选择服务商" style="width: 100%">
              <el-option label="银联" value="unionpay" />
              <el-option label="拉卡拉" value="lakala" />
              <el-option label="畅捷通" value="chinapay" />
            </el-select>
          </el-form-item>
          <el-form-item label="商户号" prop="aggregationAccount.merchantId">
            <el-input v-model="formData.aggregationAccount.merchantId" placeholder="请输入商户号" />
          </el-form-item>
          <el-form-item label="终端号">
            <el-input v-model="formData.aggregationAccount.terminalId" placeholder="选填" />
          </el-form-item>
        </template>

        <template v-if="formData.paymentMethod === 'yopay'">
          <el-form-item label="易宝商户号" prop="yopayAccount.merchantId">
            <el-input v-model="formData.yopayAccount.merchantId" placeholder="请输入易宝商户号" />
          </el-form-item>
          <el-form-item label="客户编码" prop="yopayAccount.customerCode">
            <el-input v-model="formData.yopayAccount.customerCode" placeholder="请输入客户编码" />
          </el-form-item>
          <el-form-item label="账户名称">
            <el-input v-model="formData.yopayAccount.accountName" placeholder="选填" />
          </el-form-item>
        </template>

        <template v-if="formData.paymentMethod === 'jsbank_wallet'">
          <el-form-item label="钱包 ID" prop="jsbankWallet.walletId">
            <el-input v-model="formData.jsbankWallet.walletId" placeholder="请输入钱包 ID" />
          </el-form-item>
          <el-form-item label="钱包名称">
            <el-input v-model="formData.jsbankWallet.walletName" placeholder="选填" />
          </el-form-item>
          <el-form-item label="商户编码" prop="jsbankWallet.merchantCode">
            <el-input v-model="formData.jsbankWallet.merchantCode" placeholder="请输入商户编码" />
          </el-form-item>
        </template>

        <el-divider />

        <el-form-item label="联系人">
          <el-input v-model="formData.contactPerson" placeholder="选填" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="formData.contactPhone" placeholder="选填，填写时需符合手机号格式" />
        </el-form-item>
        <el-form-item label="使用场景" prop="usageScenarios">
          <el-checkbox-group v-model="formData.usageScenarios">
            <el-checkbox label="fleet_recharge">车队充值</el-checkbox>
            <el-checkbox label="order_payment">订单收款</el-checkbox>
            <el-checkbox label="store_settlement">门店结算</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="formData.isDefault" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="更新账户状态" width="420px">
      <el-form :model="statusForm" label-width="90px">
        <el-form-item label="状态">
          <el-select v-model="statusForm.status" style="width: 100%">
            <el-option label="启用" value="active" />
            <el-option label="冻结" value="frozen" />
            <el-option label="关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="statusForm.reason" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="statusSubmitting" @click="submitStatusUpdate">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import {
  buildBankAccountNumberRules,
  buildPhoneRules,
  normalizeBankAccountNumber,
  normalizePhone,
  trimValue
} from '@/utils/formValidators'

const paymentMethodOptions = [
  { label: '银行卡', value: 'bank' },
  { label: '支付宝', value: 'alipay' },
  { label: '微信支付', value: 'wechat' },
  { label: '聚合支付', value: 'aggregation' },
  { label: '易宝支付', value: 'yopay' },
  { label: '江苏银行钱包', value: 'jsbank_wallet' }
]

function createEmptyFormData() {
  return {
    paymentMethod: '',
    accountName: '',
    bankName: '',
    accountNumber: '',
    branch: '',
    contactPerson: '',
    contactPhone: '',
    remark: '',
    usageScenarios: [],
    isDefault: false,
    alipayAccount: {
      accountId: '',
      companyName: '',
      pid: ''
    },
    wechatAccount: {
      merchantId: '',
      merchantName: '',
      subMchId: ''
    },
    aggregationAccount: {
      provider: '',
      merchantId: '',
      terminalId: ''
    },
    yopayAccount: {
      merchantId: '',
      customerCode: '',
      accountName: ''
    },
    jsbankWallet: {
      walletId: '',
      walletName: '',
      merchantCode: ''
    }
  }
}

const loading = ref(false)
const submitting = ref(false)
const statusSubmitting = ref(false)
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const isEdit = ref(false)
const currentAccountId = ref('')
const currentStatusAccountId = ref('')
const formRef = ref(null)

const filters = reactive({
  paymentMethod: '',
  status: ''
})

const statusForm = reactive({
  status: 'active',
  reason: ''
})

const accountList = ref([])
const formData = reactive(createEmptyFormData())

const dialogTitle = computed(() => (isEdit.value ? '编辑收款账户' : '新增收款账户'))

const statistics = computed(() => {
  const list = accountList.value
  return {
    total: list.length,
    active: list.filter(item => item.status?.type === 'active').length,
    default: list.filter(item => item.isDefault).length,
    totalReceived: list.reduce((sum, item) => sum + Number(item.totalReceived || 0), 0)
  }
})

function assignFormData(data = {}) {
  const next = createEmptyFormData()
  Object.assign(next, data)
  next.alipayAccount = { ...createEmptyFormData().alipayAccount, ...(data.alipayAccount || {}) }
  next.wechatAccount = { ...createEmptyFormData().wechatAccount, ...(data.wechatAccount || {}) }
  next.aggregationAccount = { ...createEmptyFormData().aggregationAccount, ...(data.aggregationAccount || {}) }
  next.yopayAccount = { ...createEmptyFormData().yopayAccount, ...(data.yopayAccount || {}) }
  next.jsbankWallet = { ...createEmptyFormData().jsbankWallet, ...(data.jsbankWallet || {}) }
  next.usageScenarios = Array.isArray(data.usageScenarios) ? [...data.usageScenarios] : []

  Object.keys(formData).forEach((key) => {
    formData[key] = next[key]
  })
}

function requiredIf(condition, message) {
  return (_rule, value, callback) => {
    if (!condition()) {
      callback()
      return
    }

    if (!trimValue(value)) {
      callback(new Error(message))
      return
    }

    callback()
  }
}

const formRules = {
  paymentMethod: [{ required: true, message: '请选择收款方式', trigger: 'change' }],
  accountName: [{ validator: requiredIf(() => formData.paymentMethod === 'bank', '请输入账户名称'), trigger: 'blur' }],
  bankName: [{ validator: requiredIf(() => formData.paymentMethod === 'bank', '请输入开户银行'), trigger: 'blur' }],
  accountNumber: [
    { validator: requiredIf(() => formData.paymentMethod === 'bank', '请输入银行账号'), trigger: 'blur' },
    ...buildBankAccountNumberRules({
      required: false,
      invalidMessage: '请输入正确的银行账号'
    })
  ],
  contactPhone: buildPhoneRules({
    required: false,
    invalidMessage: '请输入正确的联系电话'
  }),
  usageScenarios: [{
    validator: (_rule, value, callback) => {
      if (!Array.isArray(value) || value.length === 0) {
        callback(new Error('请至少选择一个使用场景'))
        return
      }
      callback()
    },
    trigger: 'change'
  }],
  'alipayAccount.accountId': [{ validator: requiredIf(() => formData.paymentMethod === 'alipay', '请输入支付宝账号'), trigger: 'blur' }],
  'alipayAccount.companyName': [{ validator: requiredIf(() => formData.paymentMethod === 'alipay', '请输入企业名称'), trigger: 'blur' }],
  'wechatAccount.merchantId': [{ validator: requiredIf(() => formData.paymentMethod === 'wechat', '请输入商户号'), trigger: 'blur' }],
  'wechatAccount.merchantName': [{ validator: requiredIf(() => formData.paymentMethod === 'wechat', '请输入商户名称'), trigger: 'blur' }],
  'aggregationAccount.provider': [{ validator: requiredIf(() => formData.paymentMethod === 'aggregation', '请选择服务商'), trigger: 'change' }],
  'aggregationAccount.merchantId': [{ validator: requiredIf(() => formData.paymentMethod === 'aggregation', '请输入商户号'), trigger: 'blur' }],
  'yopayAccount.merchantId': [{ validator: requiredIf(() => formData.paymentMethod === 'yopay', '请输入易宝商户号'), trigger: 'blur' }],
  'yopayAccount.customerCode': [{ validator: requiredIf(() => formData.paymentMethod === 'yopay', '请输入客户编码'), trigger: 'blur' }],
  'jsbankWallet.walletId': [{ validator: requiredIf(() => formData.paymentMethod === 'jsbank_wallet', '请输入钱包 ID'), trigger: 'blur' }],
  'jsbankWallet.merchantCode': [{ validator: requiredIf(() => formData.paymentMethod === 'jsbank_wallet', '请输入商户编码'), trigger: 'blur' }]
}

function normalizeFormData() {
  formData.contactPhone = normalizePhone(formData.contactPhone)
  formData.accountNumber = normalizeBankAccountNumber(formData.accountNumber)
}

async function loadAccounts() {
  loading.value = true

  try {
    const params = {}
    if (filters.paymentMethod) {
      params.paymentMethod = filters.paymentMethod
    }
    if (filters.status) {
      params.status = filters.status
    }

    const response = await request({
      url: '/platform/bank-accounts',
      method: 'get',
      params
    })

    accountList.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '加载收款账户失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.paymentMethod = ''
  filters.status = ''
  loadAccounts()
}

function handleAdd() {
  isEdit.value = false
  currentAccountId.value = ''
  assignFormData(createEmptyFormData())
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  currentAccountId.value = row._id
  assignFormData(JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

function handlePaymentMethodChange() {
  const currentMethod = formData.paymentMethod
  assignFormData({
    ...createEmptyFormData(),
    paymentMethod: currentMethod,
    usageScenarios: [...formData.usageScenarios],
    isDefault: formData.isDefault,
    contactPerson: formData.contactPerson,
    contactPhone: formData.contactPhone,
    remark: formData.remark
  })
}

function resetForm() {
  assignFormData(createEmptyFormData())
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  try {
    submitting.value = true
    normalizeFormData()
    await formRef.value?.validate()

    const payload = JSON.parse(JSON.stringify(formData))
    const url = isEdit.value ? `/platform/bank-accounts/${currentAccountId.value}` : '/platform/bank-accounts'
    const method = isEdit.value ? 'put' : 'post'

    const response = await request({
      url,
      method,
      data: payload
    })

    if (!response?.success) {
      throw new Error(response?.message || '保存失败')
    }

    ElMessage.success(response.message || '保存成功')
    dialogVisible.value = false
    loadAccounts()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleSetDefault(row) {
  try {
    await ElMessageBox.confirm(`确认将“${getAccountDisplayName(row)}”设为默认账户吗？`, '提示', {
      type: 'warning'
    })

    const response = await request({
      url: `/platform/bank-accounts/${row._id}/set-default`,
      method: 'put'
    })

    if (!response?.success) {
      throw new Error(response?.message || '设置默认账户失败')
    }

    ElMessage.success(response.message || '设置成功')
    loadAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '设置默认账户失败')
    }
  }
}

function openStatusDialog(row) {
  currentStatusAccountId.value = row._id
  statusForm.status = row.status?.type || 'active'
  statusForm.reason = row.status?.reason || ''
  statusDialogVisible.value = true
}

async function submitStatusUpdate() {
  try {
    statusSubmitting.value = true

    const response = await request({
      url: `/platform/bank-accounts/${currentStatusAccountId.value}/status`,
      method: 'put',
      data: {
        status: statusForm.status,
        reason: statusForm.reason
      }
    })

    if (!response?.success) {
      throw new Error(response?.message || '更新状态失败')
    }

    ElMessage.success(response.message || '更新成功')
    statusDialogVisible.value = false
    loadAccounts()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '更新状态失败')
  } finally {
    statusSubmitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除“${getAccountDisplayName(row)}”吗？`, '提示', {
      type: 'warning'
    })

    const response = await request({
      url: `/platform/bank-accounts/${row._id}`,
      method: 'delete'
    })

    if (!response?.success) {
      throw new Error(response?.message || '删除失败')
    }

    ElMessage.success(response.message || '删除成功')
    loadAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '删除失败')
    }
  }
}

function getPaymentMethodText(paymentMethod) {
  return paymentMethodOptions.find(item => item.value === paymentMethod)?.label || paymentMethod || '-'
}

function getPaymentMethodColor(paymentMethod) {
  switch (paymentMethod) {
  case 'bank':
    return 'primary'
  case 'alipay':
    return 'success'
  case 'wechat':
    return 'warning'
  case 'aggregation':
    return 'danger'
  default:
    return 'info'
  }
}

function getStatusText(status) {
  switch (status) {
  case 'active':
    return '启用'
  case 'frozen':
    return '冻结'
  case 'closed':
    return '关闭'
  default:
    return '未知'
  }
}

function getStatusType(status) {
  switch (status) {
  case 'active':
    return 'success'
  case 'frozen':
    return 'warning'
  case 'closed':
    return 'info'
  default:
    return 'info'
  }
}

function getScenarioText(scenario) {
  switch (scenario) {
  case 'fleet_recharge':
    return '车队充值'
  case 'order_payment':
    return '订单收款'
  case 'store_settlement':
    return '门店结算'
  default:
    return scenario
  }
}

function getAccountDisplayName(account) {
  switch (account.paymentMethod) {
  case 'bank':
    return account.accountName || '-'
  case 'alipay':
    return account.alipayAccount?.companyName || account.alipayAccount?.accountId || '-'
  case 'wechat':
    return account.wechatAccount?.merchantName || account.wechatAccount?.merchantId || '-'
  case 'aggregation':
    return account.aggregationAccount?.merchantId || '-'
  case 'yopay':
    return account.yopayAccount?.merchantId || '-'
  case 'jsbank_wallet':
    return account.jsbankWallet?.walletName || account.jsbankWallet?.walletId || '-'
  default:
    return '-'
  }
}

function getAccountDetail(account) {
  switch (account.paymentMethod) {
  case 'bank':
    return `${account.bankName || '-'} / ${account.accountNumber || '-'}`
  case 'alipay':
    return account.alipayAccount?.accountId || '-'
  case 'wechat':
    return account.wechatAccount?.merchantId || '-'
  case 'aggregation':
    return `${account.aggregationAccount?.provider || '-'} / ${account.aggregationAccount?.merchantId || '-'}`
  case 'yopay':
    return `${account.yopayAccount?.merchantId || '-'} / ${account.yopayAccount?.customerCode || '-'}`
  case 'jsbank_wallet':
    return `${account.jsbankWallet?.walletId || '-'} / ${account.jsbankWallet?.merchantCode || '-'}`
  default:
    return '-'
  }
}

function formatCentAmount(value) {
  return (Number(value || 0) / 100).toFixed(2)
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadAccounts()
})
</script>

<style scoped>
.bank-accounts-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label,
.muted-text {
  font-size: 12px;
  color: #909399;
}

.account-info {
  line-height: 1.6;
}

.account-name {
  font-weight: 600;
  color: #303133;
}

.account-detail {
  color: #606266;
  font-size: 13px;
}

.scenario-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}
</style>
