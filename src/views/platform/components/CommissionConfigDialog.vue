<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="680px"
    @update:model-value="handleVisibleChange"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="配置名称" prop="name">
        <el-input
          v-model="form.name"
          :placeholder="namePlaceholder"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <template v-if="configType === 'region'">
        <el-form-item label="省份" prop="province">
          <el-select
            v-model="form.province"
            placeholder="请选择省份"
            filterable
            style="width: 100%"
            @change="handleProvinceChange"
          >
            <el-option
              v-for="province in provinces"
              :key="province"
              :label="province"
              :value="province"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="城市">
          <el-select
            v-model="form.city"
            placeholder="可不选，不选则表示全省适用"
            clearable
            filterable
            style="width: 100%"
            :disabled="!form.province"
          >
            <el-option
              v-for="city in getCityOptions(form.province)"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
          <div class="form-tip">如果不选择城市，则该配置对所选省份下的全部门店生效。</div>
        </el-form-item>
      </template>

      <template v-else-if="configType === 'store'">
        <el-form-item label="适用门店" prop="storeId">
          <el-select
            v-model="form.storeId"
            placeholder="请选择门店"
            filterable
            clearable
            style="width: 100%"
            :loading="storeLoading"
          >
            <el-option
              v-for="store in storeOptions"
              :key="store._id"
              :label="getStoreOptionLabel(store)"
              :value="store._id"
            />
          </el-select>
          <div class="form-tip">门店级配置优先级最高，命中后将直接按该门店下对应服务类型的比例结算。</div>
        </el-form-item>
      </template>

      <el-form-item label="维修佣金" prop="repairPercentageValue">
        <el-input-number
          v-model="form.repairPercentageValue"
          :min="3"
          :max="10"
          :precision="1"
          :step="0.1"
          controls-position="right"
          style="width: 200px"
        />
        <span class="rate-tip">%（范围：3.0% - 10.0%）</span>
      </el-form-item>

      <el-form-item label="保养佣金" prop="maintenancePercentageValue">
        <el-input-number
          v-model="form.maintenancePercentageValue"
          :min="3"
          :max="10"
          :precision="1"
          :step="0.1"
          controls-position="right"
          style="width: 200px"
        />
        <span class="rate-tip">%（范围：3.0% - 10.0%）</span>
      </el-form-item>

      <el-form-item label="说明">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入配置说明"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-alert
        v-if="tipContent"
        :title="tipTitle"
        type="info"
        :closable="false"
        style="margin-top: 8px"
      >
        {{ tipContent }}
      </el-alert>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createCommissionConfig, updateCommissionConfig } from '@/api/commission'
import { getStores } from '@/api/store'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  configType: {
    type: String,
    required: true
  },
  config: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref()
const submitting = ref(false)
const storeLoading = ref(false)
const storeOptions = ref([])

const isEdit = computed(() => Boolean(props.config?._id))
const dialogTitle = computed(() => (isEdit.value ? '编辑佣金配置' : '新增佣金配置'))

const form = reactive({
  name: '',
  repairCommissionRate: 0.08,
  maintenanceCommissionRate: 0.08,
  repairPercentageValue: 8,
  maintenancePercentageValue: 8,
  province: '',
  city: '',
  storeId: '',
  description: ''
})

const namePlaceholderMap = {
  global: '例如：全局默认佣金配置',
  region: '例如：北京市佣金配置',
  store: '例如：友道门店佣金配置'
}

const tipTitleMap = {
  global: '全局配置说明',
  region: '区域配置说明',
  store: '门店配置说明'
}

const tipContentMap = {
  global: '全局配置会作为兜底规则，可在同一条配置中分别设置维修和保养佣金比例。',
  region: '区域配置会覆盖全局配置；如果配置到城市，则优先命中城市，其次回退到省份级配置。',
  store: '门店配置适用于指定门店，优先级最高，可针对合作门店或重点门店单独维护维修、保养比例。'
}

const namePlaceholder = computed(() => namePlaceholderMap[props.configType] || '请输入配置名称')
const tipTitle = computed(() => tipTitleMap[props.configType] || '配置说明')
const tipContent = computed(() => tipContentMap[props.configType] || '')

const formRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  repairPercentageValue: [{ required: true, message: '请输入维修佣金比例', trigger: 'change' }],
  maintenancePercentageValue: [{ required: true, message: '请输入保养佣金比例', trigger: 'change' }],
  province: [{ required: true, message: '请选择省份', trigger: 'change' }],
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }]
}

