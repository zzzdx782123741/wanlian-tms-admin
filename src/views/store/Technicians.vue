<template>
  <div class="store-technicians">
    <div class="page-header">
      <h2>门店技师</h2>
      <div class="header-actions">
        <el-button type="success" @click="handleBatchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加技师
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
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
          <el-statistic title="已停用" :value="stats.suspended" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 技师列表 -->
    <el-card class="table-card">
      <el-table :data="technicians" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="权限配置" min-width="250">
          <template #default="{ row }">
            <el-tag
              v-for="perm in row.permissions"
              :key="perm"
              size="small"
              style="margin-right: 5px; margin-bottom: 5px"
            >
              {{ getPermissionText(perm) }}
            </el-tag>
            <span v-if="!row.permissions || row.permissions.length === 0">未配置</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.role?.status)">
              {{ getStatusText(row.role?.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
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
                    删除技师
                  </el-dropdown-item>
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
        @size-change="loadTechnicians"
        @current-change="loadTechnicians"
        class="pagination"
      />
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑技师' : '添加技师'"
      width="600px"
    >
      <el-form :model="technicianForm" :rules="formRules" ref="technicianFormRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="technicianForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="technicianForm.phone" placeholder="请输入手机号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="OpenID">
          <el-input v-model="technicianForm.openid" placeholder="微信OpenID（可选）" />
        </el-form-item>
        <el-form-item label="权限配置" prop="permissions">
          <el-checkbox-group v-model="technicianForm.permissions">
            <el-checkbox label="receive_order">接收订单</el-checkbox>
            <el-checkbox label="diagnosis">填写诊断</el-checkbox>
            <el-checkbox label="quote">添加报价</el-checkbox>
            <el-checkbox label="repair">进行维修</el-checkbox>
            <el-checkbox label="complete">提交完工</el-checkbox>
            <el-checkbox label="manage_products">管理商品</el-checkbox>
          </el-checkbox-group>
          <div class="permission-hint">
            <el-icon><InfoFilled /></el-icon>
            技师只能执行已配置权限的操作
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSave" :loading="saving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量导入技师" width="700px">
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
                OpenID（微信）、权限配置（多个用逗号分隔）
              </el-descriptions-item>
              <el-descriptions-item label="数据限制" :span="2">
                最多导入 1000 条数据
              </el-descriptions-item>
              <el-descriptions-item label="权限选项" :span="2">
                receive_order、diagnosis、quote、repair、complete、manage_products
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown, Delete, InfoFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const saving = ref(false)
const technicians = ref([])
const total = ref(0)
const stats = ref({
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

const formDialogVisible = ref(false)
const isEdit = ref(false)
const technicianFormRef = ref()
const currentTechnicianId = ref('')

const technicianForm = reactive({
  name: '',
  phone: '',
  openid: '',
  permissions: []
})

const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  permissions: [
    { required: true, message: '请选择权限', trigger: 'change' }
  ]
}

onMounted(() => {
  loadTechnicians()
})

// 获取技师列表
async function loadTechnicians() {
  loading.value = true
  try {
    const res = await request({
      url: '/store/technicians',
      method: 'get',
      params: pagination
    })
    technicians.value = res.data.list || []
    pagination.total = res.data.total || 0
    Object.assign(stats, res.data.stats || {})
  } catch (error) {
    ElMessage.error(error.message || '获取技师列表失败')
  } finally {
    loading.value = false
  }
}

// 添加技师
function handleAdd() {
  isEdit.value = false
  Object.assign(technicianForm, {
    name: '',
    phone: '',
    openid: '',
    permissions: []
  })
  formDialogVisible.value = true
}

// 编辑技师
function handleEdit(row) {
  isEdit.value = true
  currentTechnicianId.value = row._id
  Object.assign(technicianForm, {
    name: row.name || '',
    phone: row.phone || '',
    openid: row.openid || '',
    permissions: row.permissions || []
  })
  formDialogVisible.value = true
}

// 确认保存
async function confirmSave() {
  const valid = await technicianFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (isEdit.value) {
      await request({
        url: `/store/technicians/${currentTechnicianId.value}`,
        method: 'put',
        data: technicianForm
      })
      ElMessage.success('更新成功')
    } else {
      await request({
        url: '/store/technicians',
        method: 'post',
        data: technicianForm
      })
      ElMessage.success('添加成功')
    }
    formDialogVisible.value = false
    loadTechnicians()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 更新状态
async function handleUpdateStatus(row, status) {
  const statusText = status === 'normal' ? '正常' : '停用'
  try {
    await ElMessageBox.confirm(`确定要将该技师设为${statusText}吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request({
      url: `/store/technicians/${row._id}/status`,
      method: 'put',
      data: { status }
    })
    ElMessage.success('状态更新成功')
    loadTechnicians()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '更新状态失败')
    }
  }
}

// 删除技师
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该技师吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    await request({
      url: `/store/technicians/${row._id}`,
      method: 'delete'
    })
    ElMessage.success('删除成功')
    loadTechnicians()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 获取权限文本
function getPermissionText(perm) {
  const map = {
    receive_order: '接收订单',
    diagnosis: '填写诊断',
    quote: '添加报价',
    repair: '进行维修',
    complete: '提交完工',
    manage_products: '管理商品'
  }
  return map[perm] || perm
}

// 获取状态类型
function getStatusType(status) {
  const typeMap = {
    'normal': 'success',
    'pending_audit': 'warning',
    'suspended': 'danger'
  }
  return typeMap[status] || ''
}

// 获取状态文本
function getStatusText(status) {
  const textMap = {
    'normal': '正常',
    'pending_audit': '待审核',
    'suspended': '已停用'
  }
  return textMap[status] || status
}

// 格式化日期
function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
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

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card :deep(.el-statistic__number) {
  color: #409EFF;
}

.stat-card-success :deep(.el-statistic__number) {
  color: #67C23A;
}

.stat-card-warning :deep(.el-statistic__number) {
  color: #E6A23C;
}

.stat-card-danger :deep(.el-statistic__number) {
  color: #F56C6C;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.permission-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
