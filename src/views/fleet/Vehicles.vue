<template>
  <div class="fleet-vehicles-page">
    <div class="page-header">
      <h2>车辆管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="openBatchDialog">
          <el-icon><UploadFilled /></el-icon>
          批量导入
        </el-button>
        <el-dropdown split-button type="warning" :loading="exporting" @click="handleExport('filtered')">
          <el-icon><Download /></el-icon>
          导出车辆
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleExport('filtered')">导出当前筛选</el-dropdown-item>
              <el-dropdown-item @click="handleExport('all')">导出全部车辆</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增车辆
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="车辆总数" :value="stats.total" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic title="正常运营" :value="stats.normal" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic title="维修中" :value="stats.repairing" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-danger">
          <el-statistic title="已报废" :value="stats.scrapped" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <el-form :inline="true" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="正常运营" value="normal" />
            <el-option label="维修中" value="repairing" />
            <el-option label="已报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="车牌号 / VIN / 品牌 / 车型"
            clearable
            style="width: 260px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="vehicleList" stripe>
        <el-table-column prop="plateNumber" label="车牌号" width="140" fixed="left" />
        <el-table-column prop="vehicleType" label="车辆类型" width="120" />
        <el-table-column prop="vin" label="VIN" min-width="180" />
        <el-table-column prop="engineNumber" label="发动机号" min-width="160" />
        <el-table-column prop="engineBrand" label="发动机品牌" width="140" />
        <el-table-column prop="engineModel" label="发动机型号" width="140" />
        <el-table-column prop="brand" label="车辆品牌" width="120" />
        <el-table-column prop="model" label="车辆型号" min-width="140" />
        <el-table-column prop="driveType" label="驱动形式" width="100" />
        <el-table-column prop="year" label="年份" width="100" />
        <el-table-column label="当前司机" min-width="180">
          <template #default="{ row }">
            <div>{{ row.currentDriverId?.nickname || row.currentDriverId?.name || '-' }}</div>
            <div class="sub-text">{{ row.currentDriverId?.phone || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
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
                  <el-dropdown-item @click="handleUpdateStatus(row, 'repairing')">设为维修中</el-dropdown-item>
                  <el-dropdown-item @click="handleUpdateStatus(row, 'scrapped')">设为已报废</el-dropdown-item>
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
        @size-change="loadVehicles"
        @current-change="loadVehicles"
      />
    </el-card>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑车辆' : '新增车辆'"
      width="720px"
      @close="resetVehicleForm"
    >
      <el-form ref="vehicleFormRef" :model="vehicleForm" :rules="formRules" label-width="110px">
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="车牌号" prop="plateNumber">
              <el-input v-model="vehicleForm.plateNumber" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="车辆类型" prop="vehicleType">
              <el-select v-model="vehicleForm.vehicleType" filterable allow-create default-first-option style="width: 100%">
                <el-option v-for="item in vehicleTypeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="VIN" prop="vin">
              <el-input v-model="vehicleForm.vin" maxlength="17" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="年份" prop="year">
              <el-input-number v-model="vehicleForm.year" :min="1990" :max="nextYear" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="发动机号" prop="engineNumber">
              <el-input v-model="vehicleForm.engineNumber" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="发动机品牌" prop="engineBrand">
              <el-input v-model="vehicleForm.engineBrand" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="发动机型号" prop="engineModel">
              <el-input v-model="vehicleForm.engineModel" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="车辆品牌" prop="brand">
              <el-input v-model="vehicleForm.brand" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="车辆型号" prop="model">
              <el-input v-model="vehicleForm.model" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="驱动形式">
              <el-select v-model="vehicleForm.driveType" clearable style="width: 100%">
                <el-option v-for="item in driveTypeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="当前司机">
          <el-select v-model="vehicleForm.currentDriverId" clearable filterable style="width: 100%">
            <el-option
              v-for="driver in driverOptions"
              :key="driver._id"
              :label="`${driver.nickname || driver.name || '未命名司机'} ${driver.phone ? `(${driver.phone})` : ''}`"
              :value="driver._id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量导入车辆" width="760px" @close="resetBatchState">
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
import { batchImportVehicles } from '@/api/batch'
import {
  addVehicle,
  deleteVehicle,
  exportVehicles,
  getFleetVehicles,
  getVehicleStats,
  updateVehicle,
  updateVehicleStatus
} from '@/api/fleetVehicle'
import { buildVinRules, normalizeVin, trimValue } from '@/utils/formValidators'

const vehicleTypeOptions = ['牵引车', '挂车', '载货车', '轻卡', '自卸车', '平板车', '冷藏车', '罐车', '其他']
const driveTypeOptions = ['4x2', '6x2', '6x4', '8x2', '8x4', '10x4', '其他']
const nextYear = new Date().getFullYear() + 1

function createDefaultVehicleForm() {
  return {
    plateNumber: '',
    vehicleType: '',
    vin: '',
    engineNumber: '',
    engineBrand: '',
    engineModel: '',
    brand: '',
    model: '',
    driveType: '',
    year: new Date().getFullYear(),
    currentDriverId: ''
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
const currentVehicleId = ref('')
const uploadFile = ref(null)

const vehicleFormRef = ref(null)
const uploadRef = ref(null)

const vehicleList = ref([])
const driverOptions = ref([])
const total = ref(0)
const importResult = ref(createDefaultImportResult())

const stats = reactive({
  total: 0,
  normal: 0,
  repairing: 0,
  scrapped: 0
})

const queryParams = reactive({
  page: 1,
  limit: 20,
  status: '',
  keyword: ''
})

const vehicleForm = reactive(createDefaultVehicleForm())

const formRules = {
  plateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  vehicleType: [{ required: true, message: '请选择或输入车辆类型', trigger: 'change' }],
  vin: buildVinRules({
    requiredMessage: '请输入车架号（VIN）',
    invalidMessage: '请输入正确的 17 位车架号（VIN）'
  }),
  engineNumber: [{ required: true, message: '请输入发动机号', trigger: 'blur' }],
  engineBrand: [{ required: true, message: '请输入发动机品牌', trigger: 'blur' }],
  engineModel: [{ required: true, message: '请输入发动机型号', trigger: 'blur' }],
  brand: [{ required: true, message: '请输入车辆品牌', trigger: 'blur' }],
  model: [{ required: true, message: '请输入车辆型号', trigger: 'blur' }],
  year: [{ required: true, message: '请输入年份', trigger: 'change' }]
}

function normalizeVehicleForm() {
  vehicleForm.plateNumber = trimValue(vehicleForm.plateNumber).toUpperCase()
  vehicleForm.vehicleType = trimValue(vehicleForm.vehicleType)
  vehicleForm.vin = normalizeVin(vehicleForm.vin)
  vehicleForm.engineNumber = trimValue(vehicleForm.engineNumber)
  vehicleForm.engineBrand = trimValue(vehicleForm.engineBrand)
  vehicleForm.engineModel = trimValue(vehicleForm.engineModel)
  vehicleForm.brand = trimValue(vehicleForm.brand)
  vehicleForm.model = trimValue(vehicleForm.model)
  vehicleForm.driveType = trimValue(vehicleForm.driveType)
}

function resetVehicleForm() {
  Object.assign(vehicleForm, createDefaultVehicleForm())
  vehicleFormRef.value?.clearValidate()
}

function resetBatchState() {
  uploadFile.value = null
  importResult.value = createDefaultImportResult()
  uploadRef.value?.clearFiles?.()
}

function getStatusType(status) {
  return {
    normal: 'success',
    repairing: 'warning',
    scrapped: 'danger'
  }[status] || 'info'
}

function getStatusText(status) {
  return {
    normal: '正常运营',
    repairing: '维修中',
    scrapped: '已报废'
  }[status] || status || '-'
}

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-'
}

function normalizeImportErrors(errors = []) {
  if (!Array.isArray(errors)) {
    return []
  }

  return errors.map((item, index) => ({
    id: `${item?.row || index}-${index}`,
    row: item?.row || '-',
    field: item?.field || '',
    value: item?.value ?? item?.plateNumber ?? item?.vin ?? '',
    error: item?.error || item?.message || '导入失败'
  }))
}

function buildImportMessage({ message, total, successCount, failedCount, fallbackMessage }) {
  if (message) {
    return message
  }

  if (total > 0 || successCount > 0 || failedCount > 0) {
    return failedCount > 0
      ? `共 ${total} 行，成功导入 ${successCount} 行，失败 ${failedCount} 行，请根据失败明细修正后重试`
      : `成功导入 ${successCount} 行`
  }

  return fallbackMessage || '批量导入失败'
}

function buildImportResult(payload = {}, fallbackMessage = '') {
  const summary = payload?.data || payload || {}
  const errors = normalizeImportErrors(summary?.errors || payload?.errors || [])
  const total = Number(summary?.total ?? payload?.total ?? 0)
  const successCount = Number(summary?.success ?? summary?.successCount ?? payload?.success ?? payload?.successCount ?? 0)
  const failedCount = Number(summary?.failed ?? summary?.failedCount ?? payload?.failed ?? payload?.failedCount ?? errors.length ?? 0)

  return {
    message: buildImportMessage({
      message: payload?.message || summary?.message || '',
      total,
      successCount,
      failedCount,
      fallbackMessage
    }),
    total,
    successCount,
    failedCount,
    errors
  }
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

async function loadVehicles() {
  loading.value = true
  try {
    const response = await getFleetVehicles({ ...queryParams })
    vehicleList.value = Array.isArray(response?.data?.vehicles) ? response.data.vehicles : []
    total.value = Number(response?.data?.total || 0)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '加载车辆列表失败')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const response = await getVehicleStats()
    Object.assign(stats, response?.data || {})
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '加载统计失败')
  }
}

async function loadDrivers() {
  try {
    const response = await getFleetDrivers()
    driverOptions.value = Array.isArray(response?.data?.drivers) ? response.data.drivers : []
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '加载司机列表失败')
  }
}

function handleQuery() {
  queryParams.page = 1
  loadVehicles()
}

function handleReset() {
  queryParams.page = 1
  queryParams.limit = 20
  queryParams.status = ''
  queryParams.keyword = ''
  loadVehicles()
}

function handleAdd() {
  isEdit.value = false
  currentVehicleId.value = ''
  resetVehicleForm()
  formDialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  currentVehicleId.value = row._id
  Object.assign(vehicleForm, createDefaultVehicleForm(), {
    plateNumber: row.plateNumber || '',
    vehicleType: row.vehicleType || '',
    vin: row.vin || '',
    engineNumber: row.engineNumber || '',
    engineBrand: row.engineBrand || '',
    engineModel: row.engineModel || '',
    brand: row.brand || '',
    model: row.model || '',
    driveType: row.driveType || '',
    year: Number(row.year || new Date().getFullYear())
  })
  formDialogVisible.value = true
}

async function confirmSave() {
  try {
    saving.value = true
    normalizeVehicleForm()
    await vehicleFormRef.value?.validate()

    if (isEdit.value) {
      await updateVehicle(currentVehicleId.value, vehicleForm)
      ElMessage.success('车辆信息已更新')
    } else {
      await addVehicle(vehicleForm)
      ElMessage.success('车辆新增成功')
    }

    formDialogVisible.value = false
    await Promise.all([loadVehicles(), loadStats()])
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '保存车辆失败')
  } finally {
    saving.value = false
  }
}

