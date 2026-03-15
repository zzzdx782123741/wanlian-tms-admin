<template>
  <div class="store-settings-page">
    <el-page-header title="门店设置" @back="$router.back()">
      <template #content>
        <div class="page-header-content">
          <el-icon :size="20">
            <Setting />
          </el-icon>
          <span>维护门店资料、资质、结算和图片信息</span>
        </div>
      </template>
    </el-page-header>

    <el-card v-if="!hasStore" class="empty-card">
      <el-result
        icon="warning"
        title="未找到门店信息"
        sub-title="当前账号尚未关联门店，暂时无法维护门店资料。"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
        </template>
      </el-result>
    </el-card>

    <div v-else class="content-wrap">
      <el-alert
        title="本页已补齐手机号、营业执照号、银行账号等关键字段校验"
        type="info"
        :closable="false"
        class="page-alert"
      />

      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="基本信息" name="basic">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>门店基础资料</span>
                <el-button type="primary" :loading="saving" @click="handleSaveBasicInfo">
                  保存基本信息
                </el-button>
              </div>
            </template>

            <el-form ref="basicFormRef" :model="storeForm" :rules="basicRules" label-width="120px">
              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="门店名称" prop="name">
                    <el-input v-model="storeForm.name" maxlength="50" show-word-limit />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="服务范围">
                    <el-input-number v-model="storeForm.serviceRange" :min="1" :max="200" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="联系人" prop="contact.name">
                    <el-input v-model="storeForm.contact.name" maxlength="20" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="联系电话" prop="contact.phone">
                    <el-input v-model="storeForm.contact.phone" maxlength="11" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="备用电话" prop="contact.backupPhone">
                    <el-input v-model="storeForm.contact.backupPhone" maxlength="11" placeholder="选填" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="邮箱">
                    <el-input v-model="storeForm.contact.email" maxlength="50" placeholder="选填" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :xs="24" :md="8">
                  <el-form-item label="省份">
                    <el-input v-model="storeForm.address.province" maxlength="20" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="8">
                  <el-form-item label="城市">
                    <el-input v-model="storeForm.address.city" maxlength="20" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="8">
                  <el-form-item label="区县">
                    <el-input v-model="storeForm.address.district" maxlength="20" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="详细地址" prop="address.detail">
                <el-input v-model="storeForm.address.detail" type="textarea" :rows="2" maxlength="100" show-word-limit />
              </el-form-item>

              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="营业时间">
                    <el-time-picker
                      v-model="businessHoursArray"
                      is-range
                      range-separator="至"
                      start-placeholder="开始时间"
                      end-placeholder="结束时间"
                      value-format="HH:mm"
                      format="HH:mm"
                      style="width: 100%"
                      @change="handleBusinessHoursChange"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="当前时段">
                    <el-input :model-value="storeForm.businessHours" disabled />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="营业日">
                <el-checkbox-group v-model="workingDays">
                  <el-checkbox v-for="item in weekOptions" :key="item.value" :label="item.value">
                    {{ item.label }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="服务能力" name="capability">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>服务能力与接单配置</span>
                <el-button type="primary" :loading="saving" @click="handleSaveCapability">
                  保存服务能力
                </el-button>
              </div>
            </template>

            <el-form :model="storeForm.serviceCapabilities" label-width="140px">
              <el-form-item label="服务类型">
                <el-checkbox-group v-model="serviceTypesArray">
                  <el-checkbox label="repair_repair">维修</el-checkbox>
                  <el-checkbox label="maintenance">保养</el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item label="品牌专长">
                <el-input
                  v-model="brandSpecialtiesText"
                  type="textarea"
                  :rows="2"
                  placeholder="多个品牌用中文逗号分隔"
                />
              </el-form-item>

              <el-form-item label="主营车型">
                <el-input
                  v-model="mainModelsText"
                  type="textarea"
                  :rows="2"
                  placeholder="多个车型用中文逗号分隔"
                />
              </el-form-item>

              <el-row :gutter="20">
                <el-col :xs="24" :md="6">
                  <el-form-item label="高级技师">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.staffing.seniorTechnicians"
                      :min="0"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="6">
                  <el-form-item label="技师">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.staffing.technicians"
                      :min="0"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="6">
                  <el-form-item label="维修工">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.staffing.workers"
                      :min="0"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="6">
                  <el-form-item label="学徒">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.staffing.apprentices"
                      :min="0"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="日最大接单量">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.dailyCapacity.maxOrders"
                      :min="0"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="平均维修时长">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.dailyCapacity.averageDuration"
                      :min="0"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="设备清单">
                <el-input
                  v-model="equipmentListText"
                  type="textarea"
                  :rows="3"
                  placeholder="多个设备名称用中文逗号分隔"
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="报价结算" name="pricing">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>报价与价格信息</span>
                <el-button type="primary" :loading="saving" @click="handleSavePricing">
                  保存报价信息
                </el-button>
              </div>
            </template>

            <el-form :model="storeForm.pricingInfo" label-width="140px">
              <el-row :gutter="20">
                <el-col :xs="24" :md="8">
                  <el-form-item label="小修工时费">
                    <el-input-number
                      v-model="storeForm.pricingInfo.laborRates.minorRepair"
                      :min="0"
                      :precision="2"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="8">
                  <el-form-item label="中修工时费">
                    <el-input-number
                      v-model="storeForm.pricingInfo.laborRates.mediumRepair"
                      :min="0"
                      :precision="2"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="8">
                  <el-form-item label="大修工时费">
                    <el-input-number
                      v-model="storeForm.pricingInfo.laborRates.majorRepair"
                      :min="0"
                      :precision="2"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="服务费">
                    <el-input-number
                      v-model="storeForm.pricingInfo.serviceFee"
                      :min="0"
                      :precision="2"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="配件价格说明">
                    <el-input v-model="storeForm.pricingInfo.partsPriceList" placeholder="可填写链接或说明" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="附加费说明">
                <el-input v-model="storeForm.pricingInfo.additionalFeeNote" type="textarea" :rows="3" />
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="资质证照" name="certificates">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>证照与资质文件</span>
                <el-button type="primary" :loading="saving" @click="handleSaveCertificates">
                  保存证照信息
                </el-button>
              </div>
            </template>

            <el-form ref="certificateFormRef" :model="storeForm" :rules="certificateRules" label-width="140px">
              <el-form-item label="营业执照号" prop="businessLicense.number">
                <el-input v-model="storeForm.businessLicense.number" maxlength="18" />
              </el-form-item>

              <el-form-item label="营业执照" prop="businessLicense.url">
                <div class="upload-block">
                  <el-upload
                    :http-request="(options) => handleUpload(options, 'businessLicense')"
                    :before-upload="beforeUpload"
                    :show-file-list="false"
                    accept="image/*"
                  >
                    <el-button type="primary" plain :loading="uploading">上传营业执照</el-button>
                  </el-upload>

                  <div v-if="storeForm.businessLicense.url" class="single-image-preview">
                    <el-image
                      :src="getImageUrl(storeForm.businessLicense.url)"
                      :preview-src-list="[getImageUrl(storeForm.businessLicense.url)]"
                      fit="cover"
                    />
                    <el-button type="danger" link @click="storeForm.businessLicense.url = ''">删除</el-button>
                  </div>
                </div>
              </el-form-item>

              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="组织机构代码">
                    <el-input v-model="storeForm.organizationCode.number" placeholder="选填" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="组织机构代码证">
                    <el-upload
                      :http-request="(options) => handleUpload(options, 'organizationCode')"
                      :before-upload="beforeUpload"
                      :show-file-list="false"
                      accept="image/*"
                    >
                      <el-button plain :loading="uploading">上传图片</el-button>
                    </el-upload>
                    <div v-if="storeForm.organizationCode.url" class="single-image-preview inline-preview">
                      <el-image
                        :src="getImageUrl(storeForm.organizationCode.url)"
                        :preview-src-list="[getImageUrl(storeForm.organizationCode.url)]"
                        fit="cover"
                      />
                      <el-button type="danger" link @click="storeForm.organizationCode.url = ''">删除</el-button>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="道路运输证号">
                    <el-input v-model="storeForm.transportLicense.number" placeholder="选填" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="道路运输证">
                    <el-upload
                      :http-request="(options) => handleUpload(options, 'transportLicense')"
                      :before-upload="beforeUpload"
                      :show-file-list="false"
                      accept="image/*"
                    >
                      <el-button plain :loading="uploading">上传图片</el-button>
                    </el-upload>
                    <div v-if="storeForm.transportLicense.url" class="single-image-preview inline-preview">
                      <el-image
                        :src="getImageUrl(storeForm.transportLicense.url)"
                        :preview-src-list="[getImageUrl(storeForm.transportLicense.url)]"
                        fit="cover"
                      />
                      <el-button type="danger" link @click="storeForm.transportLicense.url = ''">删除</el-button>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="维修资质编号">
                    <el-input v-model="storeForm.repairLicense.number" placeholder="选填" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="维修资质文件">
                    <el-upload
                      :http-request="(options) => handleUpload(options, 'repairLicense')"
                      :before-upload="beforeUpload"
                      :show-file-list="false"
                      accept="image/*"
                    >
                      <el-button plain :loading="uploading">上传图片</el-button>
                    </el-upload>
                    <div v-if="storeForm.repairLicense.url" class="single-image-preview inline-preview">
                      <el-image
                        :src="getImageUrl(storeForm.repairLicense.url)"
                        :preview-src-list="[getImageUrl(storeForm.repairLicense.url)]"
                        fit="cover"
                      />
                      <el-button type="danger" link @click="storeForm.repairLicense.url = ''">删除</el-button>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="收款账户" name="bank">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>门店收款信息</span>
                <el-button type="primary" :loading="saving" @click="handleSaveBankInfo">
                  保存收款账户
                </el-button>
              </div>
            </template>

            <el-form ref="bankFormRef" :model="storeForm" :rules="bankRules" label-width="140px">
              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="开户银行" prop="bankAccount.bankName">
                    <el-input v-model="storeForm.bankAccount.bankName" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="账户名称" prop="bankAccount.accountName">
                    <el-input v-model="storeForm.bankAccount.accountName" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="银行账号" prop="bankAccount.accountNumber">
                    <el-input v-model="storeForm.bankAccount.accountNumber" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="结算周期">
                    <el-select v-model="storeForm.bankAccount.settlementCycle" style="width: 100%">
                      <el-option label="月结" value="monthly" />
                      <el-option label="季结" value="quarterly" />
                      <el-option label="按单结" value="per_order" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="门店图片" name="photos">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>展示图片</span>
              </div>
            </template>

            <el-alert
              title="上传后会立即同步保存到门店资料"
              type="info"
              :closable="false"
              class="inline-alert"
            />

            <el-upload
              :http-request="handlePhotoUpload"
              :before-upload="beforeUpload"
              :show-file-list="false"
              accept="image/*"
            >
              <el-button type="primary" :loading="uploading">上传门店图片</el-button>
            </el-upload>

            <div v-if="imageList.length" class="photo-grid">
              <div v-for="(item, index) in imageList" :key="`${item.url}-${index}`" class="photo-item">
                <el-image
                  :src="getImageUrl(item.url)"
                  :preview-src-list="imagePreviewList"
                  :initial-index="index"
                  fit="cover"
                  @click="handlePicturePreview(item.url)"
                />
                <div class="photo-actions">
                  <el-button type="primary" link @click="handlePicturePreview(item.url)">预览</el-button>
                  <el-button type="danger" link @click="handlePhotoRemove(index)">删除</el-button>
                </div>
              </div>
            </div>

            <el-empty v-else description="暂无门店图片" />
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="评分概览" name="stats">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>门店评分统计</span>
              </div>
            </template>

            <el-row :gutter="20">
              <el-col :xs="24" :md="6">
                <el-statistic title="综合评分" :value="storeForm.ratingStats.overallRating || 0" :precision="1" />
              </el-col>
              <el-col :xs="24" :md="6">
                <el-statistic title="评价数量" :value="storeForm.ratingStats.reviewCount || 0" />
              </el-col>
              <el-col :xs="24" :md="6">
                <el-statistic title="技术评分" :value="storeForm.ratingStats.ratings.technicalSkill || 0" :precision="1" />
              </el-col>
              <el-col :xs="24" :md="6">
                <el-statistic title="效率评分" :value="storeForm.ratingStats.ratings.serviceEfficiency || 0" :precision="1" />
              </el-col>
            </el-row>

            <el-descriptions border :column="1" class="stats-desc">
              <el-descriptions-item label="价格透明度">
                {{ storeForm.ratingStats.ratings.pricingTransparency || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ storeUpdatedAtText }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="previewDialogVisible" title="图片预览" width="720px">
      <div class="preview-dialog-body">
        <img v-if="previewImageUrl" :src="getImageUrl(previewImageUrl)" alt="preview" class="preview-image" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import axios from 'axios'
import request from '@/utils/request'
import {
  buildBankAccountNumberRules,
  buildBusinessLicenseNumberRules,
  buildPhoneRules,
  isValidBankAccountNumber,
  isValidBusinessLicenseNumber,
  isValidPhone,
  normalizeBankAccountNumber,
  normalizeBusinessLicenseNumber,
  normalizePhone,
  trimValue
} from '@/utils/formValidators'

const weekOptions = [
  { label: '周一', value: '1' },
  { label: '周二', value: '2' },
  { label: '周三', value: '3' },
  { label: '周四', value: '4' },
  { label: '周五', value: '5' },
  { label: '周六', value: '6' },
  { label: '周日', value: '7' }
]

const weekdayMap = {
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday'
}

function createDefaultStoreForm() {
  return {
    name: '',
    contact: {
      name: '',
      phone: '',
      email: '',
      backupPhone: ''
    },
    address: {
      province: '',
      city: '',
      district: '',
      detail: '',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    },
    businessHours: '08:00-18:00',
    workingDays: {
      weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      saturday: true,
      sunday: false
    },
    serviceRange: 50,
    photos: [],
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
      },
      equipmentList: []
    },
    pricingInfo: {
      laborRates: {
        minorRepair: 0,
        mediumRepair: 0,
        majorRepair: 0
      },
      partsPriceList: '',
      serviceFee: 0,
      additionalFeeNote: ''
    },
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountName: '',
      settlementCycle: 'monthly'
    },
    ratingStats: {
      overallRating: 0,
      reviewCount: 0,
      ratings: {
        technicalSkill: 0,
        serviceEfficiency: 0,
        pricingTransparency: 0
      }
    },
    updatedAt: ''
  }
}

