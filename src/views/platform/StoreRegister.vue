<template>
  <div class="store-register-page">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <div class="page-header-content">
          <el-icon :size="20" style="margin-right: 8px"><Shop /></el-icon>
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
        门店注册包含多个步骤，请按要求填写完整信息。标有 * 的字段为必填项。
      </el-alert>

      <el-tabs v-model="activeTab" type="card">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="basicFormRef"
            :model="formData"
            :rules="basicRules"
            label-width="140px"
            size="large"
          >
            <el-form-item label="门店名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入门店名称" clearable />
            </el-form-item>

            <el-form-item label="门店类型" prop="storeType">
              <el-select v-model="formData.storeType" placeholder="请选择门店类型">
                <el-option label="综合维修厂" value="comprehensive" />
                <el-option label="专修店" value="specialized" />
                <el-option label="4S店授权店" value="authorized_4s" />
                <el-option label="快修店" value="quick_service" />
                <el-option label="连锁门店" value="chain" />
              </el-select>
            </el-form-item>

            <el-form-item label="联系人姓名" prop="contact.name">
              <el-input v-model="formData.contact.name" placeholder="请输入联系人姓名" clearable />
            </el-form-item>

            <el-form-item label="联系电话" prop="contact.phone">
              <el-input
                v-model="formData.contact.phone"
                placeholder="请输入联系电话"
                clearable
              />
            </el-form-item>

            <el-form-item label="备用联系电话">
              <el-input
                v-model="formData.contact.backupPhone"
                placeholder="请输入备用联系电话"
                clearable
              />
            </el-form-item>

            <el-form-item label="详细地址" prop="address.detail">
              <el-input
                v-model="formData.address.detail"
                type="textarea"
                :rows="2"
                placeholder="请输入详细地址"
              />
            </el-form-item>

            <el-form-item label="营业时间" prop="businessHours">
              <el-input v-model="formData.businessHours" placeholder="如：8:00-18:00" clearable />
            </el-form-item>

            <el-form-item label="服务范围（公里）">
              <el-input-number v-model="formData.serviceRange" :min="1" :max="200" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 资质信息 -->
        <el-tab-pane label="资质信息" name="certificate">
          <el-form
            ref="certFormRef"
            :model="formData"
            :rules="certRules"
            label-width="140px"
            size="large"
          >
            <el-form-item label="营业执照号码" prop="businessLicense.number">
              <el-input
                v-model="formData.businessLicense.number"
                placeholder="请输入营业执照号码"
                clearable
              />
            </el-form-item>

            <el-form-item label="营业执照照片" prop="businessLicense.url">
              <el-upload
                :action="uploadUrl"
                :headers="uploadHeaders"
                :on-success="(res) => handleUploadSuccess(res, 'businessLicense.url')"
                :before-upload="beforeUpload"
                :show-file-list="false"
                accept="image/*"
                name="file"
              >
                <el-button type="primary">点击上传</el-button>
                <template #tip>
                  <div class="el-upload__tip">支持jpg/png格式，大小不超过5MB</div>
                </template>
              </el-upload>
              <div v-if="formData.businessLicense.url" class="uploaded-preview">
                <el-image
                  :src="formData.businessLicense.url"
                  fit="cover"
                  style="width: 100px; height: 100px; margin-top: 10px"
                  :preview-src-list="[formData.businessLicense.url]"
                />
              </div>
            </el-form-item>

            <el-form-item label="组织机构代码证">
              <el-input
                v-model="formData.organizationCode.number"
                placeholder="选填，如有请填写"
                clearable
              />
            </el-form-item>

            <el-form-item label="道路运输许可证">
              <el-input
                v-model="formData.transportLicense.number"
                placeholder="选填，如有请填写"
                clearable
              />
            </el-form-item>

            <el-form-item label="维修资质备案表">
              <el-input
                v-model="formData.repairLicense.number"
                placeholder="选填，如有请填写"
                clearable
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 服务能力 -->
        <el-tab-pane label="服务能力" name="capability">
          <el-form ref="capabilityFormRef" :model="formData" label-width="140px" size="large">
            <el-form-item label="服务类型">
              <el-checkbox-group v-model="formData.serviceCapabilities.serviceTypes">
                <el-checkbox label="维修服务">维修服务</el-checkbox>
                <el-checkbox label="保养服务">保养服务</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="品牌专长">
              <el-input
                v-model="brandSpecialtiesText"
                type="textarea"
                :rows="2"
                placeholder="请输入品牌专长，多个用逗号分隔"
              />
            </el-form-item>

            <el-form-item label="主修车型">
              <el-input
                v-model="mainModelsText"
                type="textarea"
                :rows="2"
                placeholder="请输入主修车型，多个用逗号分隔"
              />
            </el-form-item>

            <el-form-item label="人员配置">
              <el-row :gutter="20">
                <el-col :span="6">
                  <el-form-item label="高级技师">
                    <el-input-number v-model="formData.serviceCapabilities.staffing.seniorTechnicians" :min="0" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="技师">
                    <el-input-number v-model="formData.serviceCapabilities.staffing.technicians" :min="0" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="技工">
                    <el-input-number v-model="formData.serviceCapabilities.staffing.workers" :min="0" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="学徒">
                    <el-input-number v-model="formData.serviceCapabilities.staffing.apprentices" :min="0" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="日接车能力">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="最大接车量">
                    <el-input-number v-model="formData.serviceCapabilities.dailyCapacity.maxOrders" :min="1" />
                    <span style="margin-left: 8px">台/天</span>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="平均维修时长">
                    <el-input-number v-model="formData.serviceCapabilities.dailyCapacity.averageDuration" :min="10" />
                    <span style="margin-left: 8px">分钟</span>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 定价信息 -->
        <el-tab-pane label="定价信息" name="pricing">
          <el-form ref="pricingFormRef" :model="formData" label-width="140px" size="large">
            <el-form-item label="小修工时费">
              <el-input-number v-model="formData.pricingInfo.laborRates.minorRepair" :min="0" :precision="2" />
              <span style="margin-left: 8px">元/小时</span>
            </el-form-item>

            <el-form-item label="中修工时费">
              <el-input-number v-model="formData.pricingInfo.laborRates.mediumRepair" :min="0" :precision="2" />
              <span style="margin-left: 8px">元/小时</span>
            </el-form-item>

            <el-form-item label="大修工时费">
              <el-input-number v-model="formData.pricingInfo.laborRates.majorRepair" :min="0" :precision="2" />
              <span style="margin-left: 8px">元/小时</span>
            </el-form-item>

            <el-form-item label="服务费">
              <el-input-number v-model="formData.pricingInfo.serviceFee" :min="0" :precision="2" />
              <span style="margin-left: 8px">元</span>
            </el-form-item>

            <el-form-item label="附加费用说明">
              <el-input
                v-model="formData.pricingInfo.additionalFeeNote"
                type="textarea"
                :rows="3"
                placeholder="请输入附加费用说明"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 结算信息 -->
        <el-tab-pane label="结算信息" name="settlement">
          <el-form
            ref="settlementFormRef"
            :model="formData"
            :rules="settlementRules"
            label-width="140px"
            size="large"
          >
            <el-form-item label="开户银行" prop="bankAccount.bankName">
              <el-input v-model="formData.bankAccount.bankName" placeholder="请输入开户银行" clearable />
            </el-form-item>

            <el-form-item label="银行账号" prop="bankAccount.accountNumber">
              <el-input
                v-model="formData.bankAccount.accountNumber"
                placeholder="请输入银行账号"
                clearable
              />
            </el-form-item>

            <el-form-item label="开户名称" prop="bankAccount.accountName">
              <el-input v-model="formData.bankAccount.accountName" placeholder="请输入开户名称" clearable />
            </el-form-item>

            <el-form-item label="结算周期">
              <el-radio-group v-model="formData.bankAccount.settlementCycle">
                <el-radio label="monthly">月结</el-radio>
                <el-radio label="quarterly">季结</el-radio>
                <el-radio label="per_order">单笔结算</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 管理员账号 -->
        <el-tab-pane label="管理员账号" name="account">
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
              请填写门店管理员账号信息，注册成功后将通过短信发送登录账号和初始密码
            </el-alert>

            <el-form-item label="登录账号" prop="createdBy.username">
              <el-input
                v-model="formData.createdBy.username"
                placeholder="请输入登录账号（手机号）"
                clearable
              />
            </el-form-item>

            <el-form-item label="管理员姓名" prop="createdBy.name">
              <el-input
                v-model="formData.createdBy.name"
                placeholder="请输入管理员姓名"
                clearable
              />
            </el-form-item>

            <el-form-item label="手机号码" prop="createdBy.phone">
              <el-input
                v-model="formData.createdBy.phone"
                placeholder="请输入手机号码"
                clearable
              />
            </el-form-item>

            <el-form-item label="直接审核通过">
              <el-switch v-model="formData.directApprove" />
              <div class="form-tip">开启后门店将直接进入正常运营状态，无需等待审核</div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          提交注册
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Shop } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const activeTab = ref('basic')
const submitting = ref(false)