async function handleUpdateStatus(row, status) {
  try {
    await ElMessageBox.confirm(`确认将车辆“${row.plateNumber}”状态修改为“${getStatusText(status)}”吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await updateVehicleStatus(row._id, { status })
    ElMessage.success('车辆状态已更新')
    await Promise.all([loadVehicles(), loadStats()])
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '更新车辆状态失败')
    }
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除车辆“${row.plateNumber}”吗？删除后不可恢复。`, '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'error'
    })

    await deleteVehicle(row._id)
    ElMessage.success('车辆已删除')
    await Promise.all([loadVehicles(), loadStats()])
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '删除车辆失败')
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
      url: '/batch/template/vehicles',
      method: 'get',
      responseType: 'blob'
    })

    downloadBlob(new Blob([response]), '车辆批量导入模板.xlsx')
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
    const response = await batchImportVehicles(formData, { skipErrorMessage: true })
    const normalizedImportResult = buildImportResult(response, '导入完成')

    importResult.value = {
      message: response?.message || '导入完成',
      total: normalizedImportResult.total,
      successCount: normalizedImportResult.successCount,
      failedCount: normalizedImportResult.failedCount,
      errors: normalizedImportResult.errors
    }

    if (importResult.value.successCount > 0) {
      await Promise.all([loadVehicles(), loadStats()])
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '批量导入失败')
    importResult.value = buildImportResult(error.response?.data || {}, error.message || '批量导入失败')
  } finally {
    importing.value = false
  }
}

