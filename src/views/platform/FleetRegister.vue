<template>
  <div class="fleet-register-page">
    <el-page-header title="车队入驻" @back="$router.back()">
      <template #content>
        <div class="page-header-content">
          <el-icon :size="20" style="margin-right: 8px">
            <OfficeBuilding />
          </el-icon>
          <span class="text-large font-600">平台运营代车队注册</span>
        </div>
      </template>
    </el-page-header>

    <el-card class="page-card">
      <el-alert
        title="请按步骤完成车队资料录入"
        type="info"
        :closable="false"
        class="page-alert"
      >
        当前页面已补齐统一社会信用代码、法人身份证号、手机号、营业执照号等高风险字段校验。
      </el-alert>

      <el-steps :active="currentStep" finish-status="success" align-center class="steps">
        <el-step title="基本信息" />
        <el-step title="法人信息" />
        <el-step title="证照信息" />
        <el-step title="账号开通" />
      </el-steps>

      <div v-show="currentStep === 0" class="step-content">
        <el-form ref="basicFormRef" :model="formData" :rules="basicRules" label-width="120px" size="large">
          <el-form-item label="车队名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入车队名称" clearable />
          </el-form-item>

          <el-form-item label="车队类型" prop="fleetType">
            <el-radio-group v-model="formData.fleetType">
              <el-radio label="logistics_company">物流公司</el-radio>
              <el-radio label="individual_operator">个体车队</el-radio>
              <el-radio label="other">其他</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="统一社会信用代码" prop="creditCode">
            <el-input v-model="formData.creditCode" placeholder="请输入 18 位统一社会信用代码" maxlength="18" clearable />
          </el-form-item>

          <el-form-item label="经营范围" prop="businessScope">
            <el-input v-model="formData.businessScope" type="textarea" :rows="3" placeholder="请输入经营范围" />
          </el-form-item>

          <el-form-item label="联系人" prop="contact.name">
            <el-input v-model="formData.contact.name" placeholder="请输入联系人姓名" clearable />
          </el-form-item>

          <el-form-item label="联系电话" prop="contact.phone">
            <el-input v-model="formData.contact.phone" placeholder="请输入联系电话" clearable />
          </el-form-item>

          <el-form-item label="联系邮箱">
            <el-input v-model="formData.contact.email" placeholder="选填" clearable />
          </el-form-item>

          <el-form-item label="详细地址" prop="address.detail">
            <el-input v-model="formData.address.detail" placeholder="请输入详细地址" clearable />
          </el-form-item>
        </el-form>
      </div>

      <div v-show="currentStep === 1" class="step-content">
        <el-form ref="legalFormRef" :model="formData" :rules="legalRules" label-width="120px" size="large">
          <el-form-item label="法人姓名" prop="legalRepresentative.name">
            <el-input v-model="formData.legalRepresentative.name" placeholder="请输入法人姓名" clearable />
          </el-form-item>

          <el-form-item label="法人身份证号" prop="legalRepresentative.idCard">
            <el-input v-model="formData.legalRepresentative.idCard" placeholder="请输入法人身份证号" clearable />
          </el-form-item>

          <el-form-item label="法人手机号" prop="legalRepresentative.phone">
            <el-input v-model="formData.legalRepresentative.phone" placeholder="请输入法人手机号" clearable />
          </el-form-item>
        </el-form>
      </div>

      <div v-show="currentStep === 2" class="step-content">
        <el-form ref="certFormRef" :model="formData" :rules="certRules" label-width="120px" size="large">
          <el-form-item label="营业执照号" prop="businessLicense.number">
            <el-input
              v-model="formData.businessLicense.number"
              placeholder="请输入 15 位或 18 位营业执照号"
              clearable
            />
          </el-form-item>

          <el-form-item label="营业执照" prop="businessLicense.url">
            <el-upload
              :http-request="(options) => customUpload(options, 'businessLicense.url')"
              :before-upload="beforeUpload"
              :show-file-list="false"
              accept="image/*"
              name="file"
            >
              <el-button type="primary" :loading="uploading">
                <el-icon style="margin-right: 4px">
                  <Upload />
                </el-icon>
                {{ uploading ? '上传中...' : '上传营业执照' }}
              </el-button>
              <template #tip>
                <div class="el-upload__tip">仅支持图片格式，大小不超过 5MB</div>
              </template>
            </el-upload>

            <div v-if="formData.businessLicense.url" class="uploaded-preview">
              <el-image
                :src="getImageUrl(formData.businessLicense.url)"
                fit="cover"
                style="width: 120px; height: 120px; margin-top: 10px; border-radius: 4px"
                :preview-src-list="[getImageUrl(formData.businessLicense.url)]"
              />
              <el-button type="danger" link style="margin-left: 10px; vertical-align: top" @click="clearFile('businessLicense')">
                删除图片
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="道路运输许可证号">
            <el-input v-model="formData.transportLicense.number" placeholder="选填" clearable />
          </el-form-item>

          <el-form-item label="道路运输许可证">
            <el-upload
              :http-request="(options) => customUpload(options, 'transportLicense.url')"
              :before-upload="beforeUpload"
              :show-file-list="false"
              accept="image/*"
              name="file"
            >
              <el-button type="primary" plain :loading="uploading">上传许可证</el-button>
            </el-upload>

            <div v-if="formData.transportLicense.url" class="uploaded-preview">
              <el-image
                :src="getImageUrl(formData.transportLicense.url)"
                fit="cover"
                style="width: 120px; height: 120px; margin-top: 10px; border-radius: 4px"
                :preview-src-list="[getImageUrl(formData.transportLicense.url)]"
              />
              <el-button type="danger" link style="margin-left: 10px; vertical-align: top" @click="clearFile('transportLicense')">
                删除图片
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div v-show="currentStep === 3" class="step-content">
        <el-form ref="accountFormRef" :model="formData" :rules="accountRules" label-width="120px" size="large">
          <el-alert
            title="是否直接审核通过"
            type="info"
            :closable="false"
            class="form-section-alert"
          >
            勾选后会自动创建车队管理员账号，登录账号默认使用管理员手机号。
          </el-alert>

          <el-form-item label="直接审核">
            <el-switch v-model="formData.directApprove" />
          </el-form-item>

          <template v-if="formData.directApprove">
            <el-form-item label="登录账号" prop="createdBy.username">
              <el-input v-model="formData.createdBy.username" placeholder="根据管理员手机号自动生成" disabled />
            </el-form-item>

            <el-form-item label="管理员姓名" prop="createdBy.name">
              <el-input v-model="formData.createdBy.name" placeholder="请输入管理员姓名" clearable />
            </el-form-item>

            <el-form-item label="管理员手机" prop="createdBy.phone">
              <el-input v-model="formData.createdBy.phone" placeholder="请输入管理员手机号" clearable />
            </el-form-item>
          </template>

          <el-alert
            v-else
            title="未勾选直接审核"
            type="warning"
            :closable="false"
          >
            当前将以“待审核”状态提交，车队管理员账号不会自动创建。
          </el-alert>
        </el-form>
      </div>

      <div class="form-actions">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-else @click="$router.back()">返回</el-button>

        <el-button v-if="currentStep < LAST_STEP" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-else type="primary" :loading="submitting" @click="handleSubmit">提交注册</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { OfficeBuilding, Upload } from '@element-plus/icons-vue'
