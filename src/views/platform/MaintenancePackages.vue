<template>
  <div class="maintenance-packages">
    <!-- 操作栏 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="18">
          <el-button
            type="primary"
            @click="handleCreate"
          >
            <el-icon><Plus /></el-icon>
            新建套餐
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
            style="width: 150px"
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
            <el-option
              label="全部"
              value="ALL"
            />
          </el-select>
          <el-select
            v-model="filters.tier"
            placeholder="套餐档位"
            clearable
            style="width: 120px"
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

    <!-- 套餐列表 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="packages"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="name"
          label="套餐名称"
          width="180"
        />
        <el-table-column
          prop="code"
          label="套餐编码"
          width="140"
        />
        <el-table-column
          label="车型分组"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getVehicleGroupType(row.vehicleGroup)"
              size="small"
            >
              {{ getVehicleGroupLabel(row.vehicleGroup) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="里程范围"
          width="140"
        >
          <template #default="{ row }">
            {{ row.mileageRange?.min }}-{{ row.mileageRange?.max }} km
          </template>
        </el-table-column>
        <el-table-column
          label="套餐档位"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getTierType(row.tier)"
              size="small"
            >
              {{ row.tier }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="价格"
          width="100"
        >
          <template #default="{ row }">
            <span style="color: #f56c6c;">¥{{ row.price }}</span>
            <span
              v-if="row.originalPrice && row.originalPrice > row.price"
              style="margin-left: 8px; color: #909399; text-decoration: line-through;"
            >
              ¥{{ row.originalPrice }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="预估时长"
          width="100"
        >
          <template #default="{ row }">
            {{ row.estimatedDuration }} 小时
          </template>
        </el-table-column>
        <el-table-column
          label="商品数量"
          width="100"
        >
          <template #default="{ row }">
            {{ row.products?.length || 0 }} 项
          </template>
        </el-table-column>
        <el-table-column
          label="排序"
          width="80"
        >
          <template #default="{ row }">
            {{ row.sortOrder }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              @change="handleToggleEnabled(row)"
            />
          </template>
        </el-table-column>
        <el-table-column
          label="是否热门"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-switch
              v-model="row.isFeatured"
              @change="handleToggleFeatured(row)"
            />
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
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
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(row)"
            >
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
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item
          label="套餐名称"
          prop="name"
        >
          <el-input
            v-model="form.name"
            placeholder="请输入套餐名称"
          />
        </el-form-item>

        <el-form-item
          label="套餐编码"
          prop="code"
        >
          <el-input
            v-model="form.code"
            placeholder="请输入套餐编码（英文）"
          />
        </el-form-item>

        <el-form-item label="套餐描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入套餐描述"
          />
        </el-form-item>

        <el-form-item
          label="车型分组"
          prop="vehicleGroup"
        >
          <el-select
            v-model="form.vehicleGroup"
            placeholder="请选择车型分组"
            style="width: 100%"
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
            <el-option
              label="全部"
              value="ALL"
            />
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

        <el-form-item
          label="套餐档位"
          prop="tier"
        >
          <el-select
            v-model="form.tier"
            placeholder="请选择套餐档位"
            style="width: 100%"
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
        </el-form-item>

        <el-form-item
          label="套餐价格"
          prop="price"
        >
          <el-input-number
            v-model="form.price"
            :min="0"
            :precision="2"
            :step="100"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 12px;">元（全国统一价）</span>
          <div class="form-item-tip">
            如需设置区域价格，请在下方"区域定价"中配置
          </div>
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
          <div class="form-item-tip">
            用于显示折扣
          </div>
        </el-form-item>

        <!-- 区域定价 -->
        <el-form-item label="区域定价">
          <div class="regional-pricing-container">
            <div
              v-for="(regionalPrice, index) in form.regionalPrices"
              :key="index"
              class="regional-price-row"
            >
              <el-select
                v-model="regionalPrice.province"
                placeholder="省份"
                filterable
                style="width: 150px; margin-right: 10px;"
                @change="(val) => handleProvinceChange(index, val)"
              >
                <el-option
                  v-for="province in provinces"
                  :key="province"
                  :label="province"
                  :value="province"
                />
              </el-select>
              <el-select
                v-model="regionalPrice.city"
                placeholder="城市"
                filterable
                style="width: 150px; margin-right: 10px;"
              >
                <el-option
                  label="全省"
                  value="全省"
                />
                <el-option
                  v-for="city in getCityOptions(regionalPrice.province)"
                  :key="city"
                  :label="city"
                  :value="city"
                />
              </el-select>
              <el-input-number
                v-model="regionalPrice.price"
                placeholder="价格"
                :min="0"
                :precision="2"
                :step="100"
                controls-position="right"
                style="width: 150px; margin-right: 10px;"
              />
              <el-input-number
                v-model="regionalPrice.originalPrice"
                placeholder="原价"
                :min="0"
                :precision="2"
                :step="100"
                controls-position="right"
                style="width: 150px; margin-right: 10px;"
              />
              <el-switch
                v-model="regionalPrice.enabled"
                active-text="启用"
                inactive-text="停用"
                style="margin-right: 10px;"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeRegionalPrice(index)"
              >
                删除
              </el-button>
            </div>
            <el-button
              type="primary"
              size="small"
              style="margin-top: 10px;"
              @click="addRegionalPrice"
            >
              + 添加区域价格
            </el-button>
          </div>
          <div class="form-item-tip">
            为不同省市设置专属价格。省市精确匹配优先级高于全省匹配。
          </div>
        </el-form-item>

        <el-form-item
          label="预估时长"
          prop="estimatedDuration"
        >
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

        <el-form-item
          label="排序序号"
          prop="sortOrder"
        >
          <el-input-number
            v-model="form.sortOrder"
            :min="0"
            style="width: 150px"
          />
        </el-form-item>

        <!-- 服务项目列表（面向司机展示） -->
        <el-form-item label="服务项目列表">
          <div class="service-items-container">
            <div
              v-for="(item, index) in form.serviceItems"
              :key="index"
              class="service-item-row"
            >
              <el-input
                v-model="item.name"
                placeholder="服务名称"
                style="width: 200px; margin-right: 10px;"
              />
              <el-input
                v-model="item.icon"
                placeholder="图标（emoji）"
                style="width: 120px; margin-right: 10px;"
              />
              <el-input
                v-model="item.description"
                placeholder="描述"
                style="flex: 1; margin-right: 10px;"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeServiceItem(index)"
              >
                删除
              </el-button>
            </div>
            <el-button
              type="primary"
              size="small"
              style="margin-top: 10px;"
              @click="addServiceItem"
            >
              + 添加服务项目
            </el-button>
          </div>
          <div class="form-item-tip">
            这些服务项目会展示给司机，如：更换机油、更换机滤等
          </div>
        </el-form-item>

        <!-- 商品列表（技师端和成本核算使用） -->
        <el-form-item label="商品清单">
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
          <div class="form-item-tip">
            技师端和成本核算使用，已选择 {{ form.products?.length || 0 }} 个商品
          </div>
        </el-form-item>

        <el-form-item label="套餐图片">
          <el-upload
            v-model:file-list="imageFileList"
            :http-request="handleImageUpload"
            :on-remove="handleImageRemove"
            list-type="picture-card"
            :limit="5"
            :before-upload="beforeImageUpload"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="form-item-tip">
            最多上传5张图片，支持jpg/png格式，每张不超过2MB
          </div>
        </el-form-item>

        <el-form-item label="特色标签">
          <el-input
            v-model="form.tags"
            placeholder="输入标签，用逗号分隔"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import axios from 'axios'
import { getPackages, createPackage, updatePackage, deletePackage } from '@/api/maintenance'
import { getProducts } from '@/api/product'
import { getImageUrl } from '@/utils/image'

// 省市数据（简化版，实际应该从外部文件导入）
const provinces = [
  '北京市', '天津市', '上海市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
  '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  '内蒙古自治区', '香港特别行政区', '澳门特别行政区', '台湾省'
]

const cityMap = {
  '北京市': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区'],
  '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
  '广东省': ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
  '江苏省': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
  '山东省': ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
  '四川省': ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市', '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州']
}

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const packages = ref([])
const allProducts = ref([])
const total = ref(0)
const imageFileList = ref([]) // 用于 el-upload 组件的文件列表

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
  serviceItems: [], // 新增：服务项目列表
  products: [],
  images: [],
  tags: '',
  regionalPrices: [] // 新增：区域定价
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

// 添加服务项目
const addServiceItem = () => {
  form.value.serviceItems.push({
    name: '',
    icon: '🔧',
    description: ''
  })
}

// 删除服务项目
const removeServiceItem = (index) => {
  form.value.serviceItems.splice(index, 1)
}

// 图片上传前验证
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
    return false
  }
  return true
}

// 处理图片上传
const handleImageUpload = async (options) => {
  const { file, onSuccess, onError } = options

  try {
    uploading.value = true

    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    uploading.value = false

    if (response.data.success) {
      // 将上传后的图片URL添加到表单
      if (!form.value.images) {
        form.value.images = []
      }
      form.value.images.push(response.data.data.url)

      ElMessage.success('上传成功')
      onSuccess(response.data, file)
    } else {
      onError(new Error(response.data.message || '上传失败'))
    }
  } catch (error) {
    console.error('上传错误:', error)
    uploading.value = false
    ElMessage.error('上传失败，请重试')
    onError(error)
  }
}

// 处理图片删除
const handleImageRemove = (file) => {
  // 从 form.images 中移除对应的URL
  if (file.response && file.response.data && file.response.data.url) {
    // 新上传的图片
    const url = file.response.data.url
    form.value.images = form.value.images.filter(img => img !== url)
  } else if (file.rawUrl) {
    // 编辑时已存在的图片（使用 rawUrl 属性）
    form.value.images = form.value.images.filter(img => img !== file.rawUrl)
  } else if (file.url) {
    // 兼容：通过完整URL匹配
    form.value.images = form.value.images.filter(img => {
      const fullUrl = getImageUrl(img)
      return fullUrl !== file.url
    })
  }
}

// 新建套餐
const handleCreate = () => {
  isEdit.value = false
  currentPackageId.value = ''
  imageFileList.value = []
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
    serviceItems: [],
    products: [],
    images: [],
    tags: '',
    regionalPrices: []
  }
  dialogVisible.value = true
}

// 编辑套餐
const handleEdit = (row) => {
  isEdit.value = true
  currentPackageId.value = row._id

  // 将已存在的图片URL转换为 el-upload 组件所需的文件列表格式
  const existingImages = (row.images || []).map((url, index) => ({
    name: `image-${index}`,
    url: getImageUrl(url),
    rawUrl: url // 保存原始URL用于后续处理
  }))

  imageFileList.value = existingImages

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
    serviceItems: row.serviceItems?.map(item => ({ ...item })) || [],
    products: row.products?.map(p => p.productId) || [],
    images: row.images || [],
    tags: row.tags?.join(',') || '',
    regionalPrices: row.regionalPrices?.map(rp => ({ ...rp })) || []
  }
  dialogVisible.value = true
}

// 添加区域价格
const addRegionalPrice = () => {
  form.value.regionalPrices.push({
    province: '',
    city: '',
    price: 0,
    originalPrice: 0,
    enabled: true
  })
}

// 删除区域价格
const removeRegionalPrice = (index) => {
  form.value.regionalPrices.splice(index, 1)
}

// 获取城市选项
const getCityOptions = (province) => {
  return cityMap[province] || []
}

// 省份改变时重置城市
const handleProvinceChange = (index, province) => {
  form.value.regionalPrices[index].city = ''
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

  .service-items-container {
    width: 100%;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 15px;
    background: #fafafa;
  }

  .service-item-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 10px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .regional-pricing-container {
    width: 100%;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 15px;
    background: #fafafa;
  }

  .regional-price-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 10px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    flex-wrap: wrap;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
