<template>
  <div class="fleet-drivers-page">
    <div class="page-header">
      <h2>司机管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="openBatchDialog">
          <el-icon><UploadFilled /></el-icon>
          批量导入
        </el-button>
        <el-button type="warning" :loading="exporting" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出司机
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增司机
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="5">
        <el-card class="stat-card">
          <el-statistic title="司机总数" :value="stats.total" />
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card class="stat-card stat-card-success">
          <el-statistic title="正常" :value="stats.normal" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-info">
          <el-statistic title="待激活" :value="stats.pending_activation" />
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card class="stat-card stat-card-warning">
          <el-statistic title="待审核" :value="stats.pending_audit" />
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card class="stat-card stat-card-danger">
          <el-statistic title="已停用" :value="stats.suspended" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <el-form :inline="true" class="search-form">
        <el-form-item label="账号状态">
          <el-select v-model="queryParams.roleStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="正常" value="normal" />
            <el-option label="待审核" value="pending_audit" />
            <el-option label="已停用" value="suspended" />
          </el-select>
        </el-form-item>
        <el-form-item label="激活状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="正常" value="normal" />
            <el-option label="待激活" value="pending_activation" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="姓名 / 手机号"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="driverList" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="关联车辆" min-width="220">
          <template #default="{ row }">
            <div v-if="row.vehicles?.length" class="vehicle-tags">
              <el-tag v-for="vehicle in row.vehicles" :key="getVehicleId(vehicle)" size="small">
                {{ getVehicleDisplayText(vehicle) }}
              </el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column label="激活状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getActivationStatusType(row.status)">{{ getActivationStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleStatusType(row.role?.status)">{{ getRoleStatusText(row.role?.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
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
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="loadDrivers"
        @current-change="loadDrivers"
      />
    </el-card>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑司机' : '新增司机'"
      width="620px"
      @close="resetDriverForm"
    >
      <el-form ref="driverFormRef" :model="driverForm" :rules="formRules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="driverForm.name" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="driverForm.phone" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="driverForm.age" :min="18" :max="65" style="width: 100%" />
        </el-form-item>
        <el-form-item label="关联车辆">
          <el-select v-model="driverForm.vehicleIds" multiple clearable filterable style="width: 100%">
            <el-option
              v-for="vehicle in vehicleOptions"
              :key="vehicle._id"
              :label="`${vehicle.plateNumber} ${vehicle.brand || ''} ${vehicle.model || ''}`.trim()"
              :value="vehicle._id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量导入司机" width="760px" @close="resetBatchState">
      <div class="batch-content">
        <div v-if="!importResult.message">
          <div class="batch-toolbar">
            <el-button type="primary" link :loading="downloading" @click="downloadTemplateFile">
              <el-icon><Download /></el-icon>
              下载 Excel 模板
            </el-button>
          </div>

          <el-upload
            ref="uploadRef"
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
              将 Excel 文件拖到这里，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">仅支持 .xlsx / .xls，文件大小不超过 5MB</div>
            </template>
          </el-upload>

          <div class="dialog-footer-actions">
            <el-button @click="resetBatchState">重置</el-button>
            <el-button type="primary" :loading="importing" :disabled="!uploadFile" @click="startImport">
              开始导入
            </el-button>
          </div>
        </div>

        <div v-else>
          <el-result :icon="importResult.failedCount ? 'warning' : 'success'" :title="importResult.message">
            <template #sub-title>
              <div class="result-summary">
                <div>总计：{{ importResult.total }}</div>
                <div>成功：{{ importResult.successCount }}</div>
                <div>失败：{{ importResult.failedCount }}</div>
              </div>
            </template>
          </el-result>

          <el-table v-if="importResult.errors.length" :data="importResult.errors" size="small" max-height="320">
            <el-table-column prop="row" label="行号" width="80" />
            <el-table-column prop="field" label="字段" width="120" />
            <el-table-column prop="value" label="值" min-width="180" />
            <el-table-column prop="error" label="错误原因" min-width="260" />
          </el-table>

          <div class="dialog-footer-actions">
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
import { batchImportDrivers } from '@/api/batch'
import { getFleetVehicles } from '@/api/fleetVehicle'
import { buildPhoneRules, normalizePhone, trimValue } from '@/utils/formValidators'

function createDefaultDriverForm() {
  return {
    name: '',
    phone: '',
    age: null,
    vehicleIds: []
  }
}

function createDefaultImportResult() {
  return {
    message: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: []
  }
}

const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const downloading = ref(false)
const exporting = ref(false)

const formDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const isEdit = ref(false)
const currentDriverId = ref('')
const uploadFile = ref(null)

const driverFormRef = ref(null)
const uploadRef = ref(null)

const driverList = ref([])
const vehicleOptions = ref([])
const importResult = ref(createDefaultImportResult())
const total = ref(0)

const stats = reactive({
  total: 0,
  normal: 0,
  pending_activation: 0,
  pending_audit: 0,
  suspended: 0
})

const queryParams = reactive({
  page: 1,
  limit: 20,
  status: '',
  roleStatus: '',
  keyword: ''
})

const driverForm = reactive(createDefaultDriverForm())

const formRules = {
  name: [{ required: true, message: '请输入司机姓名', trigger: 'blur' }],
  phone: buildPhoneRules({
    requiredMessage: '请输入司机手机号',
    invalidMessage: '请输入正确的司机手机号'
  })
}

function normalizeDriverForm() {
  driverForm.name = trimValue(driverForm.name)
  driverForm.phone = normalizePhone(driverForm.phone)
}

function resetDriverForm() {
  Object.assign(driverForm, createDefaultDriverForm())
  driverFormRef.value?.clearValidate()
}

function resetBatchState() {
  uploadFile.value = null
  importResult.value = createDefaultImportResult()
  uploadRef.value?.clearFiles?.()
}

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-'
}

function getVehicleId(vehicle) {
  return vehicle?._id || vehicle?.vehicleId || vehicle?.id || vehicle || ''
}

function getVehicleDisplayText(vehicle) {
  if (!vehicle) {
    return '-'
  }

  if (typeof vehicle === 'string') {
    return vehicle
  }

  return vehicle.plateNumber || vehicle.vehicleId || '-'
}

function getActivationStatusType(status) {
  return status === 'pending_activation' ? 'warning' : 'success'
}

function getActivationStatusText(status) {
  return status === 'pending_activation' ? '待激活' : '正常'
}

function getRoleStatusType(status) {
  return {
    normal: 'success',
    pending_audit: 'warning',
    suspended: 'danger'
  }[status] || 'info'
}

function getRoleStatusText(status) {
  return {
    normal: '正常',
    pending_audit: '待审核',
    suspended: '已停用'
  }[status] || status || '-'
}

function normalizeImportErrors(errors = []) {
  if (!Array.isArray(errors)) {
    return []
  }

  return errors.map((item, index) => ({
    id: `${item?.row || index}-${index}`,
    row: item?.row || '-',
    field: item?.field || '',
    value: item?.value ?? item?.phone ?? item?.name ?? '',
    error: item?.error || item?.message || '导入失败'
  }))
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

async function loadDrivers() {
  loading.value = true
  try {
    const response = await request({
      url: '/fleet/drivers',
      method: 'get',
      params: { ...queryParams }
    })

    driverList.value = Array.isArray(response?.data?.drivers) ? response.data.drivers : []
    total.value = Number(response?.data?.total || 0)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '加载司机列表失败')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const response = await request({
      url: '/fleet/drivers/stats',
      method: 'get'
    })
    Object.assign(stats, response?.data || {})
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '加载司机统计失败')
  }
}