const uploadUrl = import.meta.env.VITE_API_URL + '/upload'
const uploadHeaders = {
  Authorization: 'Bearer ' + localStorage.getItem('token')
}

// 表单数据
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
  organizationCode: {
    number: '',
    url: ''
  },
  transportLicense: {
    number: '',
    url: ''
  },
  repairLicense: {
    number: '',
    url: ''
  },
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

// 品牌专长和主修车型的文本表示
const brandSpecialtiesText = computed({
  get: () => formData.serviceCapabilities.brandSpecialties.join(','),
  set: (val) => {
    formData.serviceCapabilities.brandSpecialties = val.split(',').filter(s => s.trim())
  }
})

const mainModelsText = computed({
  get: () => formData.serviceCapabilities.mainModels.join(','),
  set: (val) => {
    formData.serviceCapabilities.mainModels = val.split(',').filter(s => s.trim())
  }
})

// 表单引用
const basicFormRef = ref(null)
const certFormRef = ref(null)
const capabilityFormRef = ref(null)
const pricingFormRef = ref(null)
const settlementFormRef = ref(null)
const accountFormRef = ref(null)

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

// 上传成功
const handleUploadSuccess = (response, field) => {
  if (response.success) {
    const keys = field.split('.')
    if (keys.length === 2) {
      formData[keys[0]][keys[1]] = response.data.url
    }
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 提交注册
const handleSubmit = async () => {
  try {
    // 验证所有表单
    const forms = [basicFormRef, certFormRef, settlementFormRef, accountFormRef]
    for (const formRef of forms) {
      if (formRef.value) {
        await formRef.value.validate()
      }
    }

    submitting.value = true

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
    ElMessage.error(error.response?.data?.message || error.message || '门店注册失败')
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

.form-actions {
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