const activeTab = ref('basic')
const saving = ref(false)
const uploading = ref(false)
const hasStore = ref(true)
const previewDialogVisible = ref(false)
const previewImageUrl = ref('')
const basicFormRef = ref(null)
const certificateFormRef = ref(null)
const bankFormRef = ref(null)

const storeForm = ref(createDefaultStoreForm())
const workingDays = ref(['1', '2', '3', '4', '5', '6'])
const businessHoursArray = ref(['08:00', '18:00'])

const userStoreId = computed(() => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return userInfo?.storeInfo?.storeId || ''
  } catch {
    return ''
  }
})

const imageList = computed(() => (storeForm.value.photos || []).map((url) => ({ url })))
const imagePreviewList = computed(() => imageList.value.map((item) => getImageUrl(item.url)))

const storeUpdatedAtText = computed(() => {
  if (!storeForm.value.updatedAt) {
    return '--'
  }
  return new Date(storeForm.value.updatedAt).toLocaleString('zh-CN')
})

const serviceTypesArray = computed({
  get() {
    return (storeForm.value.serviceCapabilities.serviceTypes || []).map((item) => item?.type).filter(Boolean)
  },
  set(value) {
    const currentMap = new Map(
      (storeForm.value.serviceCapabilities.serviceTypes || [])
        .filter((item) => item?.type)
        .map((item) => [item.type, item])
    )

    storeForm.value.serviceCapabilities.serviceTypes = value.map((type) => ({
      type,
      subTypes: currentMap.get(type)?.subTypes || []
    }))
  }
})

