<template>
  <div class="store-technicians">
    <div class="page-header">
      <h2>门店技师</h2>
      <div class="header-actions">
        <el-button
          type="success"
          @click="handleBatchImport"
        >
          <el-icon><Upload /></el-icon>
          批量添加
        </el-button>
        <el-button
          type="primary"
          @click="handleAdd"
        >
          <el-icon><Plus /></el-icon>
          添加技师
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row
      :gutter="20"
      class="stats-row"
    >
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="技师总数"
            :value="stats.total"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="正常"
            :value="stats.normal"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="待审核"
            :value="stats.pending"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-danger">
          <el-statistic
            title="已停用"
            :value="stats.suspended"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 技师列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="technicians"
        stripe
      >
        <el-table-column
          prop="name"
          label="姓名"
          width="120"
        />
        <el-table-column
          prop="phone"
          label="手机号"
          width="140"
        />
        <el-table-column
          label="权限配置"
          min-width="250"
        >
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
        <el-table-column
          label="激活状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="getActivationStatusType(row)">
              {{ getActivationStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.role?.status)">
              {{ getStatusText(row.role?.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="创建时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="240"
          fixed="right"
        >
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
              <el-button
                type="primary"
                size="small"
                link
              >
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleUpdateStatus(row, 'normal')">
                    <el-tag
                      size="small"
                      type="success"
                      style="margin-right: 8px"
                    >
                      正常
                    </el-tag>
                    设为正常
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleUpdateStatus(row, 'suspended')">
                    <el-tag
                      size="small"
                      type="danger"
                      style="margin-right: 8px"
                    >
                      停用
                    </el-tag>
                    设为停用
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    @click="handleDelete(row)"
                  >
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
        class="pagination"
        @size-change="loadTechnicians"
        @current-change="loadTechnicians"
      />
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑技师' : '添加技师'"
      width="600px"
    >
      <el-alert
        v-if="!isEdit"
        title="添加说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <div style="font-size: 13px; line-height: 1.6">
            <p style="margin: 0 0 8px 0">
              1. 填写技师基本信息（姓名、手机号）
            </p>
            <p style="margin: 0 0 8px 0">
              2. 技师首次登录小程序时，使用手机号验证码自动激活
            </p>
            <p style="margin: 0 0 8px 0">
              3. 激活后技师即可正常使用小程序功能
            </p>
            <p style="margin: 0; color: #67c23a">
              ✅ 无需技师提前登录，可直接添加
            </p>
          </div>
        </template>
      </el-alert>

      <el-form
        ref="technicianFormRef"
        :model="technicianForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item
          label="姓名"
          prop="name"
        >
          <el-input
            v-model="technicianForm.name"
            placeholder="请输入技师姓名"
          />
        </el-form-item>
        <el-form-item
          label="手机号"
          prop="phone"
        >
          <el-input
            v-model="technicianForm.phone"
            placeholder="请输入手机号"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item
          label="员工编号"
          prop="employeeId"
        >
          <el-input
            v-model="technicianForm.employeeId"
            placeholder="选填，用于内部管理"
          />
        </el-form-item>
        <el-form-item
          label="技能等级"
          prop="level"
        >
          <el-select
            v-model="technicianForm.level"
            placeholder="请选择技能等级"
            style="width: 100%"
          >
            <el-option
              label="初级"
              value="初级"
            />
            <el-option
              label="中级"
              value="中级"
            />
            <el-option
              label="高级"
              value="高级"
            />
            <el-option
              label="专家"
              value="专家"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          label="权限配置"
          prop="permissions"
        >
          <el-checkbox-group v-model="technicianForm.permissions">
            <el-checkbox label="receive_order">
              接收订单
            </el-checkbox>
            <el-checkbox label="diagnosis">
              填写诊断
            </el-checkbox>
            <el-checkbox label="quote">
              添加报价
            </el-checkbox>
            <el-checkbox label="repair">
              进行维修
            </el-checkbox>
            <el-checkbox label="complete">
              提交完工
            </el-checkbox>
            <el-checkbox label="manage_products">
              管理商品
            </el-checkbox>
          </el-checkbox-group>
          <div class="permission-hint">
            <el-icon><InfoFilled /></el-icon>
            技师只能执行已配置权限的操作
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="confirmSave"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量导入技师"
      width="700px"
    >
      <div class="batch-import-content">
        <!-- 未显示结果时显示上传界面 -->
        <div
          v-if="!importResult.message"
          class="upload-section"
        >
          <!-- 顶部操作栏 -->
          <div class="upload-header">
            <el-button
              type="primary"
              link
              :loading="downloading"
              @click="downloadTemplate"
            >
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
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
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
            <el-descriptions
              :column="2"
              border
              size="small"
            >
              <el-descriptions-item
                label="必填字段"
                label-class-name="required-field"
              >
                姓名、手机号
              </el-descriptions-item>
              <el-descriptions-item label="选填字段">
                OpenID（微信）、权限配置（多个用逗号分隔）
              </el-descriptions-item>
              <el-descriptions-item
                label="数据限制"
                :span="2"
              >
                最多导入 1000 条数据
              </el-descriptions-item>
              <el-descriptions-item
                label="权限选项"
                :span="2"
              >
                receive_order、diagnosis、quote、repair、complete、manage_products
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 底部按钮 -->
          <div class="upload-footer">
            <el-button @click="batchDialogVisible = false">
              取消
            </el-button>
            <el-button
              type="primary"
              :loading="importing"
              :disabled="!uploadFile"
              @click="startImport"
            >
              <el-icon><Upload /></el-icon>
              开始导入
            </el-button>
          </div>
        </div>

        <!-- 导入结果 -->
        <div
          v-else
          class="result-section"
        >
          <el-result
            :icon="importResult.successCount > 0 ? 'success' : 'error'"
            :title="importResult.message"
          >
            <template #sub-title>
              <div class="result-stats">
                <p>总计: {{ importResult.total }} 条</p>
                <p style="color: #67c23a">
                  成功: {{ importResult.successCount }} 条
                </p>
                <p style="color: #f56c6c">
                  失败: {{ importResult.failedCount }} 条
                </p>
              </div>
            </template>
            <template #extra>
              <div
                v-if="importResult.errors && importResult.errors.length > 0"
                class="error-list"
              >
                <el-divider content-position="left">
                  错误详情
                </el-divider>
                <el-scrollbar height="200px">
                  <div
                    v-for="(error, index) in importResult.errors.slice(0, 50)"
                    :key="index"
                    class="error-item"
                  >
                    {{ formatImportError(error) }}
                  </div>
                  <div
                    v-if="importResult.errors.length > 50"
                    class="error-item"
                  >
                    还有 {{ importResult.errors.length - 50 }} 条错误...
                  </div>
                </el-scrollbar>
              </div>
              <div style="margin-top: 20px">
                <el-button @click="batchDialogVisible = false">
                  关闭
                </el-button>
                <el-button
                  v-if="importResult.failedCount > 0"
                  type="primary"
                  @click="resetImport"
                >
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
import { Plus, ArrowDown, Delete, InfoFilled, Download, UploadFilled, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { batchImportTechnicians } from '@/api/batch'
import dayjs from 'dayjs'

const loading = ref(false)
const saving = ref(false)
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

const resetImportState = () => ({
  message: '',
  total: 0,
  successCount: 0,
  failedCount: 0,
  errors: []
})

const buildImportMessage = ({ message, total, successCount, failedCount }) => {
  if (message) {
    return message
  }

  return `共 ${total} 条，成功 ${successCount} 条，失败 ${failedCount} 条`
}

const normalizeImportErrors = (errors = []) => {
  if (!Array.isArray(errors)) {
    return []
  }

  return errors.map((item, index) => ({
    id: `${item?.row || '-'}-${index}`,
    row: item?.row || '-',
    field: item?.field || '',
    value: item?.value ?? '',
    identifier: item?.identifier || item?.phone || '',
    identifierLabel: item?.identifierLabel || (item?.phone ? '手机号' : ''),
    error: item?.error || item?.message || '导入失败',
    summary: item?.summary || ''
  }))
}

const formatImportError = (error) => {
  if (!error) {
    return '导入失败'
  }

  if (error.summary) {
    return error.summary
  }

  const segments = [`第 ${error.row} 行`]

  // 用于标识记录的字段（手机号/姓名）
  if (error.identifier && error.identifierLabel) {
    segments.push(`${error.identifierLabel}：${error.identifier}`)
  }

  // 如果错误字段不是标识字段，显示字段名和值
  const isIdentifierField = error.field && (
    error.field === 'phone' && error.identifierLabel === '手机号' ||
    error.field === 'name' && error.identifierLabel === '姓名'
  )

  if (error.field && !isIdentifierField) {
    segments.push(`字段：${error.field}`)
  }

  // 只有在非标识字段且有值时才显示当前值
  if (!isIdentifierField && error.value !== '' && error.value !== undefined && error.value !== null) {
    segments.push(`当前值：${error.value}`)
  }

  return `${segments.join('，')}：${error.error}`
}
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
  employeeId: '',
  level: '初级',
  permissions: ['receive_order', 'diagnosis', 'quote', 'repair', 'complete']
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

// 显示OpenID帮助信息（已废弃，保留用于兼容）
function showOpenidHelpLegacy() {
  ElMessageBox.alert(
    `新版本已支持手机号自动激活！

无需手动获取OpenID，流程如下：
1. 门店添加技师（只需姓名和手机号）
2. 技师首次登录小程序
3. 输入手机号验证码
4. 自动激活并登录`,
    '技师激活说明',
    {
      confirmButtonText: '知道了'
    }
  )
}

// 获取激活状态类型
function getActivationStatusTypeLegacy(row) {
  if (row.activationStatus === 'activated' || row.userId) {
    return 'success'
  }
  return 'warning'
}

// 获取激活状态文本
function getActivationStatusTextLegacy(row) {
  if (row.activationStatus === 'activated' || row.userId) {
    return '已激活'
  }
  return '待激活'
}

function showOpenidHelp() {
  ElMessageBox.alert(
    `新版本已支持微信手机号自动绑定。

无需手动获取 OpenID，流程如下：
1. 门店添加技师，只需姓名和手机号
2. 技师首次进入小程序，点击微信手机号快捷登录
3. 系统校验微信手机号与后台维护手机号一致
4. 自动绑定微信并完成首次激活登录`,
    '技师绑定说明',
    {
      confirmButtonText: '知道了'
    }
  )
}

function getActivationStatusType(row) {
  if (row.activationStatus === 'activated' || row.userId || row.hasOpenid) {
    return 'success'
  }
  return 'warning'
}

function getActivationStatusText(row) {
  if (row.activationStatus === 'activated' || row.userId || row.hasOpenid) {
    return '已绑定'
  }
  return '未绑定'
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
    Object.assign(stats.value, res.data.stats || {})
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
    employeeId: '',
    level: '初级',
    permissions: ['receive_order', 'diagnosis', 'quote', 'repair', 'complete']
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
    employeeId: row.employeeId || '',
    level: row.level || '初级',
    permissions: row.permissions || ['receive_order', 'diagnosis', 'quote', 'repair', 'complete']
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
      const response = await request({
        url: '/store/technicians',
        method: 'post',
        data: technicianForm
      })

      // 根据返回结果显示不同的提示
      if (response.data?.isNewUser) {
        ElMessage.success('已创建待绑定技师账号，请通知技师使用微信手机号快捷登录完成绑定')
      } else {
        ElMessage.success('添加成功')
      }

      // 如果有警告信息，也显示出来
      if (response.data?.warning) {
        setTimeout(() => {
          ElMessage.warning(response.data.warning)
        }, 1500)
      }
    }
    formDialogVisible.value = false
    loadTechnicians()
  } catch (error) {
    console.error('保存技师失败:', error)

    // 检查是否是openid与司机账号冲突
    if (error.response?.data?.code === 'OPENID_CONFLICT_WITH_DRIVER') {
      saving.value = false
      const conflictUser = error.response.data.conflictUser
      try {
        await ElMessageBox.confirm(
          `该微信已绑定司机账号（${conflictUser.name || conflictUser.phone}）。\n\n是否将司机账号转换为技师？转换后司机身份将被移除。`,
          '账号冲突',
          {
            confirmButtonText: '确认转换',
            cancelButtonText: '取消',
            type: 'warning',
            distinguishCancelAndClose: true
          }
        )

        // 用户确认转换，调用转换API
        saving.value = true
        try {
          await request({
            url: '/store/technicians/convert-driver',
            method: 'post',
            data: {
              userId: conflictUser.id,
              name: technicianForm.name,
              phone: technicianForm.phone,
              permissions: technicianForm.permissions
            }
          })
          ElMessage.success('角色转换成功，该司机已转换为技师')
          formDialogVisible.value = false
          loadTechnicians()
        } catch (convertError) {
          ElMessage.error(convertError.message || '角色转换失败')
        }
      } catch {
        // 用户取消转换
      }
      return
    }

    // 提供更友好的错误提示
    let errorMessage = '保存失败'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
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
  return typeMap[status] || 'info'
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

// ==================== 批量导入相关函数 ====================

// 打开批量导入对话框
function handleBatchImport() {
  uploadFile.value = null
  importResult.value = resetImportState()
  batchDialogVisible.value = true
}

// 重置导入状态
function resetImport() {
  uploadFile.value = null
  importResult.value = resetImportState()
}

// 下载模板
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
    link.download = '技师导入模板.xlsx'
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
function handleFileChange(file) {
  uploadFile.value = file.raw
}

// 文件超出限制
function handleExceed() {
  ElMessage.warning('只能上传一个文件')
}

// 开始导入
async function startImport() {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.value)

    const res = await batchImportTechnicians(formData)
    const errors = normalizeImportErrors(res.data?.errors)
    const total = res.data?.total || 0
    const successCount = res.data?.success || 0
    const failedCount = res.data?.failed || errors.length

    importResult.value = {
      message: buildImportMessage({
        message: res.message || res.data?.message,
        total,
        successCount,
        failedCount
      }),
      total,
      successCount,
      failedCount,
      errors
    }

    if (successCount > 0) {
      loadTechnicians()
    }
  } catch (error) {
    console.error('导入失败:', error)
    const errorMessage = error.response?.data?.message || error.message || '导入失败'
    const backendErrors = normalizeImportErrors(
      error.response?.data?.errors || error.response?.data?.data?.errors || []
    )
    const failedCount = error.response?.data?.failed || error.response?.data?.data?.failed || backendErrors.length
    const total = error.response?.data?.total || error.response?.data?.data?.total || failedCount
    importResult.value = {
      message: buildImportMessage({
        message: errorMessage,
        total,
        successCount: 0,
        failedCount
      }),
      total,
      successCount: 0,
      failedCount,
      errors: backendErrors
    }
  } finally {
    importing.value = false
  }
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
