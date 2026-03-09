<template>
  <div class="package-standards">
    <!-- 操作栏 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="18">
          <el-button
            type="primary"
            @click="handleCreate"
          >
            <el-icon><Plus /></el-icon>
            新建套餐类型
          </el-button>
          <el-button
            type="success"
            @click="handleBatchCreate"
          >
            <el-icon><Plus /></el-icon>
            批量新建
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
            style="width: 160px"
            @change="fetchStandards"
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
            style="width: 140px"
            @change="fetchStandards"
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

    <!-- 套餐规范列表 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="standards"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="name"
          label="套餐类型"
          width="200"
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
              {{ row.vehicleGroup }}
            </el-tag>
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
          label="价格区间数量"
          width="120"
        >
          <template #default="{ row }">
            {{ row.priceRanges?.length || 0 }} 个区域
          </template>
        </el-table-column>
        <el-table-column
          label="参考服务项目"
          width="200"
        >
          <template #default="{ row }">
            {{ row.suggestedServiceItems?.length || 0 }} 项
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
          label="创建时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="150"
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
        @size-change="fetchStandards"
        @current-change="fetchStandards"
      />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑套餐类型' : '新建套餐类型'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item
          label="套餐类型"
          prop="name"
        >
          <el-input
            v-model="form.name"
            placeholder="请输入规范名称"
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
            @change="handleVehicleGroupChange"
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
          <div class="form-item-tip">
            选择适用的车型分组
          </div>
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
          <div class="form-item-tip">
            选择适用的套餐档次
          </div>
        </el-form-item>

        <!-- 区域价格区间 -->
        <el-form-item
          label="价格区间设置"
          required
        >
          <div class="price-ranges-container">
            <div
              v-for="(priceRange, index) in form.priceRanges"
              :key="index"
              class="price-range-row"
            >
              <el-select
                v-model="priceRange.province"
                placeholder="省份"
                filterable
                style="width: 140px; margin-right: 8px;"
              >
                <el-option
                  v-for="province in provinces"
                  :key="province"
                  :label="province"
                  :value="province"
                />
              </el-select>
              <el-select
                v-model="priceRange.city"
                placeholder="城市"
                filterable
                style="width: 140px; margin-right: 8px;"
              >
                <el-option
                  label="全省"
                  value="全省"
                />
                <el-option
                  v-for="city in getCityOptions(priceRange.province)"
                  :key="city"
                  :label="city"
                  :value="city"
                />
              </el-select>
              <el-input-number
                v-model="priceRange.minPrice"
                placeholder="最低价（分）"
                :min="0"
                :step="100"
                style="width: 180px; margin-right: 8px;"
              />
              <span style="margin-right: 8px;">-</span>
              <el-input-number
                v-model="priceRange.maxPrice"
                placeholder="最高价（分）"
                :min="0"
                :step="100"
                style="width: 180px; margin-right: 8px;"
              />
              <el-button
                type="danger"
                size="small"
                @click="removePriceRange(index)"
              >
                删除
              </el-button>
            </div>
            <el-button
              type="primary"
              size="small"
              style="margin-top: 10px;"
              @click="addPriceRange"
            >
              + 添加价格区间
            </el-button>
          </div>
          <div class="form-item-tip">
            设置各区域的价格区间，单位为分
          </div>
        </el-form-item>

        <!-- 推荐服务项目 -->
        <el-form-item label="推荐服务项目">
          <div class="service-items-container">
            <div
              v-for="(item, index) in form.suggestedServiceItems"
              :key="index"
              class="service-item-row"
            >
              <el-input
                v-model="item.name"
                placeholder="项目名称"
                style="width: 180px; margin-right: 8px;"
              />
              <el-input
                v-model="item.icon"
                placeholder="图标（emoji）"
                style="width: 120px; margin-right: 8px;"
              />
              <el-input
                v-model="item.description"
                placeholder="描述"
                style="width: 250px; margin-right: 8px;"
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
            推荐的服务项目列表，供门店配置套餐时参考。
          </div>
        </el-form-item>

        <el-form-item label="是否启用">
          <el-switch v-model="form.enabled" />
          <div class="form-item-tip">
            启用后，门店管理员创建套餐时价格必须在区间内进行强校验；不启用则仅作为参考提示
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量创建对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量新建套餐类型"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="batch-create-container">
        <div class="batch-tips">
          <el-icon color="#409EFF">
            <InfoFilled />
          </el-icon>
          <span>批量创建将根据选择的车型分组和套餐档位组合，一次性创建多个套餐类型</span>
        </div>

        <el-form
          ref="batchFormRef"
          :model="batchForm"
          label-width="120px"
        >
          <el-form-item label="选择车型分组">
            <el-checkbox-group v-model="batchForm.vehicleGroups">
              <el-checkbox label="牵引车" />
              <el-checkbox label="载货车" />
              <el-checkbox label="轻卡" />
              <el-checkbox label="自卸" />
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="选择套餐档位">
            <el-checkbox-group v-model="batchForm.tiers">
              <el-checkbox label="基础" />
              <el-checkbox label="标准" />
              <el-checkbox label="高级" />
              <el-checkbox label="尊享" />
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="命名规则">
            <el-input
              v-model="batchForm.nameTemplate"
              placeholder="如：{vehicleGroup}{tier}保养套餐"
              style="width: 100%"
            />
            <div class="form-item-tip">
              可用变量：{vehicleGroup}=车型分组，{tier}=套餐档位
            </div>
          </el-form-item>

          <!-- 价格区间设置（应用到所有套餐） -->
          <el-form-item label="价格区间设置">
            <div class="price-ranges-container">
              <div
                v-for="(priceRange, index) in batchForm.priceRanges"
                :key="index"
                class="price-range-row"
              >
                <el-select
                  v-model="priceRange.province"
                  placeholder="省份"
                  filterable
                  style="width: 140px; margin-right: 8px;"
                >
                  <el-option
                    v-for="province in provinces"
                    :key="province"
                    :label="province"
                    :value="province"
                  />
                </el-select>
                <el-select
                  v-model="priceRange.city"
                  placeholder="城市"
                  filterable
                  style="width: 140px; margin-right: 8px;"
                >
                  <el-option
                    label="全省"
                    value="全省"
                  />
                  <el-option
                    v-for="city in getCityOptions(priceRange.province)"
                    :key="city"
                    :label="city"
                    :value="city"
                  />
                </el-select>
                <el-input-number
                  v-model="priceRange.minPrice"
                  placeholder="最低价（分）"
                  :min="0"
                  :step="100"
                  style="width: 150px; margin-right: 8px;"
                />
                <span style="margin-right: 8px;">-</span>
                <el-input-number
                  v-model="priceRange.maxPrice"
                  placeholder="最高价（分）"
                  :min="0"
                  :step="100"
                  style="width: 150px; margin-right: 8px;"
                />
                <el-button
                  type="danger"
                  size="small"
                  @click="removeBatchPriceRange(index)"
                >
                  删除
                </el-button>
              </div>
              <el-button
                type="primary"
                size="small"
                style="margin-top: 10px;"
                @click="addBatchPriceRange"
              >
                + 添加价格区间
              </el-button>
            </div>
          </el-form-item>

          <!-- 预览将要创建的套餐 -->
          <el-form-item label="预览创建列表">
            <div class="preview-list">
              <el-tag
                v-for="(item, index) in previewBatchItems"
                :key="index"
                style="margin: 4px;"
              >
                {{ item.name }}
              </el-tag>
              <el-empty
                v-if="previewBatchItems.length === 0"
                description="请选择车型分组和套餐档位"
                :image-size="60"
              />
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="batchDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="batchSubmitting"
          @click="handleBatchSubmit"
        >
          批量创建（{{ previewBatchItems.length }} 项）
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import {
  getPackageStandards,
  createPackageStandard,
  updatePackageStandard,
  deletePackageStandard
} from '@/api/packageStandard'