function createCommaTextComputed(key) {
  return computed({
    get() {
      return (storeForm.value.serviceCapabilities[key] || []).join('，')
    },
    set(value) {
      storeForm.value.serviceCapabilities[key] = splitTextList(value)
    }
  })
}

const brandSpecialtiesText = createCommaTextComputed('brandSpecialties')
const mainModelsText = createCommaTextComputed('mainModels')
const equipmentListText = createCommaTextComputed('equipmentList')

const basicRules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  'contact.name': [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  'contact.phone': buildPhoneRules({
    requiredMessage: '请输入联系电话',
    invalidMessage: '请输入正确的联系电话'
  }),
  'contact.backupPhone': buildPhoneRules({
    required: false,
    invalidMessage: '请输入正确的备用电话'
  }),
  'address.detail': [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const certificateRules = {
  'businessLicense.number': buildBusinessLicenseNumberRules({
    requiredMessage: '请输入营业执照号',
    invalidMessage: '请输入正确的营业执照号'
  }),
  'businessLicense.url': [{ required: true, message: '请上传营业执照', trigger: 'change' }]
}

const bankRules = {
  'bankAccount.bankName': [{ required: true, message: '请输入开户银行', trigger: 'blur' }],
  'bankAccount.accountName': [{ required: true, message: '请输入账户名称', trigger: 'blur' }],
  'bankAccount.accountNumber': buildBankAccountNumberRules({
    requiredMessage: '请输入银行账号',
    invalidMessage: '请输入正确的银行账号'
  })
}

function splitTextList(value) {
  return String(value || '')
    .split(/[，,、\n]/)
    .map((item) => trimValue(item))
    .filter(Boolean)
}

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

function syncWorkingDaysFromStore(workingDayData = {}) {
  const values = []
  Object.entries(weekdayMap).forEach(([key, label]) => {
    if ((workingDayData.weekdays || []).includes(label)) {
      values.push(key)
    }
  })

  if (workingDayData.saturday) {
    values.push('6')
  }

  if (workingDayData.sunday) {
    values.push('7')
  }

  workingDays.value = values
}

function buildWorkingDaysData() {
  return {
    weekdays: workingDays.value
      .filter((item) => Object.prototype.hasOwnProperty.call(weekdayMap, item))
      .map((item) => weekdayMap[item]),
    saturday: workingDays.value.includes('6'),
    sunday: workingDays.value.includes('7')
  }
}

function syncBusinessHours(value) {
  const text = trimValue(value) || '08:00-18:00'
  const parts = text.split('-')
  storeForm.value.businessHours = text
  if (parts.length === 2) {
    businessHoursArray.value = [parts[0], parts[1]]
  }
}

function handleBusinessHoursChange(value) {
  if (!Array.isArray(value) || value.length !== 2) {
    return
  }
  storeForm.value.businessHours = `${value[0]}-${value[1]}`
}

function normalizeStoreForm() {
  storeForm.value.name = trimValue(storeForm.value.name)
  storeForm.value.contact.name = trimValue(storeForm.value.contact.name)
  storeForm.value.contact.phone = normalizePhone(storeForm.value.contact.phone)
  storeForm.value.contact.backupPhone = normalizePhone(storeForm.value.contact.backupPhone)
  storeForm.value.contact.email = trimValue(storeForm.value.contact.email)
  storeForm.value.address.province = trimValue(storeForm.value.address.province)
  storeForm.value.address.city = trimValue(storeForm.value.address.city)
  storeForm.value.address.district = trimValue(storeForm.value.address.district)
  storeForm.value.address.detail = trimValue(storeForm.value.address.detail)
  storeForm.value.businessLicense.number = normalizeBusinessLicenseNumber(storeForm.value.businessLicense.number)
  storeForm.value.organizationCode.number = trimValue(storeForm.value.organizationCode.number)
  storeForm.value.transportLicense.number = trimValue(storeForm.value.transportLicense.number)
  storeForm.value.repairLicense.number = trimValue(storeForm.value.repairLicense.number)
  storeForm.value.pricingInfo.partsPriceList = trimValue(storeForm.value.pricingInfo.partsPriceList)
  storeForm.value.pricingInfo.additionalFeeNote = trimValue(storeForm.value.pricingInfo.additionalFeeNote)
  storeForm.value.bankAccount.bankName = trimValue(storeForm.value.bankAccount.bankName)
  storeForm.value.bankAccount.accountName = trimValue(storeForm.value.bankAccount.accountName)
  storeForm.value.bankAccount.accountNumber = normalizeBankAccountNumber(storeForm.value.bankAccount.accountNumber)
  storeForm.value.workingDays = buildWorkingDaysData()
}

function buildUploadHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'Content-Type': 'multipart/form-data'
  }
}

