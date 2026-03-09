<template>
  <div class="bank-accounts-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>平台收款账户管理</span>
          <el-button
            type="primary"
            @click="handleAdd"
          >
            <el-icon><Plus /></el-icon>
            添加收款账户
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form
          :inline="true"
          :model="filters"
        >
          <el-form-item label="支付方式">
            <el-select
              v-model="filters.paymentMethod"
              placeholder="全部支付方式"
              clearable
              style="width: 220px"
              @change="loadAccounts"
            >
              <el-option
                label="全部方式"
                value=""
              />
              <el-option
                label="银行对公账户"
                value="bank"
              />
              <el-option
                label="支付宝企业账户"
                value="alipay"
              />
              <el-option
                label="微信商户号"
                value="wechat"
              />
              <el-option
                label="聚合支付"
                value="aggregation"
              />
              <el-option
                label="易宝支付"
                value="yopay"
              />
              <el-option
                label="江苏银行电子钱包"
                value="jsbank_wallet"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="账户状态">
            <el-select
              v-model="filters.status"
              placeholder="全部状态"
              clearable
              style="width: 180px"
              @change="loadAccounts"
            >
              <el-option
                label="全部状态"
                value=""
              />
              <el-option
                label="启用"
                value="active"
              />
              <el-option
                label="冻结"
                value="frozen"
              />
              <el-option
                label="停用"
                value="closed"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 统计卡片 -->
      <el-row
        :gutter="20"
        class="stats-row"
      >
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">
              {{ statistics.total || 0 }}
            </div>
            <div class="stat-label">
              账户总数
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">
              {{ statistics.active || 0 }}
            </div>
            <div class="stat-label">
              启用账户
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">
              {{ statistics.default || 0 }}
            </div>
            <div class="stat-label">
              默认账户
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">
              ¥{{ formatAmount(statistics.totalReceived || 0) }}
            </div>
            <div class="stat-label">
              累计收款
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 账户列表 -->
      <el-table
        v-loading="loading"
        :data="accountList"
        stripe
      >
        <el-table-column
          label="支付方式"
          width="140"
        >
          <template #default="{ row }">
            <el-tag
              :type="getPaymentMethodColor(row.paymentMethod)"
              size="small"
            >
              {{ getPaymentMethodText(row.paymentMethod) }}
            </el-tag>
            <el-tag
              v-if="row.isDefault"
              type="success"
              size="small"
              style="margin-left: 5px;"
            >
              默认
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="账户信息"
          min-width="250"
        >
          <template #default="{ row }">
            <div class="account-info">
              <div class="account-name">
                {{ getAccountDisplayName(row) }}
              </div>
              <div class="account-detail">
                {{ getAccountDetail(row) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="使用场景"
          width="180"
        >
          <template #default="{ row }">
            <el-tag
              v-for="scenario in row.usageScenarios"
              :key="scenario"
              size="small"
              style="margin-right: 5px; margin-bottom: 3px;"
            >
              {{ getScenarioText(scenario) }}
            </el-tag>
            <span v-if="!row.usageScenarios || row.usageScenarios.length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status?.type)"
              size="small"
            >
              {{ getStatusText(row.status?.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="收款统计"
          width="150"
          align="right"
        >
          <template #default="{ row }">
            <div>¥{{ formatAmount(row.totalReceived || 0) }}</div>
            <div style="font-size: 12px; color: #909399;">
              {{ row.transactionCount || 0 }} 笔
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          width="160"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="220"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="!row.isDefault"
              type="success"
              size="small"
              link
              @click="handleSetDefault(row)"
            >
              设为默认
            </el-button>
            <el-button
              type="primary"
              size="small"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              size="small"
              link
              @click="handleUpdateStatus(row)"
            >
              状态
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <!-- 支付方式 -->
        <el-form-item
          label="支付方式"
          prop="paymentMethod"
        >
          <el-select
            v-model="formData.paymentMethod"
            placeholder="请选择支付方式"
            :disabled="isEdit"
            style="width: 100%"
            @change="handlePaymentMethodChange"
          >
            <el-option
              label="银行对公账户"
              value="bank"
            />
            <el-option
              label="支付宝企业账户"
              value="alipay"
            />
            <el-option
              label="微信商户号"
              value="wechat"
            />
            <el-option
              label="聚合支付"
              value="aggregation"
            />
            <el-option
              label="易宝支付"
              value="yopay"
            />
            <el-option
              label="江苏银行电子钱包"
              value="jsbank_wallet"
            />
          </el-select>
        </el-form-item>

        <!-- 银行对公账户字段 -->
        <template v-if="formData.paymentMethod === 'bank'">
          <el-form-item
            label="账户名称"
            prop="accountName"
          >
            <el-input
              v-model="formData.accountName"
              placeholder="请输入账户名称"
            />
          </el-form-item>
          <el-form-item
            label="开户银行"
            prop="bankName"
          >
            <el-input
              v-model="formData.bankName"
              placeholder="请输入开户银行"
            />
          </el-form-item>
          <el-form-item
            label="银行账号"
            prop="accountNumber"
          >
            <el-input
              v-model="formData.accountNumber"
              placeholder="请输入银行账号"
            />
          </el-form-item>
          <el-form-item label="开户行支行">
            <el-input
              v-model="formData.branch"
              placeholder="请输入开户行支行（可选）"
            />
          </el-form-item>
          <el-form-item
            label="账户类型"
            prop="bankAccountType"
          >
            <el-select
              v-model="formData.bankAccountType"
              placeholder="请选择账户类型"
              style="width: 100%"
            >
              <el-option
                label="基本户"
                value="basic"
              />
              <el-option
                label="一般户"
                value="general"
              />
              <el-option
                label="临时户"
                value="temporary"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- 支付宝企业账户字段 -->
        <template v-if="formData.paymentMethod === 'alipay'">
          <el-form-item
            label="支付宝账号"
            prop="alipayAccount.accountId"
          >
            <el-input
              v-model="formData.alipayAccount.accountId"
              placeholder="请输入支付宝企业账号"
            />
          </el-form-item>
          <el-form-item
            label="企业名称"
            prop="alipayAccount.companyName"
          >
            <el-input
              v-model="formData.alipayAccount.companyName"
              placeholder="请输入企业名称"
            />
          </el-form-item>
          <el-form-item label="Partner ID">
            <el-input
              v-model="formData.alipayAccount.pid"
              placeholder="请输入支付宝Partner ID（可选）"
            />
          </el-form-item>
        </template>

        <!-- 微信商户号字段 -->
        <template v-if="formData.paymentMethod === 'wechat'">
          <el-form-item
            label="微信商户号"
            prop="wechatAccount.merchantId"
          >
            <el-input
              v-model="formData.wechatAccount.merchantId"
              placeholder="请输入微信商户号"
            />
          </el-form-item>
          <el-form-item
            label="商户名称"
            prop="wechatAccount.merchantName"
          >
            <el-input
              v-model="formData.wechatAccount.merchantName"
              placeholder="请输入商户名称"
            />
          </el-form-item>
          <el-form-item label="子商户号">
            <el-input
              v-model="formData.wechatAccount.subMchId"
              placeholder="请输入子商户号（可选）"
            />
          </el-form-item>
        </template>

        <!-- 聚合支付字段 -->
        <template v-if="formData.paymentMethod === 'aggregation'">
          <el-form-item
            label="支付提供商"
            prop="aggregationAccount.provider"
          >
            <el-select
              v-model="formData.aggregationAccount.provider"
              placeholder="请选择支付提供商"
              style="width: 100%"
            >
              <el-option
                label="银联"
                value="unionpay"
              />
              <el-option
                label="拉卡拉"
                value="lakala"
              />
              <el-option
                label="汇付天下"
                value="chinapay"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            label="商户号"
            prop="aggregationAccount.merchantId"
          >
            <el-input
              v-model="formData.aggregationAccount.merchantId"
              placeholder="请输入商户号"
            />
          </el-form-item>
          <el-form-item label="终端号">
            <el-input
              v-model="formData.aggregationAccount.terminalId"
              placeholder="请输入终端号（可选）"
            />
          </el-form-item>
        </template>

        <!-- 易宝支付字段 -->
        <template v-if="formData.paymentMethod === 'yopay'">
          <el-form-item
            label="易宝商户号"
            prop="yopayAccount.merchantId"
          >
            <el-input
              v-model="formData.yopayAccount.merchantId"
              placeholder="请输入易宝商户号"
            />
          </el-form-item>
          <el-form-item
            label="客户编码"
            prop="yopayAccount.customerCode"
          >
            <el-input
              v-model="formData.yopayAccount.customerCode"
              placeholder="请输入客户编码"
            />
          </el-form-item>
          <el-form-item label="账户名称">
            <el-input
              v-model="formData.yopayAccount.accountName"
              placeholder="请输入账户名称（可选）"
            />
          </el-form-item>
        </template>

        <!-- 江苏银行电子钱包字段 -->
        <template v-if="formData.paymentMethod === 'jsbank_wallet'">
          <el-form-item
            label="钱包ID"
            prop="jsbankWallet.walletId"
          >
            <el-input
              v-model="formData.jsbankWallet.walletId"
              placeholder="请输入钱包ID"
            />
          </el-form-item>
          <el-form-item
            label="钱包名称"
            prop="jsbankWallet.walletName"
          >
            <el-input
              v-model="formData.jsbankWallet.walletName"
              placeholder="请输入钱包名称"
            />
          </el-form-item>
          <el-form-item
            label="商户代码"
            prop="jsbankWallet.merchantCode"
          >
            <el-input
              v-model="formData.jsbankWallet.merchantCode"
              placeholder="请输入商户代码"
            />
          </el-form-item>
        </template>

        <!-- 使用场景 -->
        <el-form-item
          label="使用场景"
          prop="usageScenarios"
        >
          <el-checkbox-group v-model="formData.usageScenarios">
            <el-checkbox label="fleet_recharge">
              车队充值收款
            </el-checkbox>
            <el-checkbox label="order_payment">
              订单支付收款
            </el-checkbox>
            <el-checkbox label="store_settlement">
              门店结算收款
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 联系信息 -->
        <el-form-item label="财务联系人">
          <el-input
            v-model="formData.contactPerson"
            placeholder="请输入财务联系人（可选）"
          />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input
            v-model="formData.contactPhone"
            placeholder="请输入联系电话（可选）"
          />
        </el-form-item>

        <!-- 备注 -->
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>

        <!-- 设为默认 -->
        <el-form-item label="设为默认">
          <el-switch v-model="formData.isDefault" />
          <span style="margin-left: 10px; font-size: 12px; color: #909399;">
            默认账户将优先用于收款
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 状态更新对话框 -->
    <el-dialog
      v-model="statusDialogVisible"
      title="更新账户状态"
      width="500px"
    >
      <el-form
        :model="statusForm"
        label-width="100px"
      >
        <el-form-item label="账户状态">
          <el-select
            v-model="statusForm.status"
            placeholder="请选择状态"
            style="width: 100%"
          >
            <el-option
              label="启用"
              value="active"
            />
            <el-option
              label="冻结"
              value="frozen"
            />
            <el-option
              label="停用"
              value="closed"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态原因">
          <el-input
            v-model="statusForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入状态变更原因（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="confirmUpdateStatus"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const accountList = ref([])
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const currentAccountId = ref(null)

const filters = reactive({
  paymentMethod: '',
  status: ''
})

const statistics = reactive({
  total: 0,
  active: 0,
  default: 0,
  totalReceived: 0
})

const formData = reactive({
  paymentMethod: '',
  accountName: '',
  bankName: '',
  accountNumber: '',
  branch: '',
  bankAccountType: '',
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
  },
  usageScenarios: [],
  contactPerson: '',
  contactPhone: '',
  remark: '',
  isDefault: false
})

const statusForm = reactive({
  status: 'active',
  reason: ''
})

const formRules = {
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  usageScenarios: [
    { required: true, message: '请至少选择一个使用场景', trigger: 'change' }
  ]
}

const dialogTitle = computed(() => {
  return isEdit.value ? '编辑收款账户' : '添加收款账户'
})

// 生命周期
onMounted(() => {
  loadAccounts()
})

// 加载账户列表
async function loadAccounts() {
  loading.value = true
  try {
    const params = {}
    if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod
    if (filters.status) params.status = filters.status

    const res = await request({
      url: '/platform/bank-accounts',
      method: 'get',
      params
    })

    accountList.value = res.data || []

    // 计算统计数据
    statistics.total = accountList.value.length
    statistics.active = accountList.value.filter(acc => acc.status?.type === 'active').length
    statistics.default = accountList.value.filter(acc => acc.isDefault).length
    statistics.totalReceived = accountList.value.reduce((sum, acc) => sum + (acc.totalReceived || 0), 0)
  } catch (error) {
    console.error('加载账户列表失败:', error)
    ElMessage.error('加载账户列表失败')
  } finally {
    loading.value = false
  }
}

// 添加账户
function handleAdd() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑账户
function handleEdit(row) {
  isEdit.value = true
  currentAccountId.value = row._id

  // 填充表单数据
  Object.keys(formData).forEach(key => {
    if (typeof row[key] === 'object' && row[key] !== null) {
      formData[key] = { ...row[key] }
    } else {
      formData[key] = row[key]
    }
  })

  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value.validate()

    submitting.value = true

    const data = { ...formData }

    if (isEdit.value) {
      await request({
        url: `/platform/bank-accounts/${currentAccountId.value}`,
        method: 'put',
        data
      })
      ElMessage.success('更新成功')
    } else {
      await request({
        url: '/platform/bank-accounts',
        method: 'post',
        data
      })
      ElMessage.success('添加成功')
    }

    dialogVisible.value = false
    loadAccounts()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 设为默认
async function handleSetDefault(row) {
  try {
    await ElMessageBox.confirm('确定要将此账户设为默认账户吗？', '提示', {
      type: 'warning'
    })

    await request({
      url: `/platform/bank-accounts/${row._id}/set-default`,
      method: 'put'
    })

    ElMessage.success('设置成功')
    loadAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('设置默认账户失败:', error)
      ElMessage.error('设置失败')
    }
  }
}

// 更新状态
function handleUpdateStatus(row) {
  currentAccountId.value = row._id
  statusForm.status = row.status?.type || 'active'
  statusForm.reason = row.status?.reason || ''
  statusDialogVisible.value = true
}

// 确认更新状态
async function confirmUpdateStatus() {
  try {
    await request({
      url: `/platform/bank-accounts/${currentAccountId.value}/status`,
      method: 'put',
      data: statusForm
    })

    ElMessage.success('状态更新成功')
    statusDialogVisible.value = false
    loadAccounts()
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
  }
}

// 删除账户
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除此账户吗？删除后不可恢复。', '提示', {
      type: 'warning'
    })

    await request({
      url: `/platform/bank-accounts/${row._id}`,
      method: 'delete'
    })

    ElMessage.success('删除成功')
    loadAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 支付方式变更时重置表单
function handlePaymentMethodChange() {
  // 清空各支付方式的特定字段
  formData.accountName = ''
  formData.bankName = ''
  formData.accountNumber = ''
  formData.branch = ''
  formData.bankAccountType = ''
  formData.alipayAccount = { accountId: '', companyName: '', pid: '' }
  formData.wechatAccount = { merchantId: '', merchantName: '', subMchId: '' }
  formData.aggregationAccount = { provider: '', merchantId: '', terminalId: '' }
  formData.yopayAccount = { merchantId: '', customerCode: '', accountName: '' }
  formData.jsbankWallet = { walletId: '', walletName: '', merchantCode: '' }
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    paymentMethod: '',
    accountName: '',
    bankName: '',
    accountNumber: '',
    branch: '',
    bankAccountType: '',
    alipayAccount: { accountId: '', companyName: '', pid: '' },
    wechatAccount: { merchantId: '', merchantName: '', subMchId: '' },
    aggregationAccount: { provider: '', merchantId: '', terminalId: '' },
    yopayAccount: { merchantId: '', customerCode: '', accountName: '' },
    jsbankWallet: { walletId: '', walletName: '', merchantCode: '' },
    usageScenarios: [],
    contactPerson: '',
    contactPhone: '',
    remark: '',
    isDefault: false
  })
  formRef.value?.clearValidate()
  currentAccountId.value = null
}