// 省市数据（简化版）
const provinces = [
  '北京市', '天津市', '上海市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区'
]

const cityMap = {
  '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区'],
  '天津市': ['和平区', '河东区', '河西区', '南开区', '河北区'],
  '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区'],
  '重庆市': ['万州区', '涪陵区', '渝中区', '大渡口区', '江北区'],
  '河北省': ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '保定市'],
  '山西省': ['太原市', '大同市', '阳泉市', '长治市', '晋城市'],
  '辽宁省': ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市'],
  '吉林省': ['长春市', '吉林市', '四平市', '辽源市', '通化市'],
  '黑龙江省': ['哈尔滨市', '齐齐哈尔市', '鸡西市', '鹤岗市', '双鸭山市'],
  '江苏省': ['南京市', '无锡市', '徐州市', '常州市', '苏州市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市'],
  '安徽省': ['合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市'],
  '福建省': ['福州市', '厦门市', '莆田市', '三明市', '泉州市'],
  '江西省': ['南昌市', '景德镇市', '萍乡市', '九江市', '新余市'],
  '山东省': ['济南市', '青岛市', '淄博市', '枣庄市', '东营市'],
  '河南省': ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市'],
  '湖北省': ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市'],
  '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市'],
  '广东省': ['广州市', '韶关市', '深圳市', '珠海市', '汕头市'],
  '海南省': ['海口市', '三亚市', '三沙市', '儋州市'],
  '四川省': ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市'],
  '贵州省': ['贵阳市', '六盘水市', '遵义市', '安顺市', '毕节市'],
  '云南省': ['昆明市', '曲靖市', '玉溪市', '保山市', '昭通市'],
  '陕西省': ['西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市'],
  '甘肃省': ['兰州市', '嘉峪关市', '金昌市', '白银市', '天水市'],
  '青海省': ['西宁市', '海东市'],
  '内蒙古自治区': ['呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市'],
  '广西壮族自治区': ['南宁市', '柳州市', '桂林市', '梧州市', '北海市'],
  '西藏自治区': ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市'],
  '宁夏回族自治区': ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'],
  '新疆维吾尔自治区': ['乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '昌吉市']
}

