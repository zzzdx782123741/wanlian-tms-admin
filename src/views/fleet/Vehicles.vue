<template>
  <div class="fleet-vehicles">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="总车辆数" :value="stats.total" />
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

    <!-- 车辆列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>车队车辆管理</span>
          <div>
            <el-button type="success" size="small" @click="handleBatchImport">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="primary" size="small" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加车辆
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" value="normal" />
            <el-option label="维修中" value="repairing" />
            <el-option label="已报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="车牌号/VIN/品牌/型号"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="vehicleList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="plateNumber" label="车牌号" width="140" fixed="left" />
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="brand" label="品牌" width="120" />
        <el-table-column prop="model" label="车型" width="150" />
        <el-table-column prop="year" label="年份" width="100" />
        <el-table-column label="当前司机" width="120">
          <template #default="{ row }">
            {{ row.currentDriverId?.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="司机电话" width="140">
          <template #default="{ row }">
            {{ row.currentDriverId?.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="110">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-dropdown style="margin-left: 10px">
              <el-button type="primary" size="small" link>
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleUpdateStatus(row, 'normal')">
                    <el-tag size="small" type="success" style="margin-right: 8px">正常</el-tag>
                    设为正常
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleUpdateStatus(row, 'repairing')">
                    <el-tag size="small" type="warning" style="margin-right: 8px">维修</el-tag>
                    设为维修中
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleUpdateStatus(row, 'scrapped')">
                    <el-tag size="small" type="danger" style="margin-right: 8px">报废</el-tag>
                    设为报废
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(row)">
                    <el-icon><Delete /></el-icon>
                    删除车辆
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px"
        @size-change="fetchVehicles"
        @current-change="fetchVehicles"
      />
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑车辆' : '添加车辆'"
      width="600px"
    >
      <el-form :model="vehicleForm" :rules="formRules" ref="vehicleFormRef" label-width="100px">
        <el-form-item label="车牌号" prop="plateNumber">
          <el-input v-model="vehicleForm.plateNumber" placeholder="请输入车牌号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="VIN码">
          <el-input v-model="vehicleForm.vin" placeholder="请输入VIN码（可选）" />
        </el-form-item>
        <el-form-item label="品牌" prop="brand">
          <el-select v-model="vehicleForm.brand" placeholder="请选择品牌" style="width: 100%">
            <el-option label="东风" value="东风" />
            <el-option label="解放" value="解放" />
            <el-option label="陕汽" value="陕汽" />
            <el-option label="重汽" value="重汽" />
            <el-option label="江淮" value="江淮" />
            <el-option label="福田" value="福田" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="车型" prop="model">
          <el-input v-model="vehicleForm.model" placeholder="请输入车型" />
        </el-form-item>
        <el-form-item label="年份" prop="year">
          <el-date-picker
            v-model="vehicleForm.year"
            type="year"
            placeholder="选择年份"
            value-format="YYYY"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="当前司机">
          <el-select v-model="vehicleForm.currentDriverId" placeholder="请选择司机（可选）" clearable style="width: 100%">
            <el-option
              v-for="driver in driverList"
              :key="driver._id"
              :label="`${driver.nickname} (${driver.phone || '无电话'})`"
              :value="driver._id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSave" :loading="saving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量导入车辆"
      width="700px"
    >
      <div class="batch-import-content">
        <!-- 步骤说明 -->
        <el-steps :active="batchStep" align-center style="margin-bottom: 30px">
          <el-step title="下载模板" />
          <el-step title="上传文件" />
          <el-step title="导入完成" />
        </el-steps>

        <!-- 步骤1: 下载模板 -->
        <div v-if="batchStep === 0" class="step-content">
          <el-alert
            title="导入说明"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            <ul>
              <li>请先下载 Excel 模板，按照模板格式填写车辆信息</li>
              <li>车牌号为必填项，其他字段选填</li>
              <li>当前司机可填写司机姓名或手机号，系统将自动关联</li>
              <li>支持导入最多 1000 条数据</li>
            </ul>
          </el-alert>
          <el-button type="primary" @click="downloadTemplate" :loading="downloading">
            <el-icon><Download /></el-icon>
            下载 Excel 模板
          </el-button>
        </div>

        <!-- 步骤2: 上传文件 -->
        <div v-if="batchStep === 1" class="step-content">
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
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽 Excel 文件到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只支持 .xlsx 或 .xls 格式，文件大小不超过 5MB
              </div>
            </template>
          </el-upload>
          <div style="text-align: right; margin-top: 20px">
            <el-button @click="batchStep = 0">上一步</el-button>
            <el-button type="primary" @click="startImport" :loading="importing" :disabled="!uploadFile">
              开始导入
            </el-button>
          </div>
        </div>

        <!-- 步骤3: 导入结果 -->
        <div v-if="batchStep === 2" class="step-content">
          <el-result
            :icon="importResult.successCount > 0 ? 'success' : 'error'"
            :title="importResult.message"
          >
            <template #sub-title>
              <div class="result-stats">
                <p>总计: {{ importResult.total }} 条</p>
                <p style="color: #67c23a">成功: {{ importResult.successCount }} 条</p>
                <p style="color: #f56c6c">失败: {{ importResult.failedCount }} 条</p>
              </div>
            </template>
            <template #extra>
              <div v-if="importResult.errors && importResult.errors.length > 0" class="error-list">
                <el-divider content-position="left">错误详情</el-divider>
                <el-scrollbar height="200px">
                  <div v-for="(error, index) in importResult.errors.slice(0, 50)" :key="index" class="error-item">
                    第 {{ error.row }} 行: {{ error.error }}
                  </div>
                  <div v-if="importResult.errors.length > 50" class="error-item">
                    还有 {{ importResult.errors.length - 50 }} 条错误...
                  </div>
                </el-scrollbar>
              </div>
              <div style="margin-top: 20px">
                <el-button @click="batchDialogVisible = false">关闭</el-button>
                <el-button v-if="importResult.failedCount > 0" type="primary" @click="batchStep = 1; uploadFile = null">
                  重新导入
                </el-button>
              </div>
            </template>
          </el-result>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload, UploadFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'
import {
  getFleetVehicles,
  addVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
  getFleetDrivers,
  getVehicleStats
} from '@/api/fleetVehicle'
import dayjs from 'dayjs'

const loading = ref(false)
const saving = ref(false)
const vehicleList = ref([])
const driverList = ref([])
const total = ref(0)
const stats = ref({
  total: 0,
  normal: 0,
  repairing: 0,
  scrapped: 0
})

const queryParams = ref({
  page: 1,
  limit: 20,
  status: '',
  keyword: ''
})

const formDialogVisible = ref(false)
const isEdit = ref(false)
const vehicleFormRef = ref()
const currentVehicleId = ref('')

const vehicleForm = ref({
  plateNumber: '',
  vin: '',
  brand: '',
  model: '',
  year: null,
  currentDriverId: null
})

const formRules = {
  plateNumber: [
    { required: true, message: '请输入车牌号', trigger: 'blur' }
  ],
  brand: [
    { required: true, message: '请选择品牌', trigger: 'change' }
  ],
  model: [
    { required: true, message: '请输入车型', trigger: 'blur' }
  ],
  year: [
    { required: true, message: '请选择年份', trigger: 'change' }
  ]
}

// 批量导入相关
const batchDialogVisible = ref(false)
const batchStep = ref(0)
const uploading = ref(false)
const importing = ref(false)
const downloading = ref(false)
const uploadFile = ref(null)
const uploadRef = ref()
const importResult = ref({
  message: '',
  total: 0,
  successCount: 0,
  failedCount: 0,
  errors: []
})

// 获取车辆列表
const fetchVehicles = async () => {
  loading.value = true
  try {
    const res = await getFleetVehicles(queryParams.value)
    vehicleList.value = res.data.vehicles || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取车辆列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await getVehicleStats()
    stats.value = res.data
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 获取司机列表
const fetchDrivers = async () => {
  try {
    const res = await getFleetDrivers()
    driverList.value = res.data.drivers || []
  } catch (error) {
    console.error('获取司机列表失败:', error)
  }
}

// 查询
const handleQuery = () => {
  queryParams.value.page = 1
  fetchVehicles()
}

// 重置
const handleReset = () => {
  queryParams.value = {
    page: 1,
    limit: 20,
    status: '',
    keyword: ''
  }
  fetchVehicles()
}

// 添加车辆
const handleAdd = () => {
  isEdit.value = false
  currentVehicleId.value = ''
  vehicleForm.value = {
    plateNumber: '',
    vin: '',
    brand: '',
    model: '',
    year: null,
    currentDriverId: null
  }
  formDialogVisible.value = true
}

// 编辑车辆
const handleEdit = (row) => {
  isEdit.value = true
  currentVehicleId.value = row._id
  vehicleForm.value = {
    plateNumber: row.plateNumber,
    vin: row.vin || '',
    brand: row.brand || '',
    model: row.model || '',
    year: row.year || null,
    currentDriverId: row.currentDriverId?._id || null
  }
  formDialogVisible.value = true
}

// 确认保存
const confirmSave = async () => {
  const valid = await vehicleFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (isEdit.value) {
      await updateVehicle(currentVehicleId.value, vehicleForm.value)
      ElMessage.success('更新成功')
    } else {
      await addVehicle(vehicleForm.value)
      ElMessage.success('添加成功')
    }
    formDialogVisible.value = false
    fetchVehicles()
    fetchStats()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

// 更新状态
const handleUpdateStatus = async (row, status) => {
  const statusText = getStatusText(status)
  try {
    await ElMessageBox.confirm(`确定要将该车辆设为${statusText}吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateVehicleStatus(row._id, { status })
    ElMessage.success('状态更新成功')
    fetchVehicles()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新状态失败:', error)
    }
  }
}

// 删除车辆
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该车辆吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    await deleteVehicle(row._id)
    ElMessage.success('删除成功')
    fetchVehicles()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'normal': 'success',
    'repairing': 'warning',
    'scrapped': 'danger'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'normal': '正常',
    'repairing': '维修中',
    'scrapped': '已报废'
  }
  return textMap[status] || status
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 打开批量导入对话框
const handleBatchImport = () => {
  batchStep.value = 0
  uploadFile.value = null
  importResult.value = {
    message: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: []
  }
  batchDialogVisible.value = true
}

// 下载模板
const downloadTemplate = async () => {
  downloading.value = true
  try {
    const response = await request({
      url: '/batch/template/vehicles',
      method: 'get',
      responseType: 'blob'
    })

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.download = '车辆导入模板.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('模板下载成功')
    batchStep.value = 1
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败')
  } finally {
    downloading.value = false
  }
}

// 文件选择变化
const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

// 文件超出限制
const handleExceed = () => {
  ElMessage.warning('只能上传一个文件')
}

// 开始导入
const startImport = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.value)

    const res = await request({
      url: '/batch/vehicles',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    // 处理导入结果
    importResult.value = {
      message: res.message || '导入完成',
      total: res.data.total,
      successCount: res.data.success,
      failedCount: res.data.failed,
      errors: res.data.errors || []
    }

    batchStep.value = 2

    // 如果有成功的，刷新列表
    if (res.data.success > 0) {
      fetchVehicles()
      fetchStats()
    }
  } catch (error) {
    console.error('导入失败:', error)
    importResult.value = {
      message: error.message || '导入失败',
      total: 0,
      successCount: 0,
      failedCount: 0,
      errors: []
    }
    batchStep.value = 2
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  fetchVehicles()
  fetchStats()
  fetchDrivers()
})
</script>

<style scoped lang="scss">
.fleet-vehicles {
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

    &.stat-card-danger :deep(.el-statistic__number) {
      color: #f56c6c;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;

    > div {
      display: flex;
      gap: 10px;
    }
  }

  .search-form {
    margin-bottom: 20px;
  }

  .batch-import-content {
    .step-content {
      min-height: 300px;
      padding: 20px;
    }

    .upload-area {
      :deep(.el-upload-dragger) {
        padding: 40px;
      }
    }

    .result-stats {
      p {
        margin: 5px 0;
        font-size: 16px;
      }
    }

    .error-list {
      margin-top: 20px;
      padding: 15px;
      background: #fef0f0;
      border-radius: 4px;

      .error-item {
        padding: 8px 0;
        font-size: 14px;
        color: #f56c6c;
        border-bottom: 1px solid #fde2e2;

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }
}
</style>
