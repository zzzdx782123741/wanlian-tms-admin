<template>
  <div class="published-store-packages">
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
            @change="handleFilterChange"
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
            @change="handleFilterChange"
          >
            <el-option
              label="实惠"
              value="实惠"
            />
            <el-option
              label="标准"
              value="标准"
            />
            <el-option
              label="优质"
              value="优质"
            />
            <el-option
              label="尊享"
              value="尊享"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <el-alert
        title="这里展示平台运营端已审核通过并已上线的门店套餐。"
        type="success"
        :closable="false"
        style="margin-bottom: 16px"
      />

      <el-table
        v-loading="loading"
        :data="packages"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="name"
          label="套餐名称"
          min-width="180"
        />

        <el-table-column
          label="所属门店"
          min-width="180"
        >
          <template #default="{ row }">
            {{ row.storeId?.name || '-' }}
            <div class="sub-text">
              {{ formatStoreRegion(row) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="车型/档位"
          width="150"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              type="info"
            >
              {{ row.vehicleGroup || '-' }}
            </el-tag>
            <el-tag
              size="small"
              style="margin-left: 4px"
            >
              {{ row.tier || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="套餐价格"
          width="140"
        >
          <template #default="{ row }">
            <span class="price-text">¥{{ formatAmount(row.price) }}</span>
          </template>
        </el-table-column>

        <el-table-column
          label="规范价格区间"
          width="180"
        >
          <template #default="{ row }">
            <div v-if="row.priceRangeRef">
              <span class="range-text">¥{{ formatAmount(row.priceRangeRef.minPrice) }}</span>
              <span> - </span>
              <span class="range-text">¥{{ formatAmount(row.priceRangeRef.maxPrice) }}</span>
            </div>
            <span
              v-else
              class="sub-text"
            >暂无规范</span>
          </template>
        </el-table-column>

        <el-table-column
          label="价格位置"
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
          label="状态"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.enabled ? 'success' : 'info'"
              size="small"
            >
              {{ row.enabled ? '已上线' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="上线时间"
          width="170"
        >
          <template #default="{ row }">
            {{ formatDate(row.auditInfo?.auditedAt || row.updatedAt) }}
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="100"
          fixed="right"
        >
          <template #default="{ row }">
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

    <el-dialog
      v-model="detailVisible"
      title="套餐详情"
      width="720px"
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
            {{ currentPackage.code || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属门店">
            {{ currentPackage.storeId?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="门店地区">
            {{ formatStoreRegion(currentPackage) }}
          </el-descriptions-item>
          <el-descriptions-item label="车型分组">
            {{ currentPackage.vehicleGroup || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="套餐档位">
            {{ currentPackage.tier || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="套餐价格">
            <span class="price-text">¥{{ formatAmount(currentPackage.price) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="原价">
            {{ currentPackage.originalPrice ? `¥${formatAmount(currentPackage.originalPrice)}` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="预计时长">
            {{ currentPackage.estimatedDuration || '-' }} 小时
          </el-descriptions-item>
          <el-descriptions-item label="上线时间">
            {{ formatDate(currentPackage.auditInfo?.auditedAt || currentPackage.updatedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="审核备注">
            {{ currentPackage.auditInfo?.auditNote || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDate(currentPackage.submittedAt || currentPackage.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px">
          <h4>价格对比</h4>
          <div
            v-if="currentPackage.priceRangeRef"
            class="price-comparison"
          >
            <div class="price-item">
              <span class="label">规范最低价：</span>
              <span class="value low">¥{{ formatAmount(currentPackage.priceRangeRef.minPrice) }}</span>
            </div>
            <div class="price-item">
              <span class="label">规范最高价：</span>
              <span class="value high">¥{{ formatAmount(currentPackage.priceRangeRef.maxPrice) }}</span>
            </div>
            <div class="price-item">
              <span class="label">门店定价：</span>
              <span
                class="value"
                :class="getPriceClass(currentPackage)"
              >
                ¥{{ formatAmount(currentPackage.price) }}
              </span>
            </div>
          </div>
          <div
            v-else
            class="sub-text"
          >
            该区域暂无价格规范。
          </div>
        </div>

        <div style="margin-top: 20px">
          <h4>服务项目</h4>
          <div
            v-if="currentPackage.serviceItems.length > 0"
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
            class="sub-text"
          >
            暂无服务项目
          </div>
        </div>

        <div style="margin-top: 20px">
          <h4>包含商品</h4>
          <div
            v-if="currentPackage.products.length > 0"
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
            class="sub-text"
          >
            暂无商品
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getStorePackages } from '@/api/packageStandard'

const loading = ref(false)
const packages = ref([])
const total = ref(0)
const detailVisible = ref(false)
const currentPackage = ref(null)

const filters = reactive({
  vehicleGroup: '',
  tier: ''
})

const pagination = reactive({
  page: 1,
  limit: 20
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

const getStandardPriceRange = (standard, province, city) => {
  if (!standard?.enabled || !Array.isArray(standard.priceRanges) || standard.priceRanges.length === 0) {
    return null
  }

  const exactMatch = standard.priceRanges.find(item => item?.province === province && item?.city === city)
  if (exactMatch) return exactMatch

  return standard.priceRanges.find(item => item?.province === province && item?.city === '全省') || null
}

const getPriceLevel = (price, priceRange) => {
  if (!priceRange || typeof price !== 'number') return 'unknown'
  if (price < priceRange.minPrice) return 'low'
  if (price > priceRange.maxPrice) return 'high'

  const range = priceRange.maxPrice - priceRange.minPrice
  if (range <= 0) return 'medium'

  const position = (price - priceRange.minPrice) / range
  if (position < 0.33) return 'low'
  if (position >= 0.67) return 'high'
  return 'medium'
}

const normalizePackage = (pkg = {}) => {
  const priceRange = getStandardPriceRange(pkg.standardId, pkg.storeProvince, pkg.storeCity)

  return {
    ...pkg,
    priceRangeRef: priceRange
      ? {
          minPrice: priceRange.minPrice,
          maxPrice: priceRange.maxPrice
        }
      : null,
    priceLevel: getPriceLevel(pkg.price, priceRange),
    serviceItems: Array.isArray(pkg.serviceItems) ? pkg.serviceItems : [],
    products: Array.isArray(pkg.products) ? pkg.products : []
  }
}

const getPackagePayload = (response) => {
  const payload = response?.data || {}
  return payload.data && Array.isArray(payload.data.packages)
    ? payload.data
    : payload
}

const fetchPackages = async () => {
  loading.value = true
  try {
    const response = await getStorePackages({
      page: pagination.page,
      limit: pagination.limit,
      auditStatus: 'approved',
      ...filters
    })

    const payload = getPackagePayload(response)
    packages.value = (payload.packages || []).map(normalizePackage)
    total.value = Number(payload.total || 0)
  } catch (error) {
    console.error('获取已上线套餐列表失败:', error)
    ElMessage.error('获取已上线套餐列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.page = 1
  fetchPackages()
}

const handleViewDetail = (pkg) => {
  currentPackage.value = normalizePackage(pkg)
  detailVisible.value = true
}

const getPriceLevelTagType = (level) => PRICE_LEVEL_TAG_TYPES[level] || 'info'

const getPriceLevelText = (level) => PRICE_LEVEL_LABELS[level] || PRICE_LEVEL_LABELS.unknown

const getPriceClass = (pkg) => {
  if (!pkg.priceRangeRef) return ''
  const { minPrice, maxPrice } = pkg.priceRangeRef
  if (pkg.price < minPrice) return 'low'
  if (pkg.price > maxPrice) return 'high'
  return 'medium'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const formatStoreRegion = (pkg = {}) => {
  const values = [pkg.storeProvince, pkg.storeCity].filter(Boolean)
  return values.length > 0 ? values.join(' ') : '-'
}

const formatAmount = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

onMounted(() => {
  fetchPackages()
})
</script>

<style scoped>
.published-store-packages {
  padding: 20px;
}

.sub-text {
  color: #909399;
  font-size: 12px;
}

.price-text {
  color: #f56c6c;
  font-weight: bold;
}

.range-text {
  color: #67c23a;
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

.price-item .value.medium {
  color: #e6a23c;
}

.service-items,
.products {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-item,
.product-item {
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

.service-item .description,
.product-item .unit {
  color: #909399;
  font-size: 14px;
}

.product-item .name {
  flex: 1;
}

.product-item .quantity {
  color: #409eff;
  margin-right: 8px;
}
</style>
