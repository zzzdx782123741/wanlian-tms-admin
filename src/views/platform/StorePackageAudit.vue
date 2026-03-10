<template>
  <div class="store-package-audit">
    <!-- 操作栏 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="18">
          <el-button
            type="primary"
            :loading="loading"
            @click="fetchPackages"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button
            v-if="selectedPackages.length > 0"
            type="success"
            @click="handleBatchApprove"
          >
            批量通过 ({{ selectedPackages.length }})
          </el-button>
          <el-button
            v-if="selectedPackages.length > 0"
            type="danger"
            @click="handleBatchReject"
          >
            批量拒绝
          </el-button>
        </el-col>
        <el-col
          :span="6"
          style="text-align: right"
        >
          <el-select
            v-model="filters.vehicleGroup"
            placeholder="车型分组"
            clearable
            style="width: 140px"
            @change="fetchPackages"
          >
            <el-option
              label="牵引车"
              value="牵引车"
            />
            <el-option
              label="载货车"
              value="载货车"
            />
            <el-option
              label="轻卡"
              value="轻卡"
            />
            <el-option
              label="自卸"
              value="自卸"
            />
          </el-select>
          <el-select
            v-model="filters.tier"
            placeholder="套餐档位"
            clearable
            style="width: 140px"
            @change="fetchPackages"
          >
            <el-option
              label="基础"
              value="基础"
            />
            <el-option
              label="标准"
              value="标准"
            />
            <el-option
              label="高级"
              value="高级"
            />
            <el-option
              label="尊享"
              value="尊享"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- 待审核套餐列表 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="packages"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
        />

        <el-table-column
          prop="name"
          label="套餐名称"
          width="180"
        />

        <el-table-column
          label="所属门店"
          width="180"
        >
          <template #default="{ row }">
            {{ row.storeId?.name || '-' }}
            <div style="font-size: 12px; color: #909399;">
              {{ row.storeProvince }} {{ row.storeCity }}
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="车型/档位"
          width="120"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              type="info"
            >
              {{ row.vehicleGroup }}
            </el-tag>
            <el-tag
              size="small"
              style="margin-left: 4px;"
            >
              {{ row.tier }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="套餐价格"
          width="140"
        >
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ row.price }}</span>
          </template>
        </el-table-column>

        <el-table-column
          label="规范价格区间"
          width="180"
        >
          <template #default="{ row }">
            <div v-if="row.priceRangeRef">
              <span style="color: #67c23a;">¥{{ row.priceRangeRef.minPrice }}</span>
              <span> - </span>
              <span style="color: #67c23a;">¥{{ row.priceRangeRef.maxPrice }}</span>
            </div>
            <span
              v-else
              style="color: #909399;"
            >无规范</span>
          </template>
        </el-table-column>

        <el-table-column
          label="价格状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getPriceLevelTagType(row.priceLevel)"
              size="small"
            >
              {{ getPriceLevelText(row.priceLevel) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="审核通道"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.fastTrack === true"
              type="success"
              size="small"
            >
              ⚡ 快速
            </el-tag>
            <el-tag
              v-else-if="row.fastTrack === false"
              type="warning"
              size="small"
            >
              人工审核
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column
          label="服务项目"
          width="200"
        >
          <template #default="{ row }">
            <div v-if="row.serviceItems && row.serviceItems.length > 0">
              <el-tag
                v-for="(item, index) in row.serviceItems.slice(0, 2)"
                :key="index"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ item.icon }} {{ item.name }}
              </el-tag>
              <span
                v-if="row.serviceItems.length > 2"
                style="font-size: 12px; color: #909399;"
              >
                +{{ row.serviceItems.length - 2 }}
              </span>
            </div>
            <span
              v-else
              style="color: #909399;"
            >无服务项目</span>
          </template>
        </el-table-column>

        <el-table-column
          label="提交时间"
          width="160"
        >
          <template #default="{ row }">
            {{ formatDate(row.submittedAt) }}
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="180"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="success"
              size="small"
              link
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button
              type="primary"
              size="small"
              link
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px"
        @size-change="fetchPackages"
        @current-change="fetchPackages"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="套餐详情"
      width="700px"
    >
      <div
        v-if="currentPackage"
        class="package-detail"
      >
        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="套餐名称">
            {{ currentPackage.name }}
          </el-descriptions-item>
          <el-descriptions-item label="套餐编码">
            {{ currentPackage.code }}
          </el-descriptions-item>
          <el-descriptions-item label="所属门店">
            {{ currentPackage.storeId?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="门店地址">
            {{ currentPackage.storeProvince }} {{ currentPackage.storeCity }}
          </el-descriptions-item>
          <el-descriptions-item label="车型分组">
            {{ currentPackage.vehicleGroup }}
          </el-descriptions-item>
          <el-descriptions-item label="套餐档位">
            {{ currentPackage.tier }}
          </el-descriptions-item>
          <el-descriptions-item label="套餐价格">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ currentPackage.price }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="原价">
            <span
              v-if="currentPackage.originalPrice"
              style="color: #909399;"
            >
              ¥{{ currentPackage.originalPrice.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="预估时长">
            {{ currentPackage.estimatedDuration }} 小时
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDate(currentPackage.submittedAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px;">
          <h4>价格对比</h4>
          <div
            v-if="currentPackage.priceRangeRef"
            class="price-comparison"
          >
            <div class="price-item">
              <span class="label">规范最低价：</span>
              <span class="value low">¥{{ currentPackage.priceRangeRef.minPrice }}</span>
            </div>
            <div class="price-item">
              <span class="label">规范最高价：</span>
              <span class="value high">¥{{ currentPackage.priceRangeRef.maxPrice }}</span>
            </div>
            <div class="price-item">
              <span class="label">门店定价：</span>
              <span
                class="value"
                :class="getPriceClass(currentPackage)"
              >
                ¥{{ currentPackage.price }}
              </span>
            </div>
          </div>
          <div
            v-else
            style="color: #909399;"
          >
            该区域暂无价格规范
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4>服务项目</h4>
          <div
            v-if="currentPackage.serviceItems && currentPackage.serviceItems.length > 0"
            class="service-items"
          >
            <div
              v-for="(item, index) in currentPackage.serviceItems"
              :key="index"
              class="service-item"
            >
              <span class="icon">{{ item.icon || '🔧' }}</span>
              <span class="name">{{ item.name }}</span>
              <span
                v-if="item.description"
                class="description"
              >{{ item.description }}</span>
            </div>
          </div>
          <div
            v-else
            style="color: #909399;"
          >
            无服务项目
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4>包含商品</h4>
          <div
            v-if="currentPackage.products && currentPackage.products.length > 0"
            class="products"
          >
            <div
              v-for="(product, index) in currentPackage.products"
              :key="index"
              class="product-item"
            >
              <span class="name">{{ product.productId?.name || '-' }}</span>
              <span class="quantity">x {{ product.quantity }}</span>
              <span
                v-if="product.productId?.unit"
                class="unit"
              >{{ product.productId.unit }}</span>
            </div>
          </div>
          <div
            v-else
            style="color: #909399;"
          >
            无商品
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">
          关闭
        </el-button>
        <el-button
          type="success"
          @click="handleApprove(currentPackage)"
        >
          通过
        </el-button>
        <el-button
          type="danger"
          @click="handleReject(currentPackage)"
        >
          拒绝
        </el-button>
      </template>
    </el-dialog>

    <!-- 审核备注对话框 -->
    <el-dialog
      v-model="auditNoteVisible"
      :title="auditType === 'approve' ? '审核通过' : '审核拒绝'"
      width="500px"
    >
      <el-form
        :model="auditForm"
        label-width="80px"
      >
        <el-form-item :label="auditType === 'approve' ? '审核备注' : '拒绝原因'">
          <el-input
            v-model="auditForm.note"
            type="textarea"
            :rows="4"
            :placeholder="auditType === 'approve' ? '选填，审核通过的原因或备注' : '必填，请说明拒绝原因'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditNoteVisible = false">
          取消
        </el-button>
        <el-button
          :type="auditType === 'approve' ? 'success' : 'danger'"
          @click="confirmAudit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  getPendingStorePackages,
  auditStorePackage,
  batchAuditPackages
} from '@/api/packageStandard'

// 数据
const loading = ref(false)
const packages = ref([])
const selectedPackages = ref([])
const total = ref(0)

const filters = reactive({
  vehicleGroup: '',
  tier: ''
})

const pagination = reactive({
  page: 1,
  limit: 20
})

// 对话框
const detailVisible = ref(false)
const auditNoteVisible = ref(false)
const currentPackage = ref(null)
const auditType = ref('approve') // 'approve' or 'reject'
const auditPackageIds = ref([])

const auditForm = reactive({
  note: ''
})

const PRICE_LEVEL_LABELS = {
  low: '偏低',
  medium: '适中',
  high: '偏高',
  unknown: '未知'
}

const PRICE_LEVEL_TAG_TYPES = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  unknown: 'info'
}

const normalizePackage = (pkg = {}) => ({
  ...pkg,
  priceLevel: ['low', 'medium', 'high'].includes(pkg.priceLevel) ? pkg.priceLevel : 'unknown',
  priceRangeRef: pkg.priceRangeRef || null,
  serviceItems: Array.isArray(pkg.serviceItems) ? pkg.serviceItems : [],
  products: Array.isArray(pkg.products) ? pkg.products : []
})

const getPackagePayload = (response) => {
  const payload = response?.data || {}
  return payload.data && Array.isArray(payload.data.packages)
    ? payload.data
    : payload
}

// 方法
const fetchPackages = async () => {
  loading.value = true
  try {
    const response = await getPendingStorePackages({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    })
    const payload = getPackagePayload(response)
    packages.value = (payload.packages || []).map(normalizePackage)
    total.value = Number(payload.total || 0)
  } catch (error) {
    console.error('获取待审核套餐列表失败:', error)
    ElMessage.error('获取待审核套餐列表失败')
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection) => {
  selectedPackages.value = selection
}

const handleApprove = (pkg) => {
  auditType.value = 'approve'
  auditPackageIds.value = [pkg._id]
  auditForm.note = ''
  auditNoteVisible.value = true
}

const handleReject = (pkg) => {
  auditType.value = 'reject'
  auditPackageIds.value = [pkg._id]
  auditForm.note = ''
  auditNoteVisible.value = true
}

const handleBatchApprove = () => {
  if (selectedPackages.value.length === 0) return
  auditType.value = 'approve'
  auditPackageIds.value = selectedPackages.value.map(p => p._id)
  auditForm.note = ''
  auditNoteVisible.value = true
}

const handleBatchReject = () => {
  if (selectedPackages.value.length === 0) return
  auditType.value = 'reject'
  auditPackageIds.value = selectedPackages.value.map(p => p._id)
  auditForm.note = ''
  auditNoteVisible.value = true
}

const confirmAudit = async () => {
  if (auditType.value === 'reject' && !auditForm.note.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }

  try {
    if (auditPackageIds.value.length === 1) {
      await auditStorePackage(auditPackageIds.value[0], {
        approved: auditType.value === 'approve',
        auditNote: auditType.value === 'approve' ? auditForm.note : undefined,
        rejectReason: auditType.value === 'reject' ? auditForm.note : undefined
      })
    } else {
      await batchAuditPackages({
        packageIds: auditPackageIds.value,
        approved: auditType.value === 'approve',
        auditNote: auditType.value === 'approve' ? auditForm.note : undefined,
        rejectReason: auditType.value === 'reject' ? auditForm.note : undefined
      })
    }
    ElMessage.success(auditType.value === 'approve' ? '审核通过' : '已拒绝')
    auditNoteVisible.value = false
    detailVisible.value = false
    fetchPackages()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleViewDetail = (pkg) => {
  currentPackage.value = normalizePackage(pkg)
  detailVisible.value = true
}

const getPriceLevelTagType = (level) => {
  return PRICE_LEVEL_TAG_TYPES[level] || 'info'
}

const getPriceLevelText = (level) => {
  return PRICE_LEVEL_LABELS[level] || PRICE_LEVEL_LABELS.unknown
}

const getPriceClass = (pkg) => {
  if (!pkg.priceRangeRef) return ''
  // 套餐价格和规范价格区间单位都是元，直接比较
  const { minPrice, maxPrice } = pkg.priceRangeRef
  if (pkg.price < minPrice) return 'low'
  if (pkg.price > maxPrice) return 'high'
  return 'medium'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchPackages()
})
</script>

<style scoped>
.store-package-audit {
  padding: 20px;
}

.package-detail h4 {
  margin-bottom: 10px;
  color: #303133;
}

.price-comparison {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-item {
  display: flex;
  align-items: center;
}

.price-item .label {
  width: 100px;
  color: #606266;
}

.price-item .value {
  font-weight: bold;
}

.price-item .value.low {
  color: #67c23a;
}

.price-item .value.high {
  color: #f56c6c;
}

.price-item .value.suggested {
  color: #409eff;
}

.price-item .value.medium {
  color: #e6a23c;
}

.service-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.service-item .icon {
  font-size: 18px;
  margin-right: 8px;
}

.service-item .name {
  font-weight: 500;
  margin-right: 8px;
}

.service-item .description {
  color: #909399;
  font-size: 14px;
}

.products {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.product-item .name {
  flex: 1;
}

.product-item .quantity {
  color: #409eff;
  margin-right: 8px;
}

.product-item .unit {
  color: #909399;
  font-size: 14px;
}
</style>
