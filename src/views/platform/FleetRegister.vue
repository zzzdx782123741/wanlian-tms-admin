<template>
  <div class="fleet-register-page">
    <el-page-header
      title="返回"
      @back="$router.back()"
    >
      <template #content>
        <div class="page-header-content">
          <el-icon
            :size="20"
            style="margin-right: 8px"
          >
            <OfficeBuilding />
          </el-icon>
          <span class="text-large font-600">车队注册</span>
        </div>
      </template>
    </el-page-header>

    <el-card style="margin-top: 20px">
      <el-steps
        :active="currentStep"
        finish-status="success"
        align-center
        style="margin-bottom: 30px"
      >
        <el-step title="基本信息" />
        <el-step title="法人信息" />
        <el-step title="资质材料" />
        <el-step title="管理员账号" />
        <el-step title="确认提交" />
      </el-steps>

      <div class="form-container">
        <!-- 步骤1：基本信息 -->
        <div
          v-show="currentStep === 0"
          class="step-content"
        >
          <el-form
            ref="basicFormRef"
            :model="formData"
            :rules="basicRules"
            label-width="140px"
            size="large"
          >
            <el-form-item
              label="车队名称"
              prop="name"
            >
              <el-input
                v-model="formData.name"
                placeholder="请输入车队名称"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="车队类型"
              prop="fleetType"
            >
              <el-radio-group v-model="formData.fleetType">
                <el-radio label="logistics_company">
                  物流公司
                </el-radio>
                <el-radio label="individual_operator">
                  运输个体户
                </el-radio>
                <el-radio label="other">
                  其他企业
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              label="统一社会信用代码"
              prop="creditCode"
            >
              <el-input
                v-model="formData.creditCode"
                placeholder="请输入18位统一社会信用代码"
                maxlength="18"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="经营范围"
              prop="businessScope"
            >
              <el-input
                v-model="formData.businessScope"
                type="textarea"
                :rows="3"
                placeholder="请简要描述经营范围"
              />
            </el-form-item>

            <el-form-item
              label="联系人姓名"
              prop="contact.name"
            >
              <el-input
                v-model="formData.contact.name"
                placeholder="请输入联系人姓名"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="联系人电话"
              prop="contact.phone"
            >
              <el-input
                v-model="formData.contact.phone"
                placeholder="请输入联系人电话"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="邮箱地址"
              prop="contact.email"
            >
              <el-input
                v-model="formData.contact.email"
                placeholder="请输入邮箱地址"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="详细地址"
              prop="address.detail"
            >
              <el-input
                v-model="formData.address.detail"
                placeholder="请输入详细地址"
                clearable
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤2：法人信息 -->
        <div
          v-show="currentStep === 1"
          class="step-content"
        >
          <el-form
            ref="legalFormRef"
            :model="formData"
            :rules="legalRules"
            label-width="140px"
            size="large"
          >
            <el-form-item
              label="法人代表姓名"
              prop="legalRepresentative.name"
            >
              <el-input
                v-model="formData.legalRepresentative.name"
                placeholder="请输入法人代表姓名"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="法人身份证号"
              prop="legalRepresentative.idCard"
            >
              <el-input
                v-model="formData.legalRepresentative.idCard"
                placeholder="请输入法人身份证号"
                maxlength="18"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="法人手机号"
              prop="legalRepresentative.phone"
            >
              <el-input
                v-model="formData.legalRepresentative.phone"
                placeholder="请输入法人手机号"
                clearable
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤3：资质材料 -->
        <div
          v-show="currentStep === 2"
          class="step-content"
        >
          <el-form
            ref="certFormRef"
            :model="formData"
            :rules="certRules"
            label-width="140px"
            size="large"
          >
            <el-form-item
              label="营业执照号码"
              prop="businessLicense.number"
            >
              <el-input
                v-model="formData.businessLicense.number"
                placeholder="请输入营业执照号码"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="营业执照照片"
              prop="businessLicense.url"
            >
              <el-upload
                :http-request="(options) => customUpload(options, 'businessLicense.url')"
                :on-error="handleUploadError"
                :before-upload="beforeUpload"
                :show-file-list="false"
                accept="image/*"
                name="file"
              >
                <el-button
                  type="primary"
                  :loading="uploading"
                >
                  <el-icon><Upload /></el-icon>
                  点击上传
                </el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    支持jpg/png格式，大小不超过5MB
                  </div>
                </template>
              </el-upload>
              <div
                v-if="formData.businessLicense.url"
                class="uploaded-preview"
              >
                <el-image
                  :src="getImageUrl(formData.businessLicense.url)"
                  fit="cover"
                  style="width: 100px; height: 100px; margin-top: 10px"
                  :preview-src-list="[getImageUrl(formData.businessLicense.url)]"
                />
                <el-button
                  type="danger"
                  size="small"
                  style="margin-left: 10px"
                  @click="removeImage('businessLicense')"
                >
                  删除
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="道路运输许可证号">
              <el-input
                v-model="formData.transportLicense.number"
                placeholder="选填，如有请填写"
                clearable
              />
            </el-form-item>

            <el-form-item label="道路运输许可证">
              <el-upload
                :http-request="(options) => customUpload(options, 'transportLicense.url')"
                :on-error="handleUploadError"
                :before-upload="beforeUpload"
                :show-file-list="false"
                accept="image/*"
                name="file"
              >
                <el-button
                  type="primary"
                  :loading="uploading"
                >
                  <el-icon><Upload /></el-icon>
                  点击上传
                </el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    选填，支持jpg/png格式，大小不超过5MB
                  </div>
                </template>
              </el-upload>
              <div
                v-if="formData.transportLicense.url"
                class="uploaded-preview"
              >
                <el-image
                  :src="getImageUrl(formData.transportLicense.url)"
                  fit="cover"
                  style="width: 100px; height: 100px; margin-top: 10px"
                  :preview-src-list="[getImageUrl(formData.transportLicense.url)]"
                />
                <el-button
                  type="danger"
                  size="small"
                  style="margin-left: 10px"
                  @click="removeImage('transportLicense')"
                >
                  删除
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤4：管理员账号 -->
        <div
          v-show="currentStep === 3"
          class="step-content"
        >
          <el-form
            ref="accountFormRef"
            :model="formData"
            :rules="accountRules"
            label-width="140px"
            size="large"
          >
            <el-alert
              title="提示"
              type="info"
              :closable="false"
              style="margin-bottom: 20px"
            >
              请填写车队管理员账号信息，注册成功后将通过短信发送登录账号和初始密码
            </el-alert>

            <el-form-item
              label="登录账号"
              prop="createdBy.username"
            >
              <el-input
                v-model="formData.createdBy.username"
                placeholder="请输入登录账号（手机号）"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="管理员姓名"
              prop="createdBy.name"
            >
              <el-input
                v-model="formData.createdBy.name"
                placeholder="请输入管理员姓名"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="手机号码"
              prop="createdBy.phone"
            >
              <el-input
                v-model="formData.createdBy.phone"
                placeholder="请输入手机号码"
                clearable
              />
            </el-form-item>

            <el-form-item label="直接审核通过">
              <el-switch v-model="formData.directApprove" />
              <div class="form-tip">
                开启后车队将直接进入正常运营状态，无需等待审核
              </div>
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤5：确认提交 -->
        <div
          v-show="currentStep === 4"
          class="step-content"
        >
          <el-descriptions
            title="车队信息确认"
            :column="2"
            border
          >
            <el-descriptions-item label="车队名称">
              {{ formData.name }}
            </el-descriptions-item>
            <el-descriptions-item label="车队类型">
              {{ getFleetTypeText(formData.fleetType) }}
            </el-descriptions-item>
            <el-descriptions-item label="统一社会信用代码">
              {{ formData.creditCode }}
            </el-descriptions-item>
            <el-descriptions-item label="法人代表">
              {{ formData.legalRepresentative.name }}
            </el-descriptions-item>
            <el-descriptions-item label="法人身份证">
              {{ formData.legalRepresentative.idCard }}
            </el-descriptions-item>
            <el-descriptions-item label="法人手机">
              {{ formData.legalRepresentative.phone }}
            </el-descriptions-item>
            <el-descriptions-item label="联系人">
              {{ formData.contact.name }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ formData.contact.phone }}
            </el-descriptions-item>
            <el-descriptions-item
              label="详细地址"
              :span="2"
            >
              {{ formData.address.detail }}
            </el-descriptions-item>
            <el-descriptions-item label="营业执照号码">
              {{ formData.businessLicense.number }}
            </el-descriptions-item>
            <el-descriptions-item label="管理员账号">
              {{ formData.createdBy.username }}
            </el-descriptions-item>
            <el-descriptions-item label="管理员姓名">
              {{ formData.createdBy.name }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号码">
              {{ formData.createdBy.phone }}
            </el-descriptions-item>
            <el-descriptions-item
              label="直接审核通过"
              :span="2"
            >
              <el-tag :type="formData.directApprove ? 'success' : 'info'">
                {{ formData.directApprove ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="step-actions">
        <el-button
          v-if="currentStep > 0"
          @click="handlePrev"
        >
          上一步
        </el-button>
        <el-button
          v-if="currentStep < 4"
          type="primary"
          @click="handleNext"
        >
          下一步
        </el-button>
        <el-button
          v-if="currentStep === 4"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交注册
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { OfficeBuilding, Upload } from '@element-plus/icons-vue'
import request from '@/utils/request'
import axios from 'axios'

const router = useRouter()
const currentStep = ref(0)
const submitting = ref(false)
const uploading = ref(false)

// 自定义上传方法
const customUpload = async (options, field) => {
  const { file, onSuccess, onError } = options

  try {
    uploading.value = true

    // 创建FormData
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    // 使用axios直接发送请求，获取完整的响应对象
    const axiosResponse = await axios.post('/api/upload', uploadFormData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('上传Axios响应:', axiosResponse)
    console.log('响应数据:', axiosResponse.data)
    console.log('字段:', field)

    uploading.value = false

    // axiosResponse.data 是后端返回的数据
    const response = axiosResponse.data

    if (response && response.success) {
      // 直接更新 formData
      const keys = field.split('.')
      if (keys.length === 2) {
        formData[keys[0]][keys[1]] = response.data.url
      }
      ElMessage.success('上传成功')
      // 调用 onSuccess 让 el-upload 知道上传成功
      onSuccess(response, file)
    } else {
      onError(new Error(response?.message || '上传失败'))
    }
  } catch (error) {
    console.error('上传错误:', error)
    uploading.value = false
    onError(error)
  }
}

// 表单数据
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
  createdBy: {
    username: '',
    name: '',
    phone: ''
  },
  directApprove: false
})

// 表单引用
const basicFormRef = ref(null)
const legalFormRef = ref(null)
const certFormRef = ref(null)
const accountFormRef = ref(null)

// 验证规则
const basicRules = {
  name: [{ required: true, message: '请输入车队名称', trigger: 'blur' }],
  fleetType: [{ required: true, message: '请选择车队类型', trigger: 'change' }],
  creditCode: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '请输入正确的统一社会信用代码', trigger: 'blur' }
  ],
  'contact.name': [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  'contact.phone': [
    { required: true, message: '请输入联系人电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  'address.detail': [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const legalRules = {
  'legalRepresentative.name': [{ required: true, message: '请输入法人代表姓名', trigger: 'blur' }],
  'legalRepresentative.idCard': [
    { required: true, message: '请输入法人身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  'legalRepresentative.phone': [
    { required: true, message: '请输入法人手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const certRules = {
  'businessLicense.number': [{ required: true, message: '请输入营业执照号码', trigger: 'blur' }],
  'businessLicense.url': [{ required: true, message: '请上传营业执照照片', trigger: 'change' }]
}

const accountRules = {
  'createdBy.username': [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '登录账号必须是手机号', trigger: 'blur' }
  ],
  'createdBy.name': [{ required: true, message: '请输入管理员姓名', trigger: 'blur' }],
  'createdBy.phone': [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 上传前验证
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB!')
    return false
  }
  uploading.value = true
  return true
}

// 上传成功
const handleUploadSuccess = (response, field) => {
  console.log('上传响应:', response)
  console.log('响应类型:', typeof response)
  uploading.value = false

  // Element Plus 的 el-upload 可能会自动解析 JSON
  // 也可能返回字符串，需要处理这两种情况
  let res = response
  if (typeof response === 'string') {
    try {
      res = JSON.parse(response)
    } catch (e) {
      console.error('解析响应失败:', e)
      ElMessage.error('上传失败：响应格式错误')
      return
    }
  }

  console.log('处理后的响应:', res)

  if (res && res.success) {
    // 支持嵌套字段设置，如 'businessLicense.url'
    const keys = field.split('.')
    if (keys.length === 2) {
      formData[keys[0]][keys[1]] = res.data.url
      console.log(`设置 ${field} = ${res.data.url}`)
    }
    ElMessage.success('上传成功')
  } else {
    console.error('上传失败响应:', res)
    ElMessage.error(res?.message || '上传失败')
  }
}

// 上传失败
const handleUploadError = (error) => {
  uploading.value = false
  console.error('上传错误:', error)
  console.error('错误类型:', typeof error)
  console.error('错误消息:', error.message)

  // 尝试解析错误信息
  let errorMsg = '上传失败，请重试'
  if (error && error.message) {
    errorMsg = error.message
  } else if (error && error.toString) {
    errorMsg = error.toString()
  }

  // 检查是否是网络错误
  if (error && error.message && error.message.includes('Network Error')) {
    errorMsg = '网络错误，请检查后端服务是否启动'
  }

  ElMessage.error(errorMsg)
}

// 获取图片完整URL
const getImageUrl = (url) => {
  if (!url) return ''
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 在开发环境中，通过 /api 前缀访问后端静态资源
  // 例如：/uploads/xxx.jpg -> /api/uploads/xxx.jpg
  if (url.startsWith('/uploads') || url.startsWith('/public')) {
    return '/api' + url
  }
  // 其他情况直接返回
  return url
}

// 删除图片
const removeImage = (type) => {
  if (type === 'businessLicense') {
    formData.businessLicense.url = ''
  } else if (type === 'transportLicense') {
    formData.transportLicense.url = ''
  }
  ElMessage.success('已删除')
}

// 下一步
const handleNext = async () => {
  let formRef = null
  switch (currentStep.value) {
  case 0:
    formRef = basicFormRef.value
    break
  case 1:
    formRef = legalFormRef.value
    break
  case 2:
    formRef = certFormRef.value
    break
  case 3:
    formRef = accountFormRef.value
    break
  }

  if (!formRef) {
    currentStep.value++
    return
  }

  await formRef.validate((valid) => {
    if (valid) {
      currentStep.value++
    }
  })
}

// 上一步
const handlePrev = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 提交注册
const handleSubmit = async () => {
  try {
    submitting.value = true

    const res = await request({
      url: '/fleets/register',
      method: 'post',
      data: formData
    })

    if (res.success) {
      ElMessage.success(res.message || '车队注册成功')
      setTimeout(() => {
        router.push('/fleets')
      }, 1500)
    } else {
      ElMessage.error(res.message || '车队注册失败')
    }
  } catch (error) {
    console.error('车队注册失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '车队注册失败')
  } finally {
    submitting.value = false
  }
}

// 获取车队类型文本
const getFleetTypeText = (type) => {
  const map = {
    logistics_company: '物流公司',
    individual_operator: '运输个体户',
    other: '其他企业'
  }
  return map[type] || type
}
</script>

<style scoped>
.fleet-register-page {
  padding: 20px;
}

.page-header-content {
  display: flex;
  align-items: center;
}

.form-container {
  min-height: 400px;
  padding: 20px 0;
}

.step-content {
  max-width: 800px;
  margin: 0 auto;
}

.step-actions {
  margin-top: 40px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.uploaded-preview {
  margin-top: 10px;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>