async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post('/api/upload', formData, {
    headers: buildUploadHeaders()
  })

  const result = response.data
  if (!result?.success || !result?.data?.url) {
    throw new Error(result?.message || '上传失败')
  }

  return result.data.url
}

async function updateStore(payload, successMessage) {
  if (!userStoreId.value) {
    throw new Error('未获取到门店 ID')
  }

  const response = await request({
    url: `/stores/${userStoreId.value}`,
    method: 'put',
    data: payload
  })

  if (!response?.success) {
    throw new Error(response?.message || '保存失败')
  }

  ElMessage.success(successMessage)
  await fetchStoreInfo()
}

function validateCertificateData() {
  storeForm.value.businessLicense.number = normalizeBusinessLicenseNumber(storeForm.value.businessLicense.number)

  if (!storeForm.value.businessLicense.number) {
    throw new Error('请输入营业执照号')
  }

  if (!isValidBusinessLicenseNumber(storeForm.value.businessLicense.number)) {
    throw new Error('请输入正确的营业执照号')
  }

  if (!storeForm.value.businessLicense.url) {
    throw new Error('请上传营业执照')
  }
}

function validateBasicExtra() {
  if (!isValidPhone(storeForm.value.contact.phone)) {
    throw new Error('请输入正确的联系电话')
  }

  if (storeForm.value.contact.backupPhone && !isValidPhone(storeForm.value.contact.backupPhone)) {
    throw new Error('请输入正确的备用电话')
  }
}