// 数据
const loading = ref(false)
const submitting = ref(false)
const standards = ref([])
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
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  name: '',
  vehicleGroup: '',
  tier: '',
  priceRanges: [],
  suggestedServiceItems: [],
  enabled: true
})

const formRules = {
  name: [{ required: true, message: '请输入规范名称', trigger: 'blur' }],
  vehicleGroup: [{ required: true, message: '请选择车型分组', trigger: 'change' }],
  tier: [{ required: true, message: '请选择套餐档位', trigger: 'change' }]
}

// 批量创建相关
const batchDialogVisible = ref(false)
const batchSubmitting = ref(false)

const batchForm = reactive({
  vehicleGroups: [],
  tiers: [],
  nameTemplate: '{vehicleGroup}{tier}保养套餐',
  priceRanges: [
    {
      province: '广东省',
      city: '全省',
      minPrice: 30000,
      maxPrice: 50000
    }
  ]
})

// 计算属性：预览批量创建的套餐列表
const previewBatchItems = computed(() => {
  const items = []
  for (const vg of batchForm.vehicleGroups) {
    for (const t of batchForm.tiers) {
      const name = batchForm.nameTemplate
        .replace('{vehicleGroup}', vg)
        .replace('{tier}', t)
      items.push({
        vehicleGroup: vg,
        tier: t,
        name
      })
    }
  }
  return items
})

