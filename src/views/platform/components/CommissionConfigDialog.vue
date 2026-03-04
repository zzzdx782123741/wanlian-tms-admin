<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑配置' : '新增配置'"
    width="600px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
    >
      <!-- 全局配置 -->
      <template v-if="configType === 'global'">
        <el-form-item label="配置名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="如：全局默认佣金配置"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="佣金比例" prop="commissionRate">
          <el-input-number
            v-model="form.percentageValue"
            :min="3"
            :max="10"
            :precision="1"
            :step="0.1"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399">
            %（范围：3.0% - 10.0%）
          </span>
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
          title="全局默认配置说明"
          type="info"
          :closable="false"
          style="margin-top: 10px"
        >
          全局默认配置将作为兜底配置，当订单没有匹配到服务类型或区域配置时使用此比例。
        </el-alert>
      </template>

      <!-- 服务类型配置 -->
      <template v-else-if="configType === 'service_type'">
        <el-form-item label="配置名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="如：维修订单佣金配置"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="服务类型" prop="serviceTypes">
          <el-checkbox-group v-model="form.serviceTypes">
            <el-checkbox label="repair">维修订单</el-checkbox>
            <el-checkbox label="maintenance">保养订单</el-checkbox>
            <el-checkbox label="addon">增项服务</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="佣金比例" prop="commissionRate">
          <el-input-number
            v-model="form.percentageValue"
            :min="3"
            :max="10"
            :precision="1"
            :step="0.1"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399">
            %（范围：3.0% - 10.0%）
          </span>
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
      </template>

      <!-- 区域配置 -->
      <template v-else-if="configType === 'region'">
        <el-form-item label="配置名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="如：北京市佣金配置"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="省份" prop="province">
          <el-select
            v-model="form.province"
            placeholder="请选择省份"
            filterable
            style="width: 100%"
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
            placeholder="全省适用（可不选）"
            filterable
            clearable
            style="width: 100%"
            :disabled="!form.province"
          >
            <el-option label="全省适用" value="" />
            <el-option
              v-for="city in getCityOptions(form.province)"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
          <div style="margin-top: 5px; color: #909399; font-size: 12px">
            不选择城市表示该配置适用于全省所有城市
          </div>
        </el-form-item>

        <el-form-item label="佣金比例" prop="commissionRate">
          <el-input-number
            v-model="form.percentageValue"
            :min="3"
            :max="10"
            :precision="1"
            :step="0.1"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399">
            %（范围：3.0% - 10.0%）
          </span>
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
          title="区域配置优先级说明"
          type="info"
          :closable="false"
          style="margin-top: 10px"
        >
          区域配置优先级高于服务类型配置。如果同时设置了"北京市+维修订单"和"北京市"，将优先使用"北京市+维修订单"的配置。
        </el-alert>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="submitting">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createCommissionConfig, updateCommissionConfig } from '@/api/commission'

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

const isEdit = computed(() => !!props.config)

// 表单数据
const form = reactive({
  name: '',
  commissionRate: 0.08,
  percentageValue: 8.0,
  serviceTypes: [],
  province: '',
  city: '',
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' }
  ],
  commissionRate: [
    { required: true, message: '请输入佣金比例', trigger: 'blur' }
  ],
  serviceTypes: [
    { required: true, message: '请选择服务类型', trigger: 'change' }
  ],
  province: [
    { required: true, message: '请选择省份', trigger: 'change' }
  ]
}

// 监听百分比变化，同步到commissionRate
watch(() => form.percentageValue, (newVal) => {
  form.commissionRate = newVal / 100
})

// 监听config变化，初始化表单
watch(() => props.config, (config) => {
  if (config) {
    Object.assign(form, {
      name: config.name,
      commissionRate: config.commissionRate,
      percentageValue: (config.commissionRate * 100).toFixed(1),
      serviceTypes: config.serviceTypes || [],
      province: config.province || '',
      city: config.city || '',
      description: config.description || ''
    })
  } else {
    // 重置表单
    Object.assign(form, {
      name: '',
      commissionRate: 0.08,
      percentageValue: 8.0,
      serviceTypes: [],
      province: '',
      city: '',
      description: ''
    })
  }
}, { immediate: true })

// 省市数据
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
  '四川省': ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市']
}

const getCityOptions = (province) => {
  return cityMap[province] || []
}

// 取消
const handleCancel = () => {
  emit('update:modelValue', false)
}

// 确认
const handleConfirm = async () => {
  try {
    await formRef.value.validate()

    submitting.value = true

    const data = {
      ...form,
      configType: props.configType
    }

    if (isEdit.value) {
      await updateCommissionConfig(props.config._id, data)
      ElMessage.success('更新成功')
    } else {
      await createCommissionConfig(data)
      ElMessage.success('创建成功')
    }

    emit('update:modelValue', false)
    emit('success')
  } catch (error) {
    if (error !== false) { // 表单验证失败时error为false
      console.error('保存配置失败:', error)
      ElMessage.error(error.message || '保存失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