function validateBankExtra() {
  if (!storeForm.value.bankAccount.bankName || !storeForm.value.bankAccount.accountName || !storeForm.value.bankAccount.accountNumber) {
    throw new Error('请完整填写收款账户信息')
  }

  if (!isValidBankAccountNumber(storeForm.value.bankAccount.accountNumber)) {
    throw new Error('请输入正确的银行账号')
  }
}

async function fetchStoreInfo() {
  if (!userStoreId.value) {
    hasStore.value = false
    return
  }

  try {
    const response = await request({
      url: `/stores/${userStoreId.value}`,
      method: 'get'
    })

    const store = response?.data?.store
    if (!store) {
      hasStore.value = false
      return
    }

    storeForm.value = {
      ...createDefaultStoreForm(),
      ...store,
      contact: {
        ...createDefaultStoreForm().contact,
        ...(store.contact || {})
      },
      address: {
        ...createDefaultStoreForm().address,
        ...(store.address || {})
      },
      workingDays: {
        ...createDefaultStoreForm().workingDays,
        ...(store.workingDays || {})
      },
      businessLicense: {
        ...createDefaultStoreForm().businessLicense,
        ...(store.businessLicense || {})
      },
      organizationCode: {
        ...createDefaultStoreForm().organizationCode,
        ...(store.organizationCode || {})
      },
      transportLicense: {
        ...createDefaultStoreForm().transportLicense,
        ...(store.transportLicense || {})
      },
      repairLicense: {
        ...createDefaultStoreForm().repairLicense,
        ...(store.repairLicense || {})
      },
      serviceCapabilities: {
        ...createDefaultStoreForm().serviceCapabilities,
        ...(store.serviceCapabilities || {}),
        staffing: {
          ...createDefaultStoreForm().serviceCapabilities.staffing,
          ...(store.serviceCapabilities?.staffing || {})
        },
        dailyCapacity: {
          ...createDefaultStoreForm().serviceCapabilities.dailyCapacity,
          ...(store.serviceCapabilities?.dailyCapacity || {})
        }
      },
      pricingInfo: {
        ...createDefaultStoreForm().pricingInfo,
        ...(store.pricingInfo || {}),
        laborRates: {
          ...createDefaultStoreForm().pricingInfo.laborRates,
          ...(store.pricingInfo?.laborRates || {})
        }
      },
      bankAccount: {
        ...createDefaultStoreForm().bankAccount,
        ...(store.bankAccount || {})
      },
      ratingStats: {
        ...createDefaultStoreForm().ratingStats,
        ...(store.ratingStats || {}),
        ratings: {
          ...createDefaultStoreForm().ratingStats.ratings,
          ...(store.ratingStats?.ratings || {})
        }
      }
    }

    hasStore.value = true
    syncWorkingDaysFromStore(storeForm.value.workingDays)
    syncBusinessHours(storeForm.value.businessHours)
  } catch (error) {
    hasStore.value = false
    ElMessage.error(error.message || '获取门店信息失败')
  }
}

