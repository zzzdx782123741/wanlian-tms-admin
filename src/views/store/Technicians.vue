<template>
  <div class="store-technicians">
    <div class="page-header">
      <h2>技师管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="openBatchDialog">
          <el-icon><UploadFilled /></el-icon>
          批量导入
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增技师
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="技师总数" :value="stats.total" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic title="正常" :value="stats.normal" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic title="待审核" :value="stats.pending" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-danger">
          <el-statistic title="停用" :value="stats.suspended" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="technicians" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="employeeId" label="工号" width="140" />
        <el-table-column prop="level" label="等级" width="120" />

        <el-table-column label="权限" min-width="260">
          <template #default="{ row }">
            <el-tag
              v-for="permission in row.permissions || []"
              :key="permission"
              size="small"
              class="permission-tag"
            >
              {{ getPermissionText(permission) }}
            </el-tag>
            <span v-if="!row.permissions || row.permissions.length === 0">未配置</span>
          </template>
        </el-table-column>

        <el-table-column label="激活状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getActivationStatusType(row)">
              {{ getActivationStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.role?.status)">
              {{ getStatusText(row.role?.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-dropdown style="margin-left: 10px">
              <el-button type="primary" size="small" link>
                更多
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleUpdateStatus(row, 'normal')">设为正常</el-dropdown-item>
                  <el-dropdown-item @click="handleUpdateStatus(row, 'suspended')">设为停用</el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(row)">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="loadTechnicians"
        @current-change="loadTechnicians"
      />
    </el-card>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑技师' : '新增技师'"
      width="620px"
      @close="resetTechnicianForm"
    >
      <el-alert
        v-if="!isEdit"
        title="新增技师后，系统会根据手机号创建或关联技师账号"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-form ref="technicianFormRef" :model="technicianForm" :rules="formRules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="technicianForm.name" placeholder="请输入技师姓名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="technicianForm.phone" placeholder="请输入技师手机号" :disabled="isEdit" />
        </el-form-item>

        <el-form-item label="工号">
          <el-input v-model="technicianForm.employeeId" placeholder="选填" />
        </el-form-item>

        <el-form-item label="等级">
          <el-select v-model="technicianForm.level" placeholder="请选择等级" style="width: 100%">
            <el-option label="初级技师" value="初级技师" />
            <el-option label="中级技师" value="中级技师" />
            <el-option label="高级技师" value="高级技师" />
            <el-option label="专家技师" value="专家技师" />
          </el-select>
        </el-form-item>

        <el-form-item label="权限" prop="permissions">
          <el-checkbox-group v-model="technicianForm.permissions">
            <el-checkbox label="receive_order">接单</el-checkbox>
            <el-checkbox label="diagnosis">诊断</el-checkbox>
            <el-checkbox label="quote">报价</el-checkbox>
            <el-checkbox label="repair">维修</el-checkbox>
            <el-checkbox label="complete">完工</el-checkbox>
            <el-checkbox label="manage_products">商品管理</el-checkbox>
          </el-checkbox-group>
          <div class="permission-hint">建议至少保留接单、诊断、报价、维修、完工五项核心权限。</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchDialogVisible"
      title="批量导入技师"
      width="720px"
      @close="resetBatchState"
    >
      <div class="batch-import-content">
        <div v-if="!importResult.message" class="upload-section">
          <div class="upload-header">
            <el-button type="primary" link :loading="downloading" @click="downloadTemplate">
              <el-icon><Download /></el-icon>
              下载 Excel 模板
            </el-button>
          </div>

          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
          >
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">
              将 Excel 文件拖到此处，或
              <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">仅支持 `.xlsx`、`.xls`，文件大小不超过 5MB</div>
            </template>
          </el-upload>

          <div class="upload-footer">
            <el-button @click="resetBatchState">重置</el-button>
            <el-button type="primary" :loading="importing" :disabled="!uploadFile" @click="startImport">
              开始导入
            </el-button>
          </div>
        </div>

        <div v-else class="import-result">
          <el-result :icon="importResult.successCount > 0 ? 'success' : 'error'" :title="importResult.message">
            <template #sub-title>
              <div class="result-summary">
                <div>总计：{{ importResult.total }}</div>
                <div>成功：{{ importResult.successCount }}</div>
                <div>失败：{{ importResult.failedCount }}</div>
              </div>
            </template>
          </el-result>

          <el-table v-if="importResult.errors.length" :data="importResult.errors" max-height="320" size="small">
            <el-table-column prop="row" label="行号" width="80" />
            <el-table-column prop="identifierLabel" label="标识字段" width="120" />
            <el-table-column prop="identifier" label="标识值" width="180" />
            <el-table-column prop="error" label="错误原因" min-width="260" />
          </el-table>

          <div class="upload-footer">
            <el-button @click="resetBatchState">继续导入</el-button>
            <el-button type="primary" @click="finishBatchImport">完成</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Download, Plus, UploadFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { batchImportTechnicians } from '@/api/batch'
import { buildPhoneRules, normalizePhone } from '@/utils/formValidators'

function createDefaultImportResult() {
  return {
    message: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: []
  }
}

function createDefaultTechnicianForm() {
  return {
    name: '',
    phone: '',
    employeeId: '',
    level: '初级技师',
    permissions: ['receive_order', 'diagnosis', 'quote', 'repair', 'complete']
  }
}

const loading = ref(false)
const saving = ref(false)
const downloading = ref(false)
const importing = ref(false)

const formDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const isEdit = ref(false)
const currentTechnicianId = ref('')
const uploadFile = ref(null)

const uploadRef = ref(null)
const technicianFormRef = ref(null)

const technicians = ref([])
const importResult = ref(createDefaultImportResult())

const stats = reactive({
  total: 0,
  normal: 0,
  pending: 0,
  suspended: 0
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const technicianForm = reactive(createDefaultTechnicianForm())

const formRules = {
  name: [{ required: true, message: '请输入技师姓名', trigger: 'blur' }],
  phone: buildPhoneRules({
    requiredMessage: '请输入技师手机号',
    invalidMessage: '请输入正确的技师手机号'
  }),
  permissions: [{
    validator: (_rule, value, callback) => {
      if (!Array.isArray(value) || value.length === 0) {
        callback(new Error('请至少选择一项权限'))
        return
      }
      callback()
    },
    trigger: 'change'
  }]
}

function applyStats(dataStats = {}) {
  stats.total = Number(dataStats.total || technicians.value.length || 0)
  stats.normal = Number(dataStats.normal || 0)
  stats.pending = Number(dataStats.pending || 0)
  stats.suspended = Number(dataStats.suspended || 0)
}

async function loadTechnicians() {
  loading.value = true
  try {
    const response = await request({
      url: '/store/technicians',
      method: 'get',
      params: {
        page: pagination.page,
        limit: pagination.limit
      }
    })

    const data = response?.data || {}
    technicians.value = Array.isArray(data.list) ? data.list : []
    pagination.total = Number(data.total || 0)
    applyStats(data.stats || {})
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '加载技师列表失败')
  } finally {
    loading.value = false
  }
}

function resetTechnicianForm() {
  Object.assign(technicianForm, createDefaultTechnicianForm())
  technicianFormRef.value?.clearValidate()
}

function handleAdd() {
  isEdit.value = false
  currentTechnicianId.value = ''
  resetTechnicianForm()
  formDialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  currentTechnicianId.value = row._id
  Object.assign(technicianForm, {
    ...createDefaultTechnicianForm(),
    name: row.name || '',
    phone: row.phone || '',
    employeeId: row.employeeId || '',
    level: row.level || '初级技师',
    permissions: Array.isArray(row.permissions) && row.permissions.length
      ? [...row.permissions]
      : createDefaultTechnicianForm().permissions
  })
  formDialogVisible.value = true
}

async function confirmSave() {
  try {
    saving.value = true
    technicianForm.phone = normalizePhone(technicianForm.phone)
    await technicianFormRef.value?.validate()

    if (isEdit.value) {
      await request({
        url: `/store/technicians/${currentTechnicianId.value}`,
        method: 'put',
        data: technicianForm
      })
      ElMessage.success('技师信息已更新')
    } else {
      const response = await request({
        url: '/store/technicians',
        method: 'post',
        data: technicianForm
      })

      ElMessage.success(response?.message || '技师添加成功')
      if (response?.data?.warning) {
        setTimeout(() => {
          ElMessage.warning(response.data.warning)
        }, 1200)
      }
    }

    formDialogVisible.value = false
    loadTechnicians()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '保存技师失败')
  } finally {
    saving.value = false
  }
}

async function handleUpdateStatus(row, status) {
  const statusText = status === 'normal' ? '正常' : '停用'
  try {
    await ElMessageBox.confirm(`确认将技师“${row.name || row.phone}”状态修改为“${statusText}”吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request({
      url: `/store/technicians/${row._id}/status`,
      method: 'put',
      data: { status }
    })

    ElMessage.success('技师状态已更新')
    loadTechnicians()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '更新技师状态失败')
    }
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除技师“${row.name || row.phone}”吗？此操作不可恢复。`, '提示', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request({
      url: `/store/technicians/${row._id}`,
      method: 'delete'
    })

    ElMessage.success('技师已删除')
    loadTechnicians()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '删除技师失败')
    }
  }
}

function getPermissionText(permission) {
  const map = {
    receive_order: '接单',
    diagnosis: '诊断',
    quote: '报价',
    repair: '维修',
    complete: '完工',
    manage_products: '商品管理'
  }
  return map[permission] || permission
}

function getStatusType(status) {
  const map = {
    normal: 'success',
    pending_audit: 'warning',
    suspended: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    normal: '正常',
    pending_audit: '待审核',
    suspended: '停用'
  }
  return map[status] || status || '未知'
}

function getActivationStatusType(row) {
  return row.activationStatus === 'activated' || row.userId || row.hasOpenid ? 'success' : 'warning'
}

function getActivationStatusText(row) {
  return row.activationStatus === 'activated' || row.userId || row.hasOpenid ? '已激活' : '待激活'
}

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

function openBatchDialog() {
  resetBatchState()
  batchDialogVisible.value = true
}

function resetBatchState() {
  uploadFile.value = null
  importResult.value = createDefaultImportResult()
  uploadRef.value?.clearFiles?.()
}

async function downloadTemplate() {
  downloading.value = true
  try {
    const response = await request({
      url: '/batch/template/technicians',
      method: 'get',
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.download = '技师批量导入模板.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '模板下载失败')
  } finally {
    downloading.value = false
  }
}

function handleFileChange(file) {
  uploadFile.value = file.raw
}

function handleExceed() {
  ElMessage.warning('一次只能上传一个文件')
}

function normalizeImportErrors(errors = []) {
  if (!Array.isArray(errors)) {
    return []
  }

  return errors.map((item, index) => ({
    id: `${item?.row || '-'}-${index}`,
    row: item?.row || '-',
    identifierLabel: item?.identifierLabel || '手机号',
    identifier: item?.identifier || item?.phone || item?.value || '',
    error: item?.error || item?.message || '导入失败'
  }))
}

function buildImportMessage({ message, total, successCount, failedCount }) {
  if (message) {
    return message
  }

  return `共 ${total} 条，成功 ${successCount} 条，失败 ${failedCount} 条`
}

async function startImport() {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择导入文件')
    return
  }

  importing.value = true
  try {
    const payload = new FormData()
    payload.append('file', uploadFile.value)

    const response = await batchImportTechnicians(payload)
    const data = response?.data || {}
    const errors = normalizeImportErrors(data.errors || [])
    const total = Number(data.total || 0)
    const successCount = Number(data.success || data.successCount || 0)
    const failedCount = Number(data.failed || data.failedCount || errors.length)

    importResult.value = {
      message: buildImportMessage({
        message: response?.message,
        total,
        successCount,
        failedCount
      }),
      total,
      successCount,
      failedCount,
      errors
    }

    loadTechnicians()
  } catch (error) {
    const data = error.response?.data || {}
    const errors = normalizeImportErrors(data.errors || [])
    importResult.value = {
      message: data.message || error.message || '导入失败',
      total: Number(data.total || 0),
      successCount: Number(data.success || data.successCount || 0),
      failedCount: Number(data.failed || data.failedCount || errors.length || 0),
      errors
    }
  } finally {
    importing.value = false
  }
}

function finishBatchImport() {
  batchDialogVisible.value = false
  resetBatchState()
}

onMounted(() => {
  loadTechnicians()
})
</script>

<style scoped>
.store-technicians {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card-success {
  border-color: #d1fae5;
}

.stat-card-warning {
  border-color: #fde68a;
}

.stat-card-danger {
  border-color: #fecaca;
}

.table-card {
  margin-bottom: 20px;
}

.permission-tag {
  margin-right: 6px;
  margin-bottom: 6px;
}

.permission-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

.batch-import-content {
  min-height: 280px;
}

.upload-header,
.upload-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.upload-footer {
  margin-top: 16px;
  justify-content: flex-end;
  gap: 12px;
}

.result-summary {
  display: flex;
  justify-content: center;
  gap: 24px;
  color: #606266;
}
</style>