async function loadVehicleOptions() {
  try {
    const response = await getFleetVehicles({ page: 1, limit: 1000 })
    vehicleOptions.value = Array.isArray(response?.data?.vehicles) ? response.data.vehicles : []
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '加载车辆选项失败')
  }
}

function handleQuery() {
  queryParams.page = 1
  loadDrivers()
}

function handleReset() {
  queryParams.page = 1
  queryParams.limit = 20
  queryParams.status = ''
  queryParams.roleStatus = ''
  queryParams.keyword = ''
  loadDrivers()
}

function handleAdd() {
  isEdit.value = false
  currentDriverId.value = ''
  resetDriverForm()
  formDialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  currentDriverId.value = row._id
  Object.assign(driverForm, createDefaultDriverForm(), {
    name: row.name || '',
    phone: row.phone || '',
    age: row.age ?? null,
    vehicleIds: Array.isArray(row.vehicles) ? row.vehicles.map((item) => item?.vehicleId || item?._id).filter(Boolean) : []
  })
  formDialogVisible.value = true
}

async function confirmSave() {
  try {
    saving.value = true
    normalizeDriverForm()
    await driverFormRef.value?.validate()

    const payload = {
      ...driverForm,
      age: driverForm.age || undefined
    }

    if (isEdit.value) {
      await request({
        url: `/fleet/drivers/${currentDriverId.value}`,
        method: 'put',
        data: payload
      })
      ElMessage.success('司机信息已更新')
    } else {
      await request({
        url: '/fleet/drivers',
        method: 'post',
        data: payload
      })
      ElMessage.success('司机新增成功')
    }

    formDialogVisible.value = false
    await Promise.all([loadDrivers(), loadStats(), loadVehicleOptions()])
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '保存司机失败')
  } finally {
    saving.value = false
  }
}

