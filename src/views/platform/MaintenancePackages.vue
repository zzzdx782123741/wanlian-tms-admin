<template>
  <div class="maintenance-packages">
    <!-- 操作栏 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="18">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建套餐
          </el-button>
        </el-col>
        <el-col :span="6" style="text-align: right">
          <el-select v-model="filters.vehicleGroup" placeholder="车型分组" clearable style="width: 150px" @change="fetchPackages">
            <el-option label="牵引车" value="牵引车" />
            <el-option label="载货车" value="载货车" />
            <el-option label="轻卡" value="轻卡" />
            <el-option label="自卸" value="自卸" />
            <el-option label="全部" value="ALL" />
          </el-select>
          <el-select v-model="filters.tier" placeholder="套餐档位" clearable style="width: 120px" @change="fetchPackages">
            <el-option label="基础" value="基础" />
            <el-option label="标准" value="标准" />
            <el-option label="高级" value="高级" />
            <el-option label="尊享" value="尊享" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- 套餐列表 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="packages"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="套餐名称" width="180" />
        <el-table-column prop="code" label="套餐编码" width="140" />
        <el-table-column label="车型分组" width="100">
          <template #default="{ row }">
            <el-tag :type="getVehicleGroupType(row.vehicleGroup)" size="small">
              {{ getVehicleGroupLabel(row.vehicleGroup) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="里程范围" width="140">
          <template #default="{ row }">
            {{ row.mileageRange?.min }}-{{ row.mileageRange?.max }} km
          </template>
        </el-table-column>
        <el-table-column label="套餐档位" width="100">
          <template #default="{ row }">
            <el-tag :type="getTierType(row.tier)" size="small">
              {{ row.tier }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            <span style="color: #f56c6c;">¥{{ row.price }}</span>
            <span v-if="row.originalPrice && row.originalPrice > row.price" style="margin-left: 8px; color: #909399; text-decoration: line-through;">
              ¥{{ row.originalPrice }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="预估时长" width="100">
          <template #default="{ row }">
            {{ row.estimatedDuration }} 小时
          </template>
        </el-table-column>
        <el-table-column label="商品数量" width="100">
          <template #default="{ row }">
            {{ row.products?.length || 0 }} 项
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80">
          <template #default="{ row }">
            {{ row.sortOrder }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              @change="handleToggleEnabled(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="是否热门" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.isFeatured"
              @change="handleToggleFeatured(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px"
        @size-change="fetchPackages"
        @current-change="fetchPackages"
      />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑套餐' : '新建套餐'"
      width="900px"
    >
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入套餐名称" />
        </el-form-item>

        <el-form-item label="套餐编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入套餐编码（英文）" />
        </el-form-item>

        <el-form-item label="套餐描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入套餐描述" />
        </el-form-item>

        <el-form-item label="车型分组" prop="vehicleGroup">
          <el-select v-model="form.vehicleGroup" placeholder="请选择车型分组">
            <el-option label="牵引车" value="牵引车" />
            <el-option label="载货车" value="载货车" />
            <el-option label="轻卡" value="轻卡" />
            <el-option label="自卸" value="自卸" />
            <el-option label="全部" value="ALL" />
          </el-select>
        </el-form-item>

        <el-form-item label="里程范围">
          <el-input-number
            v-model="form.mileageRangeMin"
            :min="0"
            :max="999999"
            placeholder="最小里程"
            style="width: 150px"
          />
          <span style="margin: 0 12px;">-</span>
          <el-input-number
            v-model="form.mileageRangeMax"
            :min="0"
            :max="999999"
            placeholder="最大里程"
            style="width: 150px"
          />
          <span style="margin-left: 12px;">km</span>
        </el-form-item>

        <el-form-item label="套餐档位" prop="tier">
          <el-select v-model="form.tier" placeholder="请选择套餐档位">
            <el-option label="基础" value="基础" />
            <el-option label="标准" value="标准" />
            <el-option label="高级" value="高级" />
            <el-option label="尊享" value="尊享" />
          </el-select>
        </el-form-item>

        <el-form-item label="套餐价格" prop="price">
          <el-input-number
            v-model="form.price"
            :min="0"
            :precision="2"
            :step="100"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 12px;">元</span>
        </el-form-item>

        <el-form-item label="原价">
          <el-input-number
            v-model="form.originalPrice"
            :min="0"
            :precision="2"
            :step="100"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 12px;">元</span>
          <div class="form-item-tip">用于显示折扣</div>
        </el-form-item>

        <el-form-item label="预估时长" prop="estimatedDuration">
          <el-input-number
            v-model="form.estimatedDuration"
            :min="0.5"
            :max="24"
            :step="0.5"
            controls-position="right"
            style="width: 150px"
          />
          <span style="margin-left: 12px;">小时</span>
        </el-form-item>

        <el-form-item label="排序序号" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" style="width: 150px" />
        </el-form-item>

        <el-form-item label="选择商品" prop="products">
          <el-select
            v-model="form.products"
            multiple
            filterable
            placeholder="请选择商品"
            style="width: 100%"
          >
            <el-option
              v-for="product in allProducts"
              :key="product._id"
              :label="`${product.name} - ¥${product.price}`"
              :value="product._id"
            />
          </el-select>
          <div class="form-item-tip">已选择 {{ form.products?.length || 0 }} 个商品</div>
        </el-form-item>

        <el-form-item label="套餐图片">
          <el-upload
            v-model:form.images"
            list-type="picture-card"
            :limit="5"
            action="#"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="特色标签">
          <el-input v-model="form.tags" placeholder="输入标签，用逗号分隔" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSave" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getPackages, createPackage, updatePackage, deletePackage } from '@/api/maintenance'
import { getProducts } from '@/api/product'

const loading = ref(false)
const saving = ref(false)
const packages = ref([])
const allProducts = ref([])
const total = ref(0)

const pagination = ref({
  page: 1,
  limit: 20
})

const filters = ref({
  vehicleGroup: '',
  tier: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const currentPackageId = ref('')

const form = ref({
  name: '',
  code: '',
  description: '',
  vehicleGroup: 'ALL',
  mileageRangeMin: 0,
  mileageRangeMax: 999999,
  tier: '标准',
  price: 0,
  originalPrice: 0,
  estimatedDuration: 2,
  sortOrder: 0,
  products: [],
  images: [],
  tags: ''
})

const formRules = {
  name: [{ required: true, message: '请输入套餐名称' }],
  code: [{ required: true, message: '请输入套餐编码' }],
  vehicleGroup: [{ required: true, message: '请选择车型分组' }],
  tier: [{ required: true, message: '请选择套餐档位' }],
  price: [{ required: true, message: '请输入套餐价格' }]
}

// 获取套餐列表
const fetchPackages = async () => {
  loading.value = true
  try {
    const res = await getPackages({
      page: pagination.value.page,
      limit: pagination.value.limit,
      vehicleGroup: filters.value.vehicleGroup || undefined,
      tier: filters.value.tier || undefined
    })
    packages.value = res.data.packages || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取套餐列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取所有商品
const fetchProducts = async () => {
  try {
    const res = await getProducts()
    allProducts.value = res.data.products || []
  } catch (error) {
    console.error('获取商品列表失败:', error)
  }
}

// 新建套餐
const handleCreate = () => {
  isEdit.value = false
  currentPackageId.value = ''
  form.value = {
    name: '',
    code: '',
    description: '',
    vehicleGroup: 'ALL',
    mileageRangeMin: 0,
    mileageRangeMax: 999999,
    tier: '标准',
    price: 0,
    originalPrice: 0,
    estimatedDuration: 2,
    sortOrder: 0,
    products: [],
    images: [],
    tags: ''
  }
  dialogVisible.value = true
}

// 编辑套餐
const handleEdit = (row) => {
  isEdit.value = true
  currentPackageId.value = row._id
  form.value = {
    name: row.name,
    code: row.code,
    description: row.description,
    vehicleGroup: row.vehicleGroup,
    mileageRangeMin: row.mileageRange?.min || 0,
    mileageRangeMax: row.mileageRange?.max || 999999,
    tier: row.tier,
    price: row.price,
    originalPrice: row.originalPrice || 0,
    estimatedDuration: row.estimatedDuration,
    sortOrder: row.sortOrder,
    products: row.products?.map(p => p.productId) || [],
    images: row.images || [],
    tags: row.tags?.join(',') || ''
  }
  dialogVisible.value = true
}

// 删除套餐
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该套餐吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })

    await deletePackage(row._id)
    ElMessage.success('删除成功')
    fetchPackages()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 确认保存
const confirmSave = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const data = {
      ...form.value,
      mileageRange: {
        min: form.value.mileageRangeMin,
        max: form.value.mileageRangeMax
      },
      products: form.value.products.map(productId => ({
        productId,
        quantity: 1
      }))
    }

    if (isEdit.value) {
      await updatePackage(currentPackageId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createPackage(data)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    fetchPackages()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

// 切换启用状态
const handleToggleEnabled = async (row) => {
  try {
    await updatePackage(row._id, { enabled: row.enabled })
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

// 切换热门状态
const handleToggleFeatured = async (row) => {
  try {
    await updatePackage(row._id, { isFeatured: row.isFeatured })
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

// 获取车型分组类型
const getVehicleGroupType = (type) => {
  const typeMap = {
    '牵引车': '',
    '载货车': 'success',
    '轻卡': 'warning',
    '自卸': 'info',
    'ALL': ''
  }
  return typeMap[type] || ''
}

// 获取车型分组标签
const getVehicleGroupLabel = (type) => {
  const labelMap = {
    '牵引车': '牵引车',
    '载货车': '载货车',
    '轻卡': '轻卡',
    '自卸': '自卸',
    'ALL': '全部'
  }
  return labelMap[type] || type
}

// 获取档位类型
const getTierType = (tier) => {
  const typeMap = {
    '基础': 'info',
    '标准': 'primary',
    '高级': 'success',
    '尊享': 'warning'
  }
  return typeMap[tier] || ''
}

onMounted(() => {
  fetchPackages()
  fetchProducts()
})
</script>

<style scoped lang="scss">
.maintenance-packages {
  .form-item-tip {
    margin-top: 8px;
    font-size: 13px;
    color: #909399;
    line-height: 1.5;
  }
}
</style>
