<template>
  <div class="fleet-drivers">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
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

    <!-- 司机列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>车队司机管理</span>
          <div class="header-actions">
            <el-button v-if="userRole === 'FLEET_MANAGER'" type="success" size="small" @click="handleBatchImport">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="warning" size="small" @click="handleBatchExport">
              <el-icon><Download /></el-icon>
              批量导出
            </el-button>
            <el-button type="primary" size="small" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加司机
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="角色状态">
          <el-select v-model="queryParams.roleStatus" placeholder="全部" clearable style="width: 130px">
            <el-option label="正常" value="normal" />
            <el-option label="待审核" value="pending_audit" />
            <el-option label="已停用" value="suspended" />
          </el-select>
        </el-form-item>
        <el-form-item label="激活状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="正常" value="normal" />
            <el-option label="待激活" value="pending_activation" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="姓名/手机号"
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
        :data="driverList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="关联车辆" min-width="200">
          <template #default="{ row }">
            <div v-if="row.vehicles && row.vehicles.length > 0">
              <el-tag
                v-for="v in row.vehicles"
                :key="v._id"
                size="small"
                style="margin-right: 5px; margin-bottom: 5px"
              >
                {{ v.plateNumber || v }}
              </el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column label="激活状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getActivationStatusType(row.status)">
              {{ getActivationStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleStatusType(row.role?.status)">
              {{ getRoleStatusText(row.role?.status) }}
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
            <el-button type="primary" size="small" link @click="handleEdit(row)">
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
                  <el-dropdown-item @click="handleUpdateStatus(row, 'suspended')">
                    <el-tag size="small" type="danger" style="margin-right: 8px">停用</el-tag>
                    设为停用
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(row)">
                    <el-icon><Delete /></el-icon>
                    删除司机
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
        @size-change="fetchDrivers"
        @current-change="fetchDrivers"
      />
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑司机' : '添加司机'"
      width="600px"
    >
      <el-form :model="driverForm" :rules="formRules" ref="driverFormRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="driverForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="driverForm.phone" placeholder="请输入手机号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="OpenID">
          <el-input v-model="driverForm.openid" placeholder="微信OpenID（可选）" />
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="driverForm.age" :min="18" :max="65" placeholder="年龄" />
        </el-form-item>
        <el-form-item label="关联车辆">
          <el-select
            v-model="driverForm.vehicleIds"
            placeholder="请选择关联车辆（可多选）"
            clearable
            multiple
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="vehicle in vehicleList"
              :key="vehicle._id"
              :label="`${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model}`"
              :value="vehicle._id"
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
      title="批量导入司机"
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
                姓名、手机号
              </el-descriptions-item>
              <el-descriptions-item label="选填字段">
                年龄、OpenID（微信）、关联车辆（可填车牌号，多个用逗号分隔）
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
import { Download, Upload, UploadFilled, Plus, Search, ArrowDown, Delete, InfoFilled, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getFleetVehicles } from '@/api/fleetVehicle'
import dayjs from 'dayjs'

// 获取用户角色
const userRole = localStorage.getItem('role') || ''

const loading = ref(false)
const saving = ref(false)
const driverList = ref([])
const vehicleList = ref([])
const total = ref(0)
const stats = ref({
  total: 0,
  normal: 0,
  pending_activation: 0,
  pending_audit: 0,
  suspended: 0
})

const queryParams = ref({
  page: 1,
  limit: 20,
  status: '',
  roleStatus: '',
  keyword: ''
})

const formDialogVisible = ref(false)
const isEdit = ref(false)
const driverFormRef = ref()
const currentDriverId = ref('')

const driverForm = ref({
  name: '',
  phone: '',
  openid: '',
  age: null,
  vehicleIds: []
})

const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 批量导入相关
const batchDialogVisible = ref(false)
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

// 获取司机列表
const fetchDrivers = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/fleet/drivers',
      method: 'get',
      params: queryParams.value
    })
    driverList.value = res.data.drivers || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取司机列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await request({
      url: '/fleet/drivers/stats',
      method: 'get'
    })
    stats.value = res.data
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 获取车辆列表
const fetchVehicles = async () => {
  try {
    const res = await getFleetVehicles({ limit: 1000 })
    vehicleList.value = res.data.vehicles || []
  } catch (error) {
    console.error('获取车辆列表失败:', error)
  }
}

// 查询
const handleQuery = () => {
  queryParams.value.page = 1
  fetchDrivers()
}

// 重置
const handleReset = () => {
  queryParams.value = {
    page: 1,
    limit: 20,
    status: '',
    roleStatus: '',
    keyword: ''
  }
  fetchDrivers()
}