// 方法
const fetchStandards = async () => {
  loading.value = true
  try {
    const response = await getPackageStandards({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    })
    console.log('获取套餐规范响应:', response)

    const standardsData = response?.data?.standards || []
    const totalCount = response?.data?.total || 0

    console.log('解析数据 - standards:', standardsData)
    console.log('解析数据 - total:', totalCount)

    standards.value = standardsData
    total.value = totalCount
  } catch (error) {
    console.error('获取套餐规范列表失败:', error)
    console.error('错误详情:', error.response?.data)
    ElMessage.error(error.response?.data?.message || '获取套餐规范列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, {
    name: '',
    vehicleGroup: '',
    tier: '',
    priceRanges: [],
    suggestedServiceItems: [],
    enabled: true
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    _id: row._id,
    name: row.name,
    vehicleGroup: row.vehicleGroup,
    tier: row.tier,
    priceRanges: row.priceRanges ? [...row.priceRanges] : [],
    suggestedServiceItems: row.suggestedServiceItems ? [...row.suggestedServiceItems] : [],
    enabled: row.enabled
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (error) {
    console.log('表单验证失败:', error)
    return
  }

  // 验证价格区间
  if (!form.priceRanges || form.priceRanges.length === 0) {
    ElMessage.warning('请至少添加一个价格区间')
    return
  }

  for (const pr of form.priceRanges) {
    if (!pr.province || !pr.minPrice || !pr.maxPrice) {
      ElMessage.warning('价格区间必须包含省份、最低价和最高价')
      return
    }
    if (pr.minPrice >= pr.maxPrice) {
      ElMessage.warning('最低价必须小于最高价')
      return
    }
  }

  submitting.value = true
  try {
    console.log('提交数据:', JSON.stringify(form, null, 2))

    let result
    if (isEdit.value) {
      result = await updatePackageStandard(form._id, form)
      console.log('更新结果:', result)
      ElMessage.success('更新成功')
    } else {
      result = await createPackageStandard(form)
      console.log('创建结果:', result)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    await fetchStandards()
  } catch (error) {
    console.error('提交失败:', error)
    console.error('错误响应:', error.response)
    const errorMsg = error.response?.data?.message || error.message || '操作失败'
    ElMessage.error(errorMsg)
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该套餐规范吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deletePackageStandard(row._id)
      ElMessage.success('删除成功')
      fetchStandards()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const handleToggleEnabled = async (row) => {
  try {
    await updatePackageStandard(row._id, { enabled: row.enabled })
    ElMessage.success(row.enabled ? '已启用' : '已禁用')
  } catch (error) {
    row.enabled = !row.enabled
    ElMessage.error('操作失败')
  }
}

const handleVehicleGroupChange = () => {
  // 车型变化时可以做一些提示或处理
}

const addPriceRange = () => {
  form.priceRanges.push({
    province: '',
    city: '全省',
    minPrice: null,
    maxPrice: null
  })
}

const removePriceRange = (index) => {
  form.priceRanges.splice(index, 1)
}

const addServiceItem = () => {
  form.suggestedServiceItems.push({
    name: '',
    icon: '🔧',
    description: ''
  })
}

const removeServiceItem = (index) => {
  form.suggestedServiceItems.splice(index, 1)
}

// 批量创建相关函数
const handleBatchCreate = () => {
  // 重置批量创建表单
  batchForm.vehicleGroups = []
  batchForm.tiers = []
  batchForm.nameTemplate = '{vehicleGroup}{tier}保养套餐'
  batchForm.priceRanges = [
    {
      province: '广东省',
      city: '全省',
      minPrice: 30000,
      maxPrice: 50000
    }
  ]
  batchDialogVisible.value = true
}

const addBatchPriceRange = () => {
  batchForm.priceRanges.push({
    province: '',
    city: '全省',
    minPrice: null,
    maxPrice: null
  })
}

const removeBatchPriceRange = (index) => {
  batchForm.priceRanges.splice(index, 1)
}

const handleBatchSubmit = async () => {
  // 验证
  if (batchForm.vehicleGroups.length === 0) {
    ElMessage.warning('请至少选择一个车型分组')
    return
  }
  if (batchForm.tiers.length === 0) {
    ElMessage.warning('请至少选择一个套餐档位')
    return
  }
  if (!batchForm.nameTemplate) {
    ElMessage.warning('请输入命名规则')
    return
  }
  if (!batchForm.priceRanges || batchForm.priceRanges.length === 0) {
    ElMessage.warning('请至少添加一个价格区间')
    return
  }

  // 验证价格区间
  for (const pr of batchForm.priceRanges) {
    if (!pr.province || !pr.minPrice || !pr.maxPrice) {
      ElMessage.warning('价格区间必须包含省份、最低价和最高价')
      return
    }
    if (pr.minPrice >= pr.maxPrice) {
      ElMessage.warning('最低价必须小于最高价')
      return
    }
  }

  batchSubmitting.value = true
  try {
    console.log('批量创建数据:', previewBatchItems.value)

    // 逐个创建套餐类型
    let successCount = 0
    let failCount = 0
    const errors = []

    for (const item of previewBatchItems.value) {
      try {
        await createPackageStandard({
          name: item.name,
          vehicleGroup: item.vehicleGroup,
          tier: item.tier,
          priceRanges: batchForm.priceRanges,
          suggestedServiceItems: [],
          enabled: true
        })
        successCount++
      } catch (error) {
        failCount++
        errors.push(`${item.name}: ${error.response?.data?.message || error.message}`)
      }
    }

    if (successCount > 0) {
      ElMessage.success(`成功创建 ${successCount} 个套餐类型${failCount > 0 ? `，失败 ${failCount} 个` : ''}`)
      batchDialogVisible.value = false
      await fetchStandards()
    } else {
      ElMessage.error(`创建失败：${errors.join('; ')}`)
    }
  } catch (error) {
    console.error('批量创建失败:', error)
    ElMessage.error('批量创建失败')
  } finally {
    batchSubmitting.value = false
  }
}

const getCityOptions = (province) => {
  return cityMap[province] || []
}

const getVehicleGroupType = (group) => {
  const map = {
    '牵引车': 'danger',
    '载货车': 'warning',
    '轻卡': 'success',
    '自卸': 'info',
    'ALL': ''
  }
  return map[group] || ''
}

const getTierType = (tier) => {
  const map = {
    '基础': 'info',
    '标准': 'success',
    '高级': 'warning',
    '尊享': 'danger'
  }
  return map[tier] || ''
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchStandards()
})
</script>

<style scoped>
.package-standards {
  padding: 20px;
}

.price-ranges-container,
.service-items-container {
  width: 100%;
}

.price-range-row,
.service-item-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.batch-create-container {
  padding: 10px 0;
}

.batch-tips {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  margin-bottom: 20px;
  color: #409EFF;
  font-size: 14px;
}

.batch-tips .el-icon {
  margin-right: 8px;
}

.preview-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}
</style>
