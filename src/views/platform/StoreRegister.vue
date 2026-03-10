<template>
  <div class="store-register-page">
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
            <Shop />
          </el-icon>
          <span class="text-large font-600">门店注册</span>
        </div>
      </template>
    </el-page-header>

    <el-card style="margin-top: 20px">
      <el-alert
        title="提示"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        门店注册采用简化流程，仅需填写必要信息即可完成注册。其他详细信息（如服务能力、定价等）可由门店管理员在后台自行补充。
      </el-alert>

      <!-- 步骤条 -->
      <el-steps
        :active="currentStep"
        finish-status="success"
        align-center
        style="margin-bottom: 30px"
      >
        <el-step title="基本信息" />
        <el-step title="资质信息" />
        <el-step title="结算信息" />
        <el-step title="管理员账号" />
      </el-steps>

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
            label="门店名称"
            prop="name"
          >
            <el-input
              v-model="formData.name"
              placeholder="请输入门店名称"
              clearable
            />
          </el-form-item>

          <el-form-item
            label="门店类型"
            prop="storeType"
          >
            <el-select
              v-model="formData.storeType"
              placeholder="请选择门店类型"
              style="width: 100%"
            >
              <el-option
                label="综合维修厂"
                value="comprehensive"
              />
              <el-option
                label="专修店"
                value="specialized"
              />
              <el-option
                label="4S店授权店"
                value="authorized_4s"
              />
              <el-option
                label="快修店"
                value="quick_service"
              />
              <el-option
                label="连锁门店"
                value="chain"
              />
            </el-select>
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
            label="联系电话"
            prop="contact.phone"
          >
            <el-input
              v-model="formData.contact.phone"
              placeholder="请输入联系电话"
              clearable
            />
          </el-form-item>

          <el-form-item label="备用联系电话">
            <el-input
              v-model="formData.contact.backupPhone"
              placeholder="选填，请输入备用联系电话"
              clearable
            />
          </el-form-item>

          <el-form-item
            label="详细地址"
            prop="address.detail"
          >
            <el-input
              v-model="formData.address.detail"
              type="textarea"
              :rows="2"
              placeholder="请输入详细地址"
            />
          </el-form-item>

          <el-form-item
            label="营业时间"
            prop="businessHours"
          >
            <el-input
              v-model="formData.businessHours"
              placeholder="如：8:00-18:00"
              clearable
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：资质信息 -->
      <div
        v-show="currentStep === 1"
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
            required
          >
            <el-input
              v-model="formData.businessLicense.number"
              placeholder="请输入统一社会信用代码/营业执照号码"
              clearable
            />
          </el-form-item>

          <el-form-item
            label="营业执照照片"
            prop="businessLicense.url"
            required
          >
            <el-upload
              :http-request="(options) => customUpload(options, 'businessLicense.url')"
              :before-upload="beforeUpload"
              :show-file-list="false"
              accept="image/*"
              name="file"
            >
              <el-button
                type="primary"
                :loading="uploading"
              >
                <el-icon style="margin-right: 4px">
                  <Upload />
                </el-icon>
                {{ uploading ? '上传中...' : '点击上传' }}
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
                :src="formData.businessLicense.url"
                fit="cover"
                style="width: 120px; height: 120px; margin-top: 10px; border-radius: 4px"
                :preview-src-list="[formData.businessLicense.url]"
              />
              <el-button
                type="danger"
                size="small"
                link
                style="margin-left: 10px; vertical-align: top"
                @click="formData.businessLicense.url = ''"
              >
                删除
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤3：结算信息 -->
      <div
        v-show="currentStep === 2"
        class="step-content"
      >
        <el-form
          ref="settlementFormRef"
          :model="formData"
          :rules="settlementRules"
          label-width="140px"
          size="large"
        >
          <el-form-item
            label="开户银行"
            prop="bankAccount.bankName"
          >
            <el-input
              v-model="formData.bankAccount.bankName"
              placeholder="请输入开户银行"
              clearable
            />
          </el-form-item>

          <el-form-item
            label="银行账号"
            prop="bankAccount.accountNumber"
          >
            <el-input
              v-model="formData.bankAccount.accountNumber"
              placeholder="请输入银行账号"
              clearable
            />
          </el-form-item>

          <el-form-item
            label="开户名称"
            prop="bankAccount.accountName"
          >
            <el-input
              v-model="formData.bankAccount.accountName"
              placeholder="请输入开户名称"
              clearable
            />
          </el-form-item>

          <el-form-item label="结算周期">
            <el-radio-group v-model="formData.bankAccount.settlementCycle">
              <el-radio value="monthly">
                月结
              </el-radio>
              <el-radio value="quarterly">
                季结
              </el-radio>
              <el-radio value="per_order">
                单笔结算
              </el-radio>
            </el-radio-group>
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
            title="管理员账号信息"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            请填写门店管理员账号信息，注册成功后将自动创建登录账号。
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
              开启后门店将直接进入正常运营状态，无需等待审核
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button
          v-if="currentStep > 0"
          @click="prevStep"
        >
          上一步
        </el-button>
        <el-button
          v-else
          @click="$router.back()"
        >
          取消
        </el-button>
        <el-button
          v-if="currentStep < 3"
          type="primary"
          @click="nextStep"
        >
          下一步
        </el-button>
        <el-button
          v-else
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
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Shop, Upload } from '@element-plus/icons-vue'
import request from '@/utils/request'
import axios from 'axios'

