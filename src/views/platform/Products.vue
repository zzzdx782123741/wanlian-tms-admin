<template>
  <div class="products-page">
    <div class="page-header">
      <h2>商品管理</h2>
      <div>
        <el-button type="success" @click="handleBatchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增商品
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="商品分类">
          <el-select v-model="filters.category" placeholder="全部分类" clearable @change="loadProducts">
            <el-option label="全部" value=""></el-option>
            <el-option label="配件类" value="parts"></el-option>
            <el-option label="工时类" value="labor"></el-option>
            <el-option label="服务类" value="service"></el-option>
            <el-option label="材料类" value="material"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="loadProducts">
            <el-option label="全部" value=""></el-option>
            <el-option label="待审核" value="pending"></el-option>
            <el-option label="已上架" value="approved"></el-option>
            <el-option label="已拒绝" value="rejected"></el-option>
            <el-option label="已下架" value="offline"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="商品来源">
          <el-select v-model="filters.source" placeholder="全部来源" clearable @change="loadProducts">
            <el-option label="全部" value=""></el-option>
            <el-option label="平台录入" value="platform"></el-option>
            <el-option label="门店录入" value="store"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="商品名称/编码/品牌" clearable @keyup.enter="loadProducts"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadProducts">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商品列表 -->
    <el-card class="table-card">
      <el-table :data="products" v-loading="loading" stripe>
        <el-table-column prop="name" label="商品名称" min-width="150"></el-table-column>
        <el-table-column prop="code" label="商品编码" width="140"></el-table-column>
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)" size="small">
              {{ row.categoryText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            <span class="price">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column prop="brand" label="品牌" width="120"></el-table-column>
        <el-table-column prop="stock" label="库存" width="80"></el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-tag :type="row.source === 'platform' ? 'success' : 'info'" size="small">
              {{ row.source === 'platform' ? '平台' : '门店' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="editProduct(row)" v-if="canEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="auditProduct(row)" v-if="row.status === 'pending'">审核</el-button>
            <el-button link type="success" size="small" @click="toggleStatus(row)" v-if="row.status === 'offline'">上架</el-button>
            <el-button link type="warning" size="small" @click="toggleStatus(row)" v-if="row.status === 'approved'">下架</el-button>
            <el-button link type="danger" size="small" @click="deleteProduct(row)" v-if="canDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadProducts"
        @current-change="loadProducts"
        class="pagination"
      />
    </el-card>

    <!-- 商品详情对话框 -->
    <el-dialog v-model="detailVisible" title="商品详情" width="800px">
      <el-descriptions :column="2" border v-if="currentProduct">
        <el-descriptions-item label="商品名称">{{ currentProduct.name }}</el-descriptions-item>
        <el-descriptions-item label="商品编码">{{ currentProduct.code }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ currentProduct.categoryText }}</el-descriptions-item>
        <el-descriptions-item label="价格">¥{{ currentProduct.price }}</el-descriptions-item>
        <el-descriptions-item label="成本价">¥{{ currentProduct.costPrice }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ currentProduct.unit }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ currentProduct.brand || '-' }}</el-descriptions-item>
        <el-descriptions-item label="厂家">{{ currentProduct.manufacturer || '-' }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ currentProduct.spec || '-' }}</el-descriptions-item>
        <el-descriptions-item label="库存">{{ currentProduct.stock }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentProduct.statusText }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ currentProduct.source === 'platform' ? '平台录入' : '门店录入' }}</el-descriptions-item>
        <el-descriptions-item label="适配车型" :span="2">
          {{ currentProduct.isUniversal ? '通用' : currentProduct.compatibleModels.join('、') }}
        </el-descriptions-item>
        <el-descriptions-item label="商品描述" :span="2">{{ currentProduct.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentProduct.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(currentProduct.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 编辑/创建对话框 -->
    <el-dialog v-model="formVisible" :title="isEdit ? '编辑商品' : '新增商品'" width="700px" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称"></el-input>
        </el-form-item>
        <el-form-item label="商品编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入商品编码（可选）"></el-input>
        </el-form-item>
        <el-form-item label="商品分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="配件类" value="parts"></el-option>
            <el-option label="工时类" value="labor"></el-option>
            <el-option label="服务类" value="service"></el-option>
            <el-option label="材料类" value="material"></el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本价格">
              <el-input-number v-model="form.costPrice" :min="0" :precision="2" style="width: 100%"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="单位" prop="unit">
          <el-select v-model="form.unit" placeholder="请选择单位" style="width: 100%">
            <el-option label="个" value="个"></el-option>
            <el-option label="套" value="套"></el-option>
            <el-option label="件" value="件"></el-option>
            <el-option label="台" value="台"></el-option>
            <el-option label="升" value="升"></el-option>
            <el-option label="公斤" value="公斤"></el-option>
            <el-option label="米" value="米"></el-option>
            <el-option label="工时" value="工时"></el-option>
            <el-option label="次" value="次"></el-option>
            <el-option label="车" value="车"></el-option>
            <el-option label="其他" value="其他"></el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-input v-model="form.brand" placeholder="请输入品牌"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="厂家">
              <el-input v-model="form.manufacturer" placeholder="请输入厂家"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格型号">
          <el-input v-model="form.spec" placeholder="请输入规格型号"></el-input>
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input-number v-model="form.stock" :min="0" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="适配车型" prop="compatibleModels">
          <el-checkbox v-model="form.isUniversal" @change="handleUniversalChange">通用（适用所有车型）</el-checkbox>
          <el-input
            v-if="!form.isUniversal"
            v-model="modelsText"
            type="textarea"
            :rows="3"
            placeholder="请输入适配车型，多个车型用顿号（、）分隔，例如：东风天锦、解放J6、陕汽X3000"
          ></el-input>
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入商品描述（最多500字）"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditVisible" title="商品审核" width="600px">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="商品名称">
          <span>{{ auditForm.productName }}</span>
        </el-form-item>
        <el-form-item label="提交门店">
          <span>{{ auditForm.storeName }}</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.approved">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核原因">
          <el-input v-model="auditForm.reason" type="textarea" :rows="3" placeholder="请输入审核原因（拒绝时必填）"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="auditForm.remark" type="textarea" :rows="2" placeholder="请输入备注信息（可选）"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit" :loading="auditing">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="batchVisible" title="批量导入商品" width="700px">
      <div class="batch-import-content">
        <!-- 步骤说明 -->
        <el-steps :active="batchStep" align-center style="margin-bottom: 30px">
          <el-step title="下载模板" />
          <el-step title="上传文件" />
          <el-step title="导入完成" />
        </el-steps>

        <!-- 步骤1: 下载模板 -->
        <div v-if="batchStep === 0" class="step-content">
          <el-alert title="导入说明" type="info" :closable="false" style="margin-bottom: 20px">
            <ul>
              <li>请先下载 Excel 模板，按照模板格式填写商品信息</li>
              <li>商品名称为必填项，其他字段选填</li>
              <li>支持导入最多 1000 条数据</li>
              <li>门店技师导入的商品需要平台审核</li>
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
                <el-button @click="batchVisible = false">关闭</el-button>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import * as productApi from '@/api/product'
import request from '@/utils/request'

// 响应式数据
const loading = ref(false)
const products = ref([])
const filters = reactive({
  category: '',
  status: '',
  source: '',
  keyword: ''
})
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 对话框
const detailVisible = ref(false)
const formVisible = ref(false)
const auditVisible = ref(false)
const currentProduct = ref(null)
const isEdit = ref(false)
const submitting = ref(false)
const auditing = ref(false)

// 表单数据
const form = reactive({
  name: '',
  code: '',
  category: '',
  price: 0,
  costPrice: 0,
  unit: '个',
  brand: '',
  manufacturer: '',
  spec: '',
  stock: 0,
  isUniversal: false,
  compatibleModels: [],
  description: ''
})
const modelsText = ref('')

const auditForm = reactive({
  productId: '',
  productName: '',
  storeName: '',
  approved: true,
  reason: '',
  remark: ''
})

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入销售价格', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
  compatibleModels: [{ required: true, message: '请输入适配车型或选择通用', trigger: 'change' }]
}

const formRef = ref(null)

// 批量导入相关
const batchVisible = ref(false)
const batchStep = ref(0)
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

// 生命周期
onMounted(() => {
  loadProducts()
})

// 加载商品列表
async function loadProducts() {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    const res = await productApi.getProducts(params)
    products.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
function resetFilters() {
  filters.category = ''
  filters.status = ''
  filters.source = ''
  filters.keyword = ''
  pagination.page = 1
  loadProducts()
}

// 查看详情
function viewDetail(row) {
  currentProduct.value = row
  detailVisible.value = true
}

// 判断是否可编辑
function canEdit(row) {
  return row.status === 'pending' || row.status === 'offline'
}

// 判断是否可删除
function canDelete(row) {
  return row.status !== 'approved'
}

// 显示创建对话框
function showCreateDialog() {
  isEdit.value = false
  resetForm()
  formVisible.value = true
}

// 编辑商品
function editProduct(row) {
  isEdit.value = true
  Object.assign(form, {
    name: row.name,
    code: row.code || '',
    category: row.category,
    price: row.price,
    costPrice: row.costPrice || 0,
    unit: row.unit,
    brand: row.brand || '',
    manufacturer: row.manufacturer || '',
    spec: row.spec || '',
    stock: row.stock,
    isUniversal: row.isUniversal || false,
    compatibleModels: row.compatibleModels || [],
    description: row.description || ''
  })
  modelsText.value = row.isUniversal ? '' : (row.compatibleModels || []).join('、')
  currentProduct.value = row
  formVisible.value = true
}

// 重置表单
function resetForm() {
  Object.assign(form, {
    name: '',
    code: '',
    category: '',
    price: 0,
    costPrice: 0,
    unit: '个',
    brand: '',
    manufacturer: '',
    spec: '',
    stock: 0,
    isUniversal: false,
    compatibleModels: [],
    description: ''
  })
  modelsText.value = ''
  formRef.value?.resetFields()
}

// 处理通用复选框变化
function handleUniversalChange(val) {
  if (val) {
    form.compatibleModels = ['通用']
    modelsText.value = ''
  }
}

// 提交表单
async function submitForm() {
  try {
    await formRef.value.validate()
    submitting.value = true

    const data = { ...form }
    if (!data.isUniversal) {
      data.compatibleModels = modelsText.value.split('、').filter(m => m.trim())
    }

    if (isEdit.value) {
      await productApi.updateProduct(currentProduct.value._id, data)
      ElMessage.success('更新成功')
    } else {
      await productApi.createProduct(data)
      ElMessage.success('创建成功')
    }

    formVisible.value = false
    loadProducts()
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitting.value = false
  }
}

// 审核商品
function auditProduct(row) {
  Object.assign(auditForm, {
    productId: row._id,
    productName: row.name,
    storeName: row.storeId?.name || '未知',
    approved: true,
    reason: '',
    remark: ''
  })
  auditVisible.value = true
}

// 提交审核
async function submitAudit() {
  if (!auditForm.approved && !auditForm.reason) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  try {
    auditing.value = true
    await productApi.auditProduct(auditForm.productId, {
      approved: auditForm.approved,
      reason: auditForm.reason,
      remark: auditForm.remark
    })
    ElMessage.success('审核完成')
    auditVisible.value = false
    loadProducts()
  } catch (error) {
    ElMessage.error(error.message || '审核失败')
  } finally {
    auditing.value = false
  }
}

// 切换商品状态
async function toggleStatus(row) {
  const action = row.status === 'offline' ? '上架' : '下架'
  const status = row.status === 'offline' ? 'approved' : 'offline'

  try {
    await ElMessageBox.confirm(`确认${action}该商品吗？`, '提示', {
      type: 'warning'
    })

    await productApi.toggleProductStatus(row._id, { status })
    ElMessage.success(`${action}成功`)
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `${action}失败`)
    }
  }
}

// 删除商品
async function deleteProduct(row) {
  try {
    await ElMessageBox.confirm('确认删除该商品吗？删除后无法恢复！', '警告', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })

    await productApi.deleteProduct(row._id)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 辅助函数
function getCategoryType(category) {
  const map = {
    parts: 'primary',
    labor: 'warning',
    service: 'success',
    material: 'danger'
  }
  return map[category] || ''
}

function getStatusType(status) {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    offline: 'info'
  }
  return map[status] || ''
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 打开批量导入对话框
function handleBatchImport() {
  batchStep.value = 0
  uploadFile.value = null
  importResult.value = {
    message: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: []
  }
  batchVisible.value = true
}

// 下载模板
async function downloadTemplate() {
  downloading.value = true
  try {
    const response = await request({
      url: '/batch/template/products',
      method: 'get',
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.download = '商品导入模板.xlsx'
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

    const res = await request({
      url: '/batch/products',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    importResult.value = {
      message: res.message || '导入完成',
      total: res.data.total,
      successCount: res.data.success,
      failedCount: res.data.failed,
      errors: res.data.errors || []
    }

    batchStep.value = 2

    if (res.data.success > 0) {
      loadProducts()
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
</script>

<style scoped>
.products-page {
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

.page-header > div {
  display: flex;
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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
</style>
