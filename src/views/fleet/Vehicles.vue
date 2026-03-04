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
          <div class="header-actions">
            <el-button v-if="userRole === 'FLEET_MANAGER'" type="success" size="small" @click="handleBatchImport">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-dropdown split-button type="warning" size="small" @click="handleExport('filtered')" :loading="exporting">
              <el-icon><Download /></el-icon>
              导出数据
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleExport('filtered')">
                    导出当前页 ({{ vehicleList.length }} 条)
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport('all')">
                    导出全部 ({{ total }} 条)
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
          <div class="form-actions">
            <el-button type="primary" @click="handleQuery">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
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
        <el-table-column prop="vehicleType" label="车辆类型" width="100" />
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="engineNumber" label="发动机号" width="150" />
        <el-table-column prop="brand" label="品牌" width="120" />
        <el-table-column prop="model" label="车型" width="150" />
        <el-table-column prop="driveType" label="驱动形式" width="100" />
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
      <el-form :model="vehicleForm" :rules="formRules" ref="vehicleFormRef" label-width="120px">
        <el-form-item label="车牌号" prop="plateNumber">
          <el-input v-model="vehicleForm.plateNumber" placeholder="请输入车牌号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="车辆类型" prop="vehicleType">
          <el-select v-model="vehicleForm.vehicleType" placeholder="请选择车辆类型" style="width: 100%" @change="handleVehicleTypeChange">
            <el-option label="牵引车" value="牵引车" />
            <el-option label="挂车" value="挂车" />
            <el-option label="载货车" value="载货车" />
            <el-option label="轻卡" value="轻卡" />
            <el-option label="自卸车" value="自卸车" />
            <el-option label="平板车" value="平板车" />
            <el-option label="冷藏车" value="冷藏车" />
            <el-option label="罐车" value="罐车" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="vehicleForm.vehicleType === '其他'"
          label="自定义车辆类型"
          prop="vehicleTypeOther"
        >
          <el-input
            v-model="vehicleForm.vehicleTypeOther"
            placeholder="请输入具体的车辆类型"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="VIN码" prop="vin">
          <el-input v-model="vehicleForm.vin" placeholder="请输入17位VIN码（必填）" maxlength="17" />
        </el-form-item>
        <el-form-item label="发动机号" prop="engineNumber">
          <el-input v-model="vehicleForm.engineNumber" placeholder="请输入发动机号（必填）" />
        </el-form-item>
        <el-form-item label="发动机品牌" prop="engineBrand">
          <el-input v-model="vehicleForm.engineBrand" placeholder="请输入发动机品牌（如：潍柴、玉柴）" />
        </el-form-item>
        <el-form-item label="发动机型号" prop="engineModel">
          <el-input v-model="vehicleForm.engineModel" placeholder="请输入发动机型号（如：WP13）" />
        </el-form-item>
        <el-form-item label="品牌" prop="brand">
          <el-select v-model="vehicleForm.brand" placeholder="请选择品牌" style="width: 100%" @change="handleBrandChange">
            <el-option label="东风" value="东风" />
            <el-option label="解放" value="解放" />
            <el-option label="陕汽" value="陕汽" />
            <el-option label="重汽" value="重汽" />
            <el-option label="江淮" value="江淮" />
            <el-option label="福田" value="福田" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="vehicleForm.brand === '其他'"
          label="自定义品牌"
          prop="brandOther"
        >
          <el-input
            v-model="vehicleForm.brandOther"
            placeholder="请输入具体的车辆品牌"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="车型" prop="model">
          <el-input v-model="vehicleForm.model" placeholder="请输入车型" />
        </el-form-item>
        <el-form-item label="驱动形式">
          <el-select v-model="vehicleForm.driveType" placeholder="请选择驱动形式（可选）" clearable style="width: 100%">
            <el-option label="4x2" value="4x2" />
            <el-option label="6x2" value="6x2" />
            <el-option label="6x4" value="6x4" />
            <el-option label="8x2" value="8x2" />
            <el-option label="8x4" value="8x4" />
            <el-option label="10x4" value="10x4" />
            <el-option label="其他" value="其他" />
          </el-select>
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
        <!-- 未显示结果时显示上传界面 -->
        <div v-if="!importResult.message" class="upload-section">
          <!-- 顶部操作栏 -->
          <div class="upload-header">
            <el-button type="primary" link @click="downloadTemplate" :loading="downloading">
              <el-icon><Download /></el-icon>
              下载 Excel 模板
            </el-button>
          </div>

          <!-- 上传区域 -->
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

          <!-- 字段说明 -->
          <div class="field-info">
            <el-divider content-position="left">
              <el-icon><InfoFilled /></el-icon>
              字段说明
            </el-divider>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="必填字段" label-class-name="required-field">
                车牌号、车辆类型、VIN码、发动机号、发动机品牌、发动机型号、品牌、车型、年份
              </el-descriptions-item>
              <el-descriptions-item label="选填字段">
                驱动形式、当前司机（可填姓名或手机号）
              </el-descriptions-item>
              <el-descriptions-item label="数据限制" :span="2">
                最多导入 1000 条数据
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 底部按钮 -->
          <div class="upload-footer">
            <el-button @click="batchDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="startImport" :loading="importing" :disabled="!uploadFile">
              <el-icon><Upload /></el-icon>
              开始导入
            </el-button>
          </div>
        </div>

        <!-- 导入结果 -->
        <div v-else class="result-section">
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
                <el-button v-if="importResult.failedCount > 0" type="primary" @click="resetImport">
                  <el-icon><Refresh /></el-icon>
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
import { Download, Upload, UploadFilled, InfoFilled, Refresh, ArrowDown } from '@element-plus/icons-vue'
import request from '@/utils/request'
import {
  getFleetVehicles,
  addVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
  getFleetDrivers,
  getVehicleStats,
  exportVehicles
} from '@/api/fleetVehicle'
import dayjs from 'dayjs'