// 添加司机
const handleAdd = () => {
  isEdit.value = false
  currentDriverId.value = ''
  driverForm.value = {
    name: '',
    phone: '',
    openid: '',
    age: null,
    vehicleIds: []
  }
  formDialogVisible.value = true
}

// 编辑司机
const handleEdit = (row) => {
  isEdit.value = true
  currentDriverId.value = row._id
  driverForm.value = {
    name: row.name || '',
    phone: row.phone || '',
    openid: row.openid || '',
    age: row.age || null,
    vehicleIds: row.vehicles?.map(v => v._id || v) || []
  }
  formDialogVisible.value = true
}

// 确认保存
const confirmSave = async () => {
  const valid = await driverFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (isEdit.value) {
      await request({
        url: `/fleet/drivers/${currentDriverId.value}`,
        method: 'put',
        data: driverForm.value
      })
      ElMessage.success('更新成功')
    } else {
      await request({
        url: '/fleet/drivers',
        method: 'post',
        data: driverForm.value
      })
      ElMessage.success('添加成功')
    }
    formDialogVisible.value = false
    fetchDrivers()
    fetchStats()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

// 更新状态
const handleUpdateStatus = async (row, status) => {
  const statusText = status === 'normal' ? '正常' : '停用'
  try {
    await ElMessageBox.confirm(`确定要将该司机设为${statusText}吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request({
      url: `/fleet/drivers/${row._id}/status`,
      method: 'put',
      data: { status }
    })
    ElMessage.success('状态更新成功')
    fetchDrivers()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新状态失败:', error)
    }
  }
}

// 删除司机
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该司机吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    await request({
      url: `/fleet/drivers/${row._id}`,
      method: 'delete'
    })
    ElMessage.success('删除成功')
    fetchDrivers()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
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

// 下载模板
const downloadTemplate = async () => {
  downloading.value = true
  try {
    const response = await request({
      url: '/batch/template/drivers',
      method: 'get',
      responseType: 'blob'
    })

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.download = '司机导入模板.xlsx'
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
      url: '/batch/drivers',
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
      fetchDrivers()
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

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'normal': 'success',
    'pending_audit': 'warning',
    'suspended': 'danger'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'normal': '正常',
    'pending_audit': '待审核',
    'suspended': '已停用'
  }
  return textMap[status] || status
}

// 获取激活状态类型
const getActivationStatusType = (status) => {
  const typeMap = {
    'normal': 'success',
    'pending_activation': 'info',
    'suspended': 'danger'
  }
  return typeMap[status] || ''
}

// 获取激活状态文本
const getActivationStatusText = (status) => {
  const textMap = {
    'normal': '正常',
    'pending_activation': '待激活',
    'suspended': '已停用'
  }
  return textMap[status] || status
}

// 获取角色状态类型
const getRoleStatusType = (status) => {
  const typeMap = {
    'normal': 'success',
    'pending_audit': 'warning',
    'suspended': 'danger'
  }
  return typeMap[status] || ''
}

// 获取角色状态文本
const getRoleStatusText = (status) => {
  const textMap = {
    'normal': '正常',
    'pending_audit': '待审核',
    'suspended': '已停用'
  }
  return textMap[status] || status
}

// 批量导出
const handleBatchExport = async () => {
  try {
    // 获取所有司机数据
    const res = await request({
      url: '/fleet/drivers',
      method: 'get',
      params: { limit: 10000, ...queryParams.value }
    })

    const drivers = res.data.drivers || []
    if (drivers.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    // 准备导出数据
    const exportData = drivers.map(driver => ({
      '姓名': driver.name || '',
      '手机号': driver.phone || '',
      '年龄': driver.age || '',
      '关联车辆': (driver.vehicles || []).map(v => v.plateNumber || v).join('、'),
      '激活状态': getActivationStatusText(driver.status),
      '角色状态': getRoleStatusText(driver.role?.status),
      '创建时间': formatDate(driver.createdAt)
    }))

    // 使用简单的CSV导出
    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n')

    // 添加BOM头以支持中文
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `司机列表_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success(`成功导出 ${drivers.length} 条司机数据`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

onMounted(() => {
  fetchDrivers()
  fetchStats()
  fetchVehicles()
})
</script>

<style scoped lang="scss">
.fleet-drivers {
  .stat-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.stat-card-success :deep(.el-statistic__number) {
      color: #67c23a;
    }

    &.stat-card-info :deep(.el-statistic__number) {
      color: #909399;
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