async function handleUpdateStatus(row, status) {
  try {
    await ElMessageBox.confirm(`确认将司机“${row.name || row.phone}”状态修改为“${getRoleStatusText(status)}”吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request({
      url: `/fleet/drivers/${row._id}/status`,
      method: 'put',
      data: { status }
    })

    ElMessage.success('司机状态已更新')
    await Promise.all([loadDrivers(), loadStats()])
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '更新司机状态失败')
    }
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除司机“${row.name || row.phone}”吗？删除后不可恢复。`, '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'error'
    })

    await request({
      url: `/fleet/drivers/${row._id}`,
      method: 'delete'
    })

    ElMessage.success('司机已删除')
    await Promise.all([loadDrivers(), loadStats(), loadVehicleOptions()])
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '删除司机失败')
    }
  }
}

function openBatchDialog() {
  resetBatchState()
  batchDialogVisible.value = true
}

function handleFileChange(file) {
  uploadFile.value = file.raw
}

function handleExceed() {
  ElMessage.warning('一次只能上传一个文件')
}

async function downloadTemplateFile() {
  downloading.value = true
  try {
    const response = await request({
      url: '/batch/template/drivers',
      method: 'get',
      responseType: 'blob'
    })

    downloadBlob(new Blob([response]), '司机批量导入模板.xlsx')
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '模板下载失败')
  } finally {
    downloading.value = false
  }
}

async function startImport() {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择 Excel 文件')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.value)
    const response = await batchImportDrivers(formData)

    importResult.value = {
      message: response?.message || '导入完成',
      total: Number(response?.data?.total || 0),
      successCount: Number(response?.data?.successCount || 0),
      failedCount: Number(response?.data?.failedCount || 0),
      errors: normalizeImportErrors(response?.data?.errors || [])
    }

    await Promise.all([loadDrivers(), loadStats(), loadVehicleOptions()])
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '批量导入失败')
  } finally {
    importing.value = false
  }
}

function finishBatchImport() {
  batchDialogVisible.value = false
  resetBatchState()
}

async function handleExport() {
  exporting.value = true
  try {
    const response = await request({
      url: '/fleet/drivers',
      method: 'get',
      params: {
        ...queryParams,
        page: 1,
        limit: 10000
      }
    })

    const drivers = Array.isArray(response?.data?.drivers) ? response.data.drivers : []
    if (!drivers.length) {
      ElMessage.warning('当前没有可导出的司机数据')
      return
    }

    const csvContent = [
      ['姓名', '手机号', '年龄', '关联车辆', '激活状态', '账号状态', '创建时间'].join(','),
      ...drivers.map((driver) => [
        driver.name || '',
        driver.phone || '',
        driver.age || '',
        (driver.vehicles || []).map((item) => getVehicleDisplayText(item)).join('、'),
        getActivationStatusText(driver.status),
        getRoleStatusText(driver.role?.status),
        formatDate(driver.createdAt)
      ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    ].join('\n')

    downloadBlob(new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }), `司机列表_${dayjs().format('YYYYMMDD_HHmmss')}.csv`)
    ElMessage.success(`已导出 ${drivers.length} 条司机记录`)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '司机导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadDrivers()
  loadStats()
  loadVehicleOptions()
})
</script>

<style scoped>
.fleet-drivers-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.table-card {
  width: 100%;
}

.search-form {
  margin-bottom: 16px;
}

.vehicle-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

.batch-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.batch-toolbar,
.dialog-footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer-actions {
  margin-top: 20px;
}

.result-summary {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
  }

  .batch-toolbar,
  .dialog-footer-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>