import axios from 'axios'
import request from '@/utils/request'
import {
  buildBusinessLicenseNumberRules,
  buildCreditCodeRules,
  buildIdCardRules,
  buildPhoneRules,
  isValidPhone,
  normalizeBusinessLicenseNumber,
  normalizeCreditCode,
  normalizeIdCard,
  normalizePhone,
  trimValue
} from '@/utils/formValidators'

const router = useRouter()
const LAST_STEP = 3

const currentStep = ref(0)
const submitting = ref(false)
const uploading = ref(false)

const basicFormRef = ref(null)
const legalFormRef = ref(null)
const certFormRef = ref(null)
const accountFormRef = ref(null)

const formData = reactive({
  name: '',
  fleetType: 'logistics_company',
  creditCode: '',
  businessScope: '',
  contact: {
    name: '',
    phone: '',
    email: ''
  },
  address: {
    detail: ''
  },
  legalRepresentative: {
    name: '',
    idCard: '',
    phone: ''
  },
  businessLicense: {
    number: '',
    url: ''
  },
  transportLicense: {
    number: '',
    url: ''
  },
  otherCertificates: [],
  vehicles: [],
  createdBy: {
    username: '',
    name: '',
    phone: ''
  },
  directApprove: false
})

function validateRequiredText(message, condition) {
  return (_rule, value, callback) => {
    if (!condition()) {
      callback()
      return
    }

    if (!trimValue(value)) {
      callback(new Error(message))
      return
    }

    callback()
  }
}

function validateConditionalPhone(requiredMessage, invalidMessage, condition) {
  return (_rule, value, callback) => {
    if (!condition()) {
      callback()
      return
    }

    const normalizedValue = normalizePhone(value)
    if (!normalizedValue) {
      callback(new Error(requiredMessage))
      return
    }

    if (!isValidPhone(normalizedValue)) {
      callback(new Error(invalidMessage))
      return
    }

    callback()
  }
}