function finishBatchImport() {
  batchDialogVisible.value = false
  resetBatchState()
}

async function handleExport(type = 'all') {
  exporting.value = true
  try {
    const params = {}
    if (queryParams.status) {
      params.status = queryParams.status
    }
    if (queryParams.keyword) {
      params.keyword = queryParams.keyword
    }
    if (type === 'all') {
      params.all = 'true'
    }

    const response = await exportVehicles(params)
    downloadBlob(
      new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `车辆列表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    )
    ElMessage.success('车辆导出成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '车辆导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadVehicles()
  loadStats()
})
</script>

<style scoped>
.fleet-vehicles-page {
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

.stats-row {
  margin-bottom: 0;
}

.stat-card-success {
  border-color: rgba(103, 194, 58, 0.25);
}

.stat-card-warning {
  border-color: rgba(230, 162, 60, 0.25);
}

.stat-card-danger {
  border-color: rgba(245, 108, 108, 0.25);
}

.table-card {
  width: 100%;
}

.search-form {
  margin-bottom: 16px;
}

.sub-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
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

.fleet-vehicles-page :deep(.el-dialog__body .el-form > .el-form-item:last-of-type) {
  display: none;
}

.fleet-vehicles-page :deep(.el-dialog__body .el-form::after) {
  content: '司机绑定请在司机管理中维护';
  display: block;
  margin-top: 8px;
  color: var(--el-color-info);
  font-size: 13px;
}

.fleet-vehicles-page :deep(.el-dialog__body .el-form::after) {
  content: '司机关联已改为在“司机管理”中统一维护，新增车辆时无需选择司机';
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-color-info-light-9);
  border: 1px solid var(--el-color-info-light-7);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
  }

  .dialog-footer-actions,
  .batch-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>