// 获取用户角色
const userRole = localStorage.getItem('role') || ''

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
  vehicleType: '',
  vehicleTypeOther: '',
  vin: '',
  engineNumber: '',
  engineBrand: '',
  engineModel: '',
  brand: '',
  brandOther: '',
  model: '',
  driveType: '',
  year: null,
  currentDriverId: null
})

const formRules = {
  plateNumber: [
    { required: true, message: '请输入车牌号', trigger: 'blur' }
  ],
  vehicleType: [
    { required: true, message: '请选择车辆类型', trigger: 'change' }
  ],
  vehicleTypeOther: [
    {
      validator: (rule, value, callback) => {
        if (vehicleForm.value.vehicleType === '其他' && !value) {
          callback(new Error('请输入自定义车辆类型'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  vin: [
    { required: true, message: '请输入VIN码', trigger: 'blur' },
    { len: 17, message: 'VIN码必须为17位', trigger: 'blur' }
  ],
  engineNumber: [
    { required: true, message: '请输入发动机号', trigger: 'blur' }
  ],
  engineBrand: [
    { required: true, message: '请输入发动机品牌', trigger: 'blur' }
  ],
  engineModel: [
    { required: true, message: '请输入发动机型号', trigger: 'blur' }
  ],
  brand: [
    { required: true, message: '请选择品牌', trigger: 'change' }
  ],
  brandOther: [
    {
      validator: (rule, value, callback) => {
        if (vehicleForm.value.brand === '其他' && !value) {
          callback(new Error('请输入自定义品牌'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
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
const importing = ref(false)
const downloading = ref(false)
const uploadFile = ref(null)
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
    vehicleType: '',
    vehicleTypeOther: '',
    vin: '',
    engineNumber: '',
    engineBrand: '',
    engineModel: '',
    brand: '',
    brandOther: '',
    model: '',
    driveType: '',
    year: null,
    currentDriverId: null
  }
  formDialogVisible.value = true
}

// 编辑车辆
const handleEdit = (row) => {
  isEdit.value = true
  currentVehicleId.value = row._id

  // 检查车辆类型是否在预定义列表中
  const predefinedVehicleTypes = ['牵引车', '挂车', '载货车', '轻卡', '自卸车', '平板车', '冷藏车', '罐车']
  const vehicleType = row.vehicleType || ''
  const vehicleTypeOther = predefinedVehicleTypes.includes(vehicleType) ? '' : vehicleType

  // 检查品牌是否在预定义列表中
  const predefinedBrands = ['东风', '解放', '陕汽', '重汽', '江淮', '福田']
  const brand = row.brand || ''
  const brandOther = predefinedBrands.includes(brand) ? '' : brand

  vehicleForm.value = {
    plateNumber: row.plateNumber,
    vehicleType: vehicleTypeOther ? '其他' : vehicleType,
    vehicleTypeOther,
    vin: row.vin || '',
    engineNumber: row.engineNumber || '',
    engineBrand: row.engineBrand || '',
    engineModel: row.engineModel || '',
    brand: brandOther ? '其他' : brand,
    brandOther,
    model: row.model || '',
    driveType: row.driveType || '',
    // 将数字格式的年份转换为字符串，以匹配 el-date-picker 的 value-format="YYYY"
    year: row.year ? String(row.year) : null,
    currentDriverId: row.currentDriverId?._id || null
  }
  formDialogVisible.value = true
}

// 处理车辆类型变化
const handleVehicleTypeChange = (value) => {
  if (value !== '其他') {
    vehicleForm.value.vehicleTypeOther = ''
  }
}

// 处理品牌变化
const handleBrandChange = (value) => {
  if (value !== '其他') {
    vehicleForm.value.brandOther = ''
  }
}

// 确认保存
const confirmSave = async () => {
  const valid = await vehicleFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    // 准备提交的数据，如果选择了"其他"，使用自定义的值
    const submitData = { ...vehicleForm.value }
    if (submitData.vehicleType === '其他' && submitData.vehicleTypeOther) {
      submitData.vehicleType = submitData.vehicleTypeOther
    }
    if (submitData.brand === '其他' && submitData.brandOther) {
      submitData.brand = submitData.brandOther
    }
    // 删除临时字段
    delete submitData.vehicleTypeOther
    delete submitData.brandOther

    if (isEdit.value) {
      await updateVehicle(currentVehicleId.value, submitData)
      ElMessage.success('更新成功')
    } else {
      await addVehicle(submitData)
      ElMessage.success('添加成功')
    }
    formDialogVisible.value = false
    fetchVehicles()
    fetchStats()
  } catch (error) {
    // 错误消息已经在 request.js 的响应拦截器中显示
    // 这里只需要处理特殊情况
    console.error('保存失败:', error)

    // 如果需要，可以显示更详细的错误信息
    const errorMsg = error.response?.data?.message || error.message || '保存失败'
    ElMessage.error({
      message: errorMsg,
      duration: 5000
    })
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

// 重置导入状态
const resetImport = () => {
  uploadFile.value = null
  importResult.value = {
    message: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: []
  }
}

// 导出车辆列表
const exporting = ref(false)

const handleExport = async (type = 'all') => {
  exporting.value = true
  try {
    const params = {}
    if (type === 'filtered') {
      // 导出当前页数据（支持筛选）
      if (queryParams.value.status) params.status = queryParams.value.status
      if (queryParams.value.keyword) params.keyword = queryParams.value.keyword
      params.limit = vehicleList.value.length
    } else {
      // 导出全部数据（支持筛选）
      if (queryParams.value.status) params.status = queryParams.value.status
      if (queryParams.value.keyword) params.keyword = queryParams.value.keyword
      params.all = 'true'
    }

    const response = await exportVehicles(params)
    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `车辆列表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '导出失败')
  } finally {
    exporting.value = false
  }
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
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .form-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .search-form {
    margin-bottom: 20px;
  }

  .batch-import-content {
    .upload-section {
      padding: 10px 0;
    }

    .upload-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .upload-area {
      margin-bottom: 30px;

      :deep(.el-upload-dragger) {
        padding: 40px;
      }
    }

    .field-info {
      margin-bottom: 30px;

      :deep(.required-field) {
        font-weight: 600;
        color: #f56c6c;
      }

      :deep(.el-descriptions__label) {
        width: 100px;
      }
    }

    .upload-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;
    }

    .result-section {
      padding: 20px 0;
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