async function handleSaveBasicInfo() {
  try {
    saving.value = true
    normalizeStoreForm()
    await basicFormRef.value?.validate()
    validateBasicExtra()

    await updateStore(
      {
        name: storeForm.value.name,
        contact: storeForm.value.contact,
        address: storeForm.value.address,
        businessHours: storeForm.value.businessHours,
        workingDays: storeForm.value.workingDays,
        serviceRange: storeForm.value.serviceRange
      },
      '基本信息已保存'
    )
  } catch (error) {
    if (error?.message) {
      ElMessage.error(error.message)
    }
  } finally {
    saving.value = false
  }
}

async function handleSaveCapability() {
  try {
    saving.value = true
    normalizeStoreForm()
    await updateStore(
      {
        serviceCapabilities: storeForm.value.serviceCapabilities
      },
      '服务能力已保存'
    )
  } catch (error) {
    ElMessage.error(error.message || '保存服务能力失败')
  } finally {
    saving.value = false
  }
}

async function handleSavePricing() {
  try {
    saving.value = true
    normalizeStoreForm()
    await updateStore(
      {
        pricingInfo: storeForm.value.pricingInfo
      },
      '报价信息已保存'
    )
  } catch (error) {
    ElMessage.error(error.message || '保存报价信息失败')
  } finally {
    saving.value = false
  }
}

