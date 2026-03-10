<template>
  <div class="products-page">
    <div class="page-header">
      <h2>商品管理</h2>
      <div class="header-actions">
        <el-button
          v-if="['PLATFORM_OPERATOR', 'STORE_MANAGER', 'STORE_TECHNICIAN'].includes(userRole)"
          type="success"
          @click="handleBatchImport"
        >
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button
          type="primary"
          @click="showCreateDialog"
        >
          <el-icon><Plus /></el-icon>
          新增商品
        </el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <el-form
        :inline="true"
        :model="filters"
      >
        <el-form-item label="商品分类">
          <el-select
            v-model="filters.category"
            placeholder="全部分类"
            clearable
            style="width: 140px"
            @change="loadProducts"
          >
            <el-option
              label="全部"
              value=""
            />
            <el-option
              label="配件类"
              value="parts"
            />
            <el-option
              label="工时类"
              value="labor"
            />
            <el-option
              label="服务类"
              value="service"
            />
            <el-option
              label="材料类"
              value="material"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
            @change="loadProducts"
          >
            <el-option
              label="全部"
              value=""
            />
            <el-option
              label="待审核"
              value="pending"
            />
            <el-option
              label="已上架"
              value="approved"
            />
            <el-option
              label="已拒绝"
              value="rejected"
            />
            <el-option
              label="已下架"
              value="offline"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品来源">
          <el-select
            v-model="filters.source"
            placeholder="全部来源"
            clearable
            style="width: 140px"
            @change="handleSourceChange"
          >
            <el-option
              label="全部"
              value=""
            />
            <el-option
              label="平台录入"
              value="platform"
            />
            <el-option
              label="门店录入"
              value="store"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="isPlatformOperator && shouldShowStoreFilter"
          label="所属门店"
        >
          <el-select
            v-model="filters.storeId"
            placeholder="全部门店"
            clearable
            filterable
            style="width: 180px"
            @change="loadProducts"
          >
            <el-option
              label="全部"
              value=""
            />
            <el-option
              v-for="store in stores"
              :key="store._id"
              :label="store.name"
              :value="store._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="商品名称/编码/品牌"
            clearable
            @keyup.enter="loadProducts"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button
              type="primary"
              @click="loadProducts"
            >
              搜索
            </el-button>
            <el-button @click="resetFilters">
              重置
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="products"
        stripe
      >
        <el-table-column
          prop="name"
          label="商品名称"
          min-width="180"
        />
        <el-table-column
          label="内部SKU"
          width="140"
        >
          <template #default="{ row }">
            <span class="sku-code">{{ row.sku || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="外部编码"
          width="140"
        >
          <template #default="{ row }">
            <span class="external-code">{{ row.externalCode || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="分类"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getCategoryType(row.category)"
              size="small"
            >
              {{ row.categoryText || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="价格"
          width="110"
        >
          <template #default="{ row }">
            <span class="price">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="unit"
          label="单位"
          width="80"
        />
        <el-table-column
          prop="brand"
          label="品牌"
          width="120"
        />
        <el-table-column
          prop="stock"
          label="库存"
          width="90"
        />
        <el-table-column
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ row.statusText || row.status || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="来源"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.source === 'platform' ? 'success' : 'info'"
              size="small"
            >
              {{ row.source === 'platform' ? '平台' : '门店' }}
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
          width="320"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="canEdit(row)"
              link
              type="primary"
              size="small"
              @click="editProduct(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canAudit(row)"
              link
              type="warning"
              size="small"
              @click="auditProduct(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="canPublish(row)"
              link
              type="success"
              size="small"
              @click="toggleStatus(row)"
            >
              上架
            </el-button>
            <el-button
              v-if="canTakeOffline(row)"
              link
              type="warning"
              size="small"
              @click="toggleStatus(row)"
            >
              下架
            </el-button>
            <el-button
              v-if="canDelete(row)"
              link
              type="danger"
              size="small"
              @click="deleteProduct(row)"
            >
              删除
            </el-button>
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
        @size-change="loadProducts"
        @current-change="loadProducts"
      />
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="商品详情"
      width="840px"
    >
      <el-descriptions
        v-if="currentProduct"
        :column="2"
        border
      >
        <el-descriptions-item label="商品名称">
          {{ currentProduct.name }}
        </el-descriptions-item>
        <el-descriptions-item label="内部SKU">
          <span class="sku-code">{{ currentProduct.sku || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="外部编码">
          {{ currentProduct.externalCode || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="分类">
          {{ currentProduct.categoryText || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="价格">
          ¥{{ currentProduct.price }}
        </el-descriptions-item>
        <el-descriptions-item label="成本价">
          ¥{{ currentProduct.costPrice || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="单位">
          {{ currentProduct.unit || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="品牌">
          {{ currentProduct.brand || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="厂家">
          {{ currentProduct.manufacturer || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="规格">
          {{ currentProduct.spec || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="库存">
          {{ currentProduct.stock ?? 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ currentProduct.statusText || currentProduct.status || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="来源">
          {{ currentProduct.source === 'platform' ? '平台录入' : '门店录入' }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentProduct.auditInfo?.auditReason"
          label="驳回原因"
          :span="2"
        >
          {{ currentProduct.auditInfo.auditReason }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentProduct.auditInfo?.remark"
          label="审核备注"
          :span="2"
        >
          {{ currentProduct.auditInfo.remark }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentProduct.auditInfo?.auditedAt"
          label="审核时间"
        >
          {{ formatDate(currentProduct.auditInfo.auditedAt) }}
        </el-descriptions-item>
        <el-descriptions-item
          label="适配车型"
          :span="2"
        >
          {{ currentProduct.isUniversal ? '通用' : (currentProduct.compatibleModels || []).join('、') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="商品描述"
          :span="2"
        >
          {{ currentProduct.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(currentProduct.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDate(currentProduct.updatedAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑商品' : '新增商品'"
      width="720px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
      >
        <el-form-item
          label="商品名称"
          prop="name"
        >
          <el-input
            v-model="form.name"
            placeholder="请输入商品名称"
          />
        </el-form-item>
        <el-form-item label="内部SKU">
          <el-input
            :value="isEdit ? currentProduct?.sku : '系统自动生成'"
            disabled
            placeholder="系统自动生成"
          />
          <div class="form-tip">
            内部SKU由系统自动生成，无需手动填写
          </div>
        </el-form-item>
        <el-form-item label="外部编码">
          <el-input
            v-model="form.externalCode"
            placeholder="请输入供应商OE码/厂家编码（可选）"
          />
          <div class="form-tip">
            可选填写，用于与供应商对接
          </div>
        </el-form-item>
        <el-form-item
          label="商品分类"
          prop="category"
        >
          <el-select
            v-model="form.category"
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option
              label="配件类"
              value="parts"
            />
            <el-option
              label="工时类"
              value="labor"
            />
            <el-option
              label="服务类"
              value="service"
            />
            <el-option
              label="材料类"
              value="material"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="销售价格"
              prop="price"
            >
              <el-input-number
                v-model="form.price"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本价格">
              <el-input-number
                v-model="form.costPrice"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item
          label="单位"
          prop="unit"
        >
          <el-select
            v-model="form.unit"
            placeholder="请选择单位"
            style="width: 100%"
          >
            <el-option
              v-for="unit in units"
              :key="unit"
              :label="unit"
              :value="unit"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-input
                v-model="form.brand"
                placeholder="请输入品牌"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="厂家">
              <el-input
                v-model="form.manufacturer"
                placeholder="请输入厂家"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格型号">
          <el-input
            v-model="form.spec"
            placeholder="请输入规格型号"
          />
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input-number
            v-model="form.stock"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item
          label="适配车型"
          prop="compatibleModels"
        >
          <el-checkbox
            v-model="form.isUniversal"
            @change="handleUniversalChange"
          >
            通用（适用于所有车型）
          </el-checkbox>
          <el-input
            v-if="!form.isUniversal"
            v-model="modelsText"
            type="textarea"
            :rows="3"
            placeholder="多个车型请用顿号（、）分隔"
          />
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submitForm"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="auditVisible"
      title="商品审核"
      width="600px"
    >
      <el-form
        :model="auditForm"
        label-width="100px"
      >
        <el-form-item label="商品名称">
          <span>{{ auditForm.productName }}</span>
        </el-form-item>
        <el-form-item label="提交门店">
          <span>{{ auditForm.storeName }}</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.approved">
            <el-radio :label="true">
              通过
            </el-radio>
            <el-radio :label="false">
              拒绝
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核原因">
          <el-input
            v-model="auditForm.reason"
            type="textarea"
            :rows="3"
            placeholder="拒绝时必填，建议说明原因"
          />
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="2"
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="auditing"
          @click="submitAudit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchVisible"
      title="批量导入商品"
      width="720px"
    >
      <div class="batch-import-content">
        <div
          v-if="!importResult.message"
          class="upload-section"
        >
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
              拖拽 Excel 文件到此处，或点击上传
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .xlsx / .xls，文件大小不超过 5MB
              </div>
            </template>
          </el-upload>

          <el-alert
            type="info"
            :closable="false"
            show-icon
            style="margin-top: 20px"
          >
            门店导入商品后将进入平台审核；平台录入商品可直接上架。
          </el-alert>

          <div class="upload-footer">
            <el-button @click="batchVisible = false">
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
                <p>总计：{{ importResult.total }} 条</p>
                <p style="color: #67c23a">
                  成功：{{ importResult.successCount }} 条
                </p>
                <p style="color: #f56c6c">
                  失败：{{ importResult.failedCount }} 条
                </p>
              </div>
            </template>
            <template #extra>
              <div
                v-if="importResult.errors?.length"
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
                </el-scrollbar>
              </div>
              <div class="result-actions">
                <el-button @click="batchVisible = false">
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, UploadFilled, InfoFilled, Refresh } from '@element-plus/icons-vue'
import * as productApi from '@/api/product'
import { getStores } from '@/api/store'
import request from '@/utils/request'
import { batchImportProducts } from '@/api/batch'

const userRole = localStorage.getItem('role') || ''
const isPlatformOperator = userRole === 'PLATFORM_OPERATOR'
const isStoreProductRole = ['STORE_MANAGER', 'STORE_TECHNICIAN'].includes(userRole)
const userStoreId = localStorage.getItem('storeId') || ''

// 计算属性：是否显示所属门店筛选
// 当选择"门店录入"或"全部来源"时显示，选择"平台录入"时隐藏
const shouldShowStoreFilter = computed(() => {
  // 平台运营且来源为"门店录入"或"全部来源"时显示
  if (!isPlatformOperator) return false
  return filters.source === '' || filters.source === 'store'
})

const units = ['个', '套', '件', '台', '升', '公斤', '米', '工时', '次', '车', '其他']

const loading = ref(false)
const products = ref([])
const stores = ref([])
const filters = reactive({
  category: '',
  status: '',
  source: '',
  storeId: '',
  keyword: ''
})
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const detailVisible = ref(false)
const formVisible = ref(false)
const auditVisible = ref(false)
const currentProduct = ref(null)
const isEdit = ref(false)
const submitting = ref(false)
const auditing = ref(false)

const form = reactive({
  name: '',
  externalCode: '',
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

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入销售价格', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
  compatibleModels: [
    {
      validator: (rule, value, callback) => {
        // 如果是通用型，则不需要验证适配车型
        if (form.isUniversal) {
          callback()
          return
        }
        // 非通用型时，必须输入适配车型
        if (!modelsText.value || modelsText.value.trim() === '') {
          callback(new Error('请输入适配车型或选择通用'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

const formRef = ref(null)

const batchVisible = ref(false)
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
    identifier: item?.identifier || item?.code || item?.name || '',
    identifierLabel: item?.identifierLabel || (item?.code ? '商品编码' : item?.name ? '商品名称' : ''),
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

  // 用于标识记录的字段（商品名称/SKU/外部编码）
  if (error.identifier && error.identifierLabel) {
    segments.push(`${error.identifierLabel}：${error.identifier}`)
  }

  // 如果错误字段不是标识字段，显示字段名和值
  const isIdentifierField = error.field && (
    (error.identifierLabel === '商品名称' && error.field === 'name') ||
    (error.identifierLabel === 'SKU' && error.field === 'sku') ||
    (error.identifierLabel === '外部编码' && error.field === 'externalCode')
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

onMounted(() => {
  if (isStoreProductRole) {
    filters.storeId = userStoreId
  }

  loadProducts()

  if (isPlatformOperator) {
    loadStores()
  }
})

async function loadProducts() {
  try {
    loading.value = true
    const res = await productApi.getProducts({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    })
    products.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载商品列表失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.category = ''
  filters.status = ''
  filters.source = ''
  filters.storeId = isPlatformOperator ? '' : userStoreId
  filters.keyword = ''
  pagination.page = 1
  loadProducts()
}

// 商品来源变化时的联动处理
function handleSourceChange(value) {
  // 当选择"平台录入"时，清空所属门店筛选
  if (value === 'platform') {
    filters.storeId = ''
  }
  // 当选择"全部来源"或"门店录入"时，不清空storeId，让用户自己选择
  loadProducts()
}

async function loadStores() {
  try {
    const res = await getStores({ page: 1, limit: 1000 })
    stores.value = res.data.list || []
  } catch (error) {
    console.error('加载门店列表失败:', error)
  }
}

function viewDetail(row) {
  currentProduct.value = row
  detailVisible.value = true
}

function getRowStoreId(row) {
  if (!row?.storeId) return ''
  return typeof row.storeId === 'object' ? (row.storeId._id || row.storeId.id || '') : row.storeId
}

function isOwnStoreProduct(row) {
  return row?.source === 'store' && String(getRowStoreId(row)) === String(userStoreId)
}

function canAudit(row) {
  return isPlatformOperator && row?.source === 'store' && row?.status === 'pending'
}

function canEdit(row) {
  if (isPlatformOperator) {
    return row?.source === 'platform' && row?.status !== 'approved'
  }
  return isOwnStoreProduct(row) && ['pending', 'rejected', 'offline'].includes(row?.status)
}

function canDelete(row) {
  if (isPlatformOperator) {
    return row?.source === 'platform' && row?.status !== 'approved'
  }
  return isOwnStoreProduct(row) && row?.status !== 'approved'
}

function canPublish(row) {
  if (row?.status !== 'offline') return false
  if (row?.source === 'platform') return isPlatformOperator
  return isPlatformOperator || isOwnStoreProduct(row)
}

function canTakeOffline(row) {
  if (row?.status !== 'approved') return false
  if (row?.source === 'platform') return isPlatformOperator
  return isPlatformOperator || isOwnStoreProduct(row)
}

function showCreateDialog() {
  isEdit.value = false
  resetForm()
  formVisible.value = true
}

function editProduct(row) {
  isEdit.value = true
  Object.assign(form, {
    name: row.name,
    externalCode: row.externalCode || '',
    category: row.category,
    price: row.price,
    costPrice: row.costPrice || 0,
    unit: row.unit || '个',
    brand: row.brand || '',
    manufacturer: row.manufacturer || '',
    spec: row.spec || '',
    stock: row.stock || 0,
    isUniversal: row.isUniversal || false,
    compatibleModels: row.compatibleModels || [],
    description: row.description || ''
  })
  modelsText.value = row.isUniversal ? '' : (row.compatibleModels || []).join('、')
  currentProduct.value = row
  formVisible.value = true
}

function resetForm() {
  Object.assign(form, {
    name: '',
    externalCode: '',
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

function handleUniversalChange(val) {
  if (val) {
    form.compatibleModels = ['通用']
    modelsText.value = ''
  } else {
    // 取消通用型时，清空适配车型
    form.compatibleModels = []
  }
}

async function submitForm() {
  try {
    await formRef.value.validate()
    submitting.value = true

    const data = { ...form }
    if (!data.isUniversal) {
      data.compatibleModels = modelsText.value.split('、').map(m => m.trim()).filter(Boolean)
    }

    if (isEdit.value) {
      const shouldResubmit = isStoreProductRole && ['rejected', 'offline'].includes(currentProduct.value?.status)
      await productApi.updateProduct(currentProduct.value._id, data)
      ElMessage.success(shouldResubmit ? '修改成功，已重新提交平台审核' : '更新成功')
    } else {
      await productApi.createProduct(data)
      ElMessage.success(isStoreProductRole ? '商品已提交平台审核' : '创建成功')
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

async function submitAudit() {
  if (!auditForm.approved && !auditForm.reason.trim()) {
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

async function toggleStatus(row) {
  const action = row.status === 'offline' ? '上架' : '下架'
  const status = row.status === 'offline' ? 'approved' : 'offline'

  try {
    await ElMessageBox.confirm(`确认${action}该商品吗？`, '提示', { type: 'warning' })
    await productApi.toggleProductStatus(row._id, { status })
    ElMessage.success(`${action}成功`)
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `${action}失败`)
    }
  }
}

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

function handleBatchImport() {
  uploadFile.value = null
  importResult.value = resetImportState()
  batchVisible.value = true
}

function resetImport() {
  uploadFile.value = null
  importResult.value = resetImportState()
}

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
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败')
  } finally {
    downloading.value = false
  }
}

function handleFileChange(file) {
  uploadFile.value = file.raw
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件')
}

async function startImport() {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.value)

    const res = await batchImportProducts(formData)
    const errors = normalizeImportErrors(res.data?.errors)
    const total = res.data?.total || 0
    const successCount = res.data?.success || 0
    const failedCount = res.data?.failed || errors.length

    importResult.value = {
      message: buildImportMessage({
        message: res.message,
        total,
        successCount,
        failedCount
      }),
      total,
      successCount,
      failedCount,
      errors
    }

    if (importResult.value.successCount > 0) {
      loadProducts()
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
.products-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions,
.form-actions,
.upload-header,
.upload-footer,
.result-actions {
  display: flex;
  gap: 12px;
}

.price {
  color: #e85d5d;
  font-weight: 600;
}

.sku-code {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #409eff;
  font-weight: 500;
}

.external-code {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #606266;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.batch-import-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-section,
.result-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-footer,
.result-actions {
  justify-content: flex-end;
}

.result-stats {
  line-height: 1.8;
}

.error-list {
  text-align: left;
}

.error-item {
  padding: 4px 0;
  color: #f56c6c;
}
</style>