// 辅助函数
function getPaymentMethodText(method) {
  const map = {
    bank: '银行对公账户',
    alipay: '支付宝',
    wechat: '微信',
    aggregation: '聚合支付',
    yopay: '易宝',
    jsbank_wallet: '江苏银行钱包'
  }
  return map[method] || method
}

function getPaymentMethodColor(method) {
  const map = {
    bank: '',
    alipay: 'success',
    wechat: 'success',
    aggregation: 'warning',
    yopay: 'primary',
    jsbank_wallet: 'info'
  }
  return map[method] || ''
}

function getAccountDisplayName(account) {
  switch (account.paymentMethod) {
  case 'bank':
    return account.accountName || '-'
  case 'alipay':
    return account.alipayAccount?.companyName || '-'
  case 'wechat':
    return account.wechatAccount?.merchantName || '-'
  case 'aggregation':
    return account.aggregationAccount?.provider || '-'
  case 'yopay':
    return account.yopayAccount?.accountName || '-'
  case 'jsbank_wallet':
    return account.jsbankWallet?.walletName || '-'
  default:
    return '-'
  }
}

function getAccountDetail(account) {
  switch (account.paymentMethod) {
  case 'bank':
    return `${account.bankName} ${account.accountNumber}`
  case 'alipay':
    return account.alipayAccount?.accountId || '-'
  case 'wechat':
    return account.wechatAccount?.merchantId || '-'
  case 'aggregation':
    return `商户号: ${account.aggregationAccount?.merchantId || '-'}`
  case 'yopay':
    return `商户号: ${account.yopayAccount?.merchantId || '-'}`
  case 'jsbank_wallet':
    return `钱包ID: ${account.jsbankWallet?.walletId || '-'}`
  default:
    return '-'
  }
}

function getScenarioText(scenario) {
  const map = {
    fleet_recharge: '车队充值',
    order_payment: '订单支付',
    store_settlement: '门店结算'
  }
  return map[scenario] || scenario
}

function getStatusType(status) {
  const map = {
    active: 'success',
    frozen: 'warning',
    closed: 'danger'
  }
  return map[status] || ''
}

function getStatusText(status) {
  const map = {
    active: '启用',
    frozen: '冻结',
    closed: '停用'
  }
  return map[status] || status
}

function formatAmount(amount) {
  if (!amount) return '0.00'
  return parseFloat(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.bank-accounts-page {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .filter-section {
    margin-bottom: 20px;
  }

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
      text-align: center;

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }

  .account-info {
    .account-name {
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .account-detail {
      font-size: 13px;
      color: #909399;
    }
  }
}
</style>