const router = useRouter()
const currentStep = ref(0)
const submitting = ref(false)
const uploading = ref(false)

// 表单引用
const basicFormRef = ref(null)
const certFormRef = ref(null)
const settlementFormRef = ref(null)
const accountFormRef = ref(null)

// 表单数据（简化版）
const formData = reactive({
  name: '',
  storeType: 'comprehensive',
  contact: {
    name: '',
    phone: '',
    backupPhone: ''
  },
  address: {
    detail: ''
  },
  businessHours: '8:00-18:00',
  serviceRange: 50,
  businessLicense: {
    number: '',
    url: ''
  },
  // 保留这些字段以兼容后端，但前端不再展示
  organizationCode: { number: '', url: '' },
  transportLicense: { number: '', url: '' },
  repairLicense: { number: '', url: '' },
  serviceCapabilities: {
    serviceTypes: [],
    brandSpecialties: [],
    mainModels: [],
    staffing: {
      seniorTechnicians: 0,
      technicians: 0,
      workers: 0,
      apprentices: 0
    },
    dailyCapacity: {
      maxOrders: 10,
      averageDuration: 120
    }
  },
  pricingInfo: {
    laborRates: {
      minorRepair: 0,
      mediumRepair: 0,
      majorRepair: 0
    },
    serviceFee: 0,
    additionalFeeNote: ''
  },
  bankAccount: {
    bankName: '',
    accountNumber: '',
    accountName: '',
    settlementCycle: 'monthly'
  },
  createdBy: {
    username: '',
    name: '',
    phone: ''
  },
  directApprove: false
})

// 验证规则
const basicRules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  storeType: [{ required: true, message: '请选择门店类型', trigger: 'change' }],
  'contact.name': [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  'contact.phone': [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  'address.detail': [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  businessHours: [{ required: true, message: '请输入营业时间', trigger: 'blur' }]
}

const certRules = {
  'businessLicense.number': [{ required: true, message: '请输入营业执照号码', trigger: 'blur' }],
  'businessLicense.url': [{ required: true, message: '请上传营业执照照片', trigger: 'change' }]
}

const settlementRules = {
  'bankAccount.bankName': [{ required: true, message: '请输入开户银行', trigger: 'blur' }],
  'bankAccount.accountNumber': [{ required: true, message: '请输入银行账号', trigger: 'blur' }],
  'bankAccount.accountName': [{ required: true, message: '请输入开户名称', trigger: 'blur' }]
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

watch(
  () => formData.createdBy.phone,
  (phone) => {
    formData.createdBy.username = phone ? phone.trim() : ''
  }
)

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
  return true
}

// 自定义上传方法
const customUpload = async (options, field) => {
  const { file, onSuccess, onError } = options

  try {
    uploading.value = true

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    const axiosResponse = await axios.post('/api/upload', uploadFormData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    uploading.value = false

    const response = axiosResponse.data

    if (response && response.success) {
      const keys = field.split('.')
      if (keys.length === 2) {
        formData[keys[0]][keys[1]] = response.data.url
      }
      ElMessage.success('上传成功')
      onSuccess(response, file)
    } else {
      onError(new Error(response?.message || '上传失败'))
    }
  } catch (error) {
    console.error('上传错误:', error)
    uploading.value = false
    ElMessage.error(error.response?.data?.message || '上传失败，请重试')
    onError(error)
  }
}

// 下一步
const nextStep = async () => {
  const formRefs = [basicFormRef, certFormRef, settlementFormRef]
  const currentRef = formRefs[currentStep.value]

  if (currentRef.value) {
    try {
      await currentRef.value.validate()
      currentStep.value++
    } catch (validationError) {
      const firstError = Object.values(validationError)[0]?.[0]?.message || '请检查填写内容'
      ElMessage.error({
        message: firstError,
        duration: 3000,
        showClose: true
      })
    }
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 提交注册
const handleSubmit = async () => {
  try {
    submitting.value = true
    formData.createdBy.username = formData.createdBy.phone.trim()

    // 验证最后一步
    if (accountFormRef.value) {
      try {
        await accountFormRef.value.validate()
      } catch (validationError) {
        const firstError = Object.values(validationError)[0]?.[0]?.message || '请检查填写内容'
        ElMessage.error({
          message: firstError,
          duration: 3000,
          showClose: true
        })
        return
      }
    }

    // 所有验证通过，提交表单
    const res = await request({
      url: '/stores/register',
      method: 'post',
      data: formData
    })

    if (res.success) {
      ElMessage.success(res.message || '门店注册成功')
      setTimeout(() => {
        router.push('/stores')
      }, 1500)
    } else {
      ElMessage.error(res.message || '门店注册失败')
    }
  } catch (error) {
    console.error('门店注册失败:', error)
    ElMessage.error({
      message: error.response?.data?.message || error.message || '门店注册失败，请稍后重试',
      duration: 3000,
      showClose: true
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.store-register-page {
  padding: 20px;
}

.page-header-content {
  display: flex;
  align-items: center;
}

.step-content {
  min-height: 300px;
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
  align-items: center;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

/* 步骤条样式优化 */
:deep(.el-steps) {
  margin-bottom: 30px;
}

:deep(.el-step__title) {
  font-size: 14px;
}
</style>