async function handleSaveCertificates() {
  try {
    saving.value = true
    normalizeStoreForm()
    await certificateFormRef.value?.validate()
    validateCertificateData()

    await updateStore(
      {
        businessLicense: storeForm.value.businessLicense,
        organizationCode: storeForm.value.organizationCode,
        transportLicense: storeForm.value.transportLicense,
        repairLicense: storeForm.value.repairLicense
      },
      '证照信息已保存'
    )
  } catch (error) {
    if (error?.message) {
      ElMessage.error(error.message)
    }
  } finally {
    saving.value = false
  }
}

async function handleSaveBankInfo() {
  try {
    saving.value = true
    normalizeStoreForm()
    await bankFormRef.value?.validate()
    validateBankExtra()

    await updateStore(
      {
        bankAccount: storeForm.value.bankAccount
      },
      '收款账户已保存'
    )
  } catch (error) {
    if (error?.message) {
      ElMessage.error(error.message)
    }
  } finally {
    saving.value = false
  }
}

function beforeUpload(file) {
  const isImage = String(file.type || '').startsWith('image/')
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

async function handleUpload(options, field) {
  const { file, onSuccess, onError } = options

  try {
    uploading.value = true
    const url = await uploadFile(file)
    storeForm.value[field].url = url
    ElMessage.success('上传成功')
    onSuccess?.({ success: true, data: { url } })
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
    onError?.(error)
  } finally {
    uploading.value = false
  }
}

async function handlePhotoUpload(options) {
  const { file, onSuccess, onError } = options

  try {
    uploading.value = true
    const url = await uploadFile(file)
    storeForm.value.photos = [...(storeForm.value.photos || []), url]

    await updateStore(
      {
        photos: storeForm.value.photos
      },
      '门店图片已更新'
    )

    onSuccess?.({ success: true, data: { url } })
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
    onError?.(error)
  } finally {
    uploading.value = false
  }
}

async function handlePhotoRemove(index) {
  try {
    const nextPhotos = [...(storeForm.value.photos || [])]
    nextPhotos.splice(index, 1)
    storeForm.value.photos = nextPhotos

    await updateStore(
      {
        photos: nextPhotos
      },
      '门店图片已删除'
    )
  } catch (error) {
    ElMessage.error(error.message || '删除图片失败')
  }
}

function handlePicturePreview(url) {
  previewImageUrl.value = url
  previewDialogVisible.value = true
}

onMounted(() => {
  fetchStoreInfo()
})
</script>

<style scoped>
.store-settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.empty-card,
.content-wrap {
  width: 100%;
}

.page-alert,
.inline-alert {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
}

.upload-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.single-image-preview {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.single-image-preview :deep(.el-image) {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.inline-preview {
  margin-top: 12px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.photo-item {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 12px;
  background: var(--el-fill-color-blank);
}

.photo-item :deep(.el-image) {
  width: 100%;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
}

.photo-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.stats-desc {
  margin-top: 20px;
}

.preview-dialog-body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .photo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