watch(
  () => form.repairPercentageValue,
  (value) => {
    form.repairCommissionRate = Number(value || 0) / 100
  }
)

watch(
  () => form.maintenancePercentageValue,
  (value) => {
    form.maintenanceCommissionRate = Number(value || 0) / 100
  }
)

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      return
    }

    resetForm()
    fillForm(props.config)

    if (props.configType === 'store') {
      await fetchStores()
    }
  },
  { immediate: true }
)

watch(
  () => props.config,
  (config) => {
    if (props.modelValue) {
      resetForm()
      fillForm(config)
    }
  }
)

const getLegacyRate = (config) => Number(config?.commissionRate ?? 0.08)

const resetForm = () => {
  Object.assign(form, {
    name: '',
    repairCommissionRate: 0.08,
    maintenanceCommissionRate: 0.08,
    repairPercentageValue: 8,
    maintenancePercentageValue: 8,
    province: '',
    city: '',
    storeId: '',
    description: ''
  })

  formRef.value?.clearValidate()
}

const fillForm = (config) => {
  if (!config) {
    return
  }

  const repairCommissionRate = Number(config.repairCommissionRate ?? getLegacyRate(config))
  const maintenanceCommissionRate = Number(config.maintenanceCommissionRate ?? getLegacyRate(config))

  Object.assign(form, {
    name: config.name || '',
    repairCommissionRate,
    maintenanceCommissionRate,
    repairPercentageValue: Number((repairCommissionRate * 100).toFixed(1)),
    maintenancePercentageValue: Number((maintenanceCommissionRate * 100).toFixed(1)),
    province: config.province || '',
    city: config.city || '',
    storeId: config.storeId?._id || config.storeId || '',
    description: config.description || ''
  })
}

const fetchStores = async () => {
  storeLoading.value = true
  try {
    const res = await getStores({ page: 1, limit: 1000 })
    storeOptions.value = res.data?.stores || res.data?.list || []
  } catch (error) {
    console.error('获取门店列表失败:', error)
    ElMessage.error(error.message || '获取门店列表失败')
  } finally {
    storeLoading.value = false
  }
}

const handleProvinceChange = () => {
  form.city = ''
}

const getStoreOptionLabel = (store) => {
  const province = store.address?.province || ''
  const city = store.address?.city || ''
  const region = [province, city].filter(Boolean).join(' / ')
  return region ? `${store.name}（${region}）` : store.name
}

const closeDialog = () => {
  emit('update:modelValue', false)
}

const handleVisibleChange = (visible) => {
  emit('update:modelValue', visible)
}

const handleConfirm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true

    const payload = {
      name: form.name.trim(),
      configType: props.configType,
      repairCommissionRate: Number(form.repairCommissionRate),
      maintenanceCommissionRate: Number(form.maintenanceCommissionRate),
      description: form.description.trim()
    }

    if (props.configType === 'region') {
      payload.province = form.province
      payload.city = form.city
    }

    if (props.configType === 'store') {
      payload.storeId = form.storeId
    }

    if (isEdit.value) {
      await updateCommissionConfig(props.config._id, payload)
      ElMessage.success('更新成功')
    } else {
      await createCommissionConfig(payload)
      ElMessage.success('创建成功')
    }

    emit('update:modelValue', false)
    emit('success')
  } catch (error) {
    if (error !== false) {
      console.error('保存佣金配置失败:', error)
      ElMessage.error(error.message || '保存失败')
    }
  } finally {
    submitting.value = false
  }
}

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
  北京市: ['东城区', '西城区', '朝阳区', '海淀区', '通州区', '昌平区', '大兴区'],
  上海市: ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区', '闵行区', '宝山区'],
  广东省: ['广州市', '深圳市', '珠海市', '佛山市', '东莞市', '中山市', '惠州市'],
  浙江省: ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '台州市'],
  江苏省: ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '扬州市'],
  山东省: ['济南市', '青岛市', '淄博市', '烟台市', '潍坊市', '济宁市', '临沂市'],
  四川省: ['成都市', '绵阳市', '德阳市', '宜宾市', '南充市', '乐山市', '达州市']
}

const getCityOptions = (province) => cityMap[province] || []
</script>

<style scoped lang="scss">
.rate-tip {
  margin-left: 10px;
  color: #909399;
}

.form-tip {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}
</style>