const basicRules = {
  name: [{ required: true, message: '请输入车队名称', trigger: 'blur' }],
  fleetType: [{ required: true, message: '请选择车队类型', trigger: 'change' }],
  creditCode: buildCreditCodeRules({
    requiredMessage: '请输入统一社会信用代码',
    invalidMessage: '请输入正确的统一社会信用代码'
  }),
  businessScope: [{ required: true, message: '请输入经营范围', trigger: 'blur' }],
  'contact.name': [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  'contact.phone': buildPhoneRules({
    requiredMessage: '请输入联系电话',
    invalidMessage: '请输入正确的联系电话'
  }),
  'address.detail': [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const legalRules = {
  'legalRepresentative.name': [{ required: true, message: '请输入法人姓名', trigger: 'blur' }],
  'legalRepresentative.idCard': buildIdCardRules({
    requiredMessage: '请输入法人身份证号',
    invalidMessage: '请输入正确的法人身份证号'
  }),
  'legalRepresentative.phone': buildPhoneRules({
    requiredMessage: '请输入法人手机号',
    invalidMessage: '请输入正确的法人手机号'
  })
}

const certRules = {
  'businessLicense.number': buildBusinessLicenseNumberRules({
    requiredMessage: '请输入营业执照号',
    invalidMessage: '请输入正确的营业执照号'
  }),
  'businessLicense.url': [{ required: true, message: '请上传营业执照', trigger: 'change' }]
}

const accountRules = {
  'createdBy.username': [{
    validator: validateConditionalPhone(
      '请先填写管理员手机号',
      '登录账号需为手机号',
      () => formData.directApprove
    ),
    trigger: 'blur'
  }],
  'createdBy.name': [{
    validator: validateRequiredText('请输入管理员姓名', () => formData.directApprove),
    trigger: 'blur'
  }],
  'createdBy.phone': [{
    validator: validateConditionalPhone(
      '请输入管理员手机号',
      '请输入正确的管理员手机号',
      () => formData.directApprove
    ),
    trigger: 'blur'
  }]
}

watch(
  () => formData.createdBy.phone,
  (phone) => {
    formData.createdBy.phone = normalizePhone(phone)
    formData.createdBy.username = normalizePhone(phone)
  }
)

function getImageUrl(url) {
  if (!url) {
    return ''
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  if (url.startsWith('/uploads') || url.startsWith('/public')) {
    return `/api${url}`
  }

  return url
}

function setNestedValue(path, value) {
  const keys = path.split('.')
  if (keys.length !== 2) {
    return
  }

  formData[keys[0]][keys[1]] = value
}

function clearFile(type) {
  if (type === 'businessLicense') {
    formData.businessLicense.url = ''
  }

  if (type === 'transportLicense') {
    formData.transportLicense.url = ''
  }
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只允许上传图片文件')
    return false
  }

  if (!isLt5M) {
    ElMessage.error('上传文件大小不能超过 5MB')
    return false
  }

  return true
}

async function customUpload(options, field) {
  const { file, onSuccess, onError } = options

  try {
    uploading.value = true

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    const response = await axios.post('/api/upload', uploadFormData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    const result = response.data
    if (!result?.success || !result?.data?.url) {
      throw new Error(result?.message || '上传失败')
    }

    setNestedValue(field, result.data.url)
    ElMessage.success('上传成功')
    onSuccess?.(result, file)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '上传失败')
    onError?.(error)
  } finally {
    uploading.value = false
  }
}

function normalizePayload() {
  formData.creditCode = normalizeCreditCode(formData.creditCode)
  formData.contact.phone = normalizePhone(formData.contact.phone)
  formData.legalRepresentative.idCard = normalizeIdCard(formData.legalRepresentative.idCard)
  formData.legalRepresentative.phone = normalizePhone(formData.legalRepresentative.phone)
  formData.businessLicense.number = normalizeBusinessLicenseNumber(formData.businessLicense.number)
  formData.createdBy.phone = normalizePhone(formData.createdBy.phone)
  formData.createdBy.username = normalizePhone(formData.createdBy.phone)
}

async function nextStep() {
  const formRefs = [basicFormRef, legalFormRef, certFormRef, accountFormRef]
  const currentFormRef = formRefs[currentStep.value]?.value

  if (!currentFormRef) {
    currentStep.value += 1
    return
  }

  normalizePayload()

  try {
    await currentFormRef.validate()
    currentStep.value += 1
  } catch {
    ElMessage.error('请先修正当前步骤中的表单校验错误')
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

async function handleSubmit() {
  try {
    submitting.value = true
    normalizePayload()

    await basicFormRef.value?.validate()
    await legalFormRef.value?.validate()
    await certFormRef.value?.validate()
    await accountFormRef.value?.validate()

    const response = await request({
      url: '/fleets/register',
      method: 'post',
      data: formData
    })

    if (!response?.success) {
      throw new Error(response?.message || '车队注册失败')
    }

    ElMessage.success(response.message || '车队注册成功')
    setTimeout(() => {
      router.push('/fleets')
    }, 1200)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '车队注册失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.fleet-register-page {
  padding: 20px;
}

.page-card {
  margin-top: 20px;
}

.page-header-content {
  display: flex;
  align-items: center;
}

.page-alert,
.form-section-alert {
  margin-bottom: 20px;
}

.steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 320px;
  padding: 20px 0;
}

.form-actions {
  margin-top: 40px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.form-actions .el-button {
  min-width: 100px;
  margin: 0 10px;
}

.uploaded-preview {
  display: inline-flex;
  align-items: flex-start;
}
</style>
