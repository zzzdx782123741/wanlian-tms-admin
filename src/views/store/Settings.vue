<template>
  <div class="store-settings">
    <!-- 未关联门店提示 -->
    <el-card v-if="!hasStore">
      <el-result
        icon="warning"
        title="未关联门店"
        sub-title="您的账号尚未关联门店，无法访问门店设置"
      >
        <template #extra>
          <el-button
            type="primary"
            @click="$router.push('/')"
          >
            返回首页
          </el-button>
        </template>
      </el-result>
    </el-card>

    <!-- 门店设置内容 -->
    <div v-else>
      <el-tabs
        v-model="activeTab"
        type="border-card"
      >
        <!-- 基本设置 -->
        <el-tab-pane
          label="基本设置"
          name="basic"
        >
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-header-title">门店基本信息</span>
                <el-button
                  type="primary"
                  size="small"
                  :loading="saving"
                  @click="handleSaveBasicInfo"
                >
                  <el-icon><Check /></el-icon>
                  保存
                </el-button>
              </div>
            </template>

            <el-form
              :model="storeForm"
              label-width="120px"
              style="max-width: 800px"
            >
              <el-form-item label="门店名称">
                <el-input
                  v-model="storeForm.name"
                  placeholder="请输入门店名称"
                  maxlength="50"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="联系人">
                <el-input
                  v-model="storeForm.contact.name"
                  placeholder="请输入联系人姓名"
                  maxlength="20"
                />
              </el-form-item>

              <el-form-item label="联系电话">
                <el-input
                  v-model="storeForm.contact.phone"
                  placeholder="请输入联系电话"
                  maxlength="11"
                >
                  <template #append>
                    <el-icon><Phone /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="联系邮箱">
                <el-input
                  v-model="storeForm.contact.email"
                  placeholder="请输入联系邮箱"
                  maxlength="50"
                >
                  <template #append>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-divider content-position="left">
                地址信息
              </el-divider>

              <el-form-item label="所在地区">
                <el-cascader
                  v-model="addressArray"
                  :options="regionData"
                  placeholder="请选择省/市/区"
                  style="width: 100%"
                  @change="handleRegionChange"
                />
              </el-form-item>

              <el-form-item label="详细地址">
                <el-input
                  v-model="storeForm.address.detail"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入详细地址（街道、门牌号等）"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="服务范围">
                <el-input-number
                  v-model="storeForm.serviceRange"
                  :min="1"
                  :max="200"
                  :step="1"
                  controls-position="right"
                  style="width: 200px"
                />
                <span style="margin-left: 12px; color: #909399">公里</span>
                <div class="form-item-tip">
                  门店提供上门服务的最大半径范围
                </div>
              </el-form-item>

              <el-divider content-position="left">
                营业时间
              </el-divider>

              <el-form-item label="营业时间">
                <el-time-picker
                  v-model="businessHoursArray"
                  is-range
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="HH:mm"
                  value-format="HH:mm"
                  style="width: 100%"
                  @change="handleBusinessHoursChange"
                />
                <div class="form-item-tip">
                  当前设置：{{ storeForm.businessHours || '未设置' }}
                </div>
              </el-form-item>

              <el-form-item label="工作日">
                <el-checkbox-group v-model="workingDays">
                  <el-checkbox label="1">
                    周一
                  </el-checkbox>
                  <el-checkbox label="2">
                    周二
                  </el-checkbox>
                  <el-checkbox label="3">
                    周三
                  </el-checkbox>
                  <el-checkbox label="4">
                    周四
                  </el-checkbox>
                  <el-checkbox label="5">
                    周五
                  </el-checkbox>
                  <el-checkbox label="6">
                    周六
                  </el-checkbox>
                  <el-checkbox label="7">
                    周日
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 服务能力 -->
        <el-tab-pane
          label="服务能力"
          name="capability"
        >
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-header-title">服务能力配置</span>
                <el-button
                  type="primary"
                  size="small"
                  :loading="saving"
                  @click="handleSaveCapability"
                >
                  <el-icon><Check /></el-icon>
                  保存
                </el-button>
              </div>
            </template>

            <el-alert
              title="提示"
              type="info"
              :closable="false"
              style="margin-bottom: 20px"
            >
              完善服务能力信息有助于平台精准匹配订单，提升接单效率。
            </el-alert>

            <el-form
              :model="storeForm.serviceCapabilities"
              label-width="120px"
              style="max-width: 800px"
            >
              <el-form-item label="服务类型">
                <el-checkbox-group v-model="serviceTypesArray">
                  <el-checkbox label="repair_repair">
                    维修服务
                  </el-checkbox>
                  <el-checkbox label="maintenance">
                    保养服务
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item label="品牌专长">
                <el-input
                  v-model="brandSpecialtiesText"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入品牌专长，多个用逗号分隔，如：大众、丰田、本田"
                />
                <div class="form-item-tip">
                  填写门店擅长维修的品牌，有助于精准匹配订单
                </div>
              </el-form-item>

              <el-form-item label="主修车型">
                <el-input
                  v-model="mainModelsText"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入主修车型，多个用逗号分隔，如：轿车、SUV、MPV"
                />
              </el-form-item>

              <el-divider content-position="left">
                人员配置
              </el-divider>

              <el-row :gutter="20">
                <el-col :span="6">
                  <el-form-item label="高级技师">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.staffing.seniorTechnicians"
                      :min="0"
                      controls-position="right"
                    />
                    <div class="form-item-tip">
                      人
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="技师">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.staffing.technicians"
                      :min="0"
                      controls-position="right"
                    />
                    <div class="form-item-tip">
                      人
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="技工">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.staffing.workers"
                      :min="0"
                      controls-position="right"
                    />
                    <div class="form-item-tip">
                      人
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="学徒">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.staffing.apprentices"
                      :min="0"
                      controls-position="right"
                    />
                    <div class="form-item-tip">
                      人
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">
                接车能力
              </el-divider>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="最大接车量">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.dailyCapacity.maxOrders"
                      :min="1"
                      controls-position="right"
                    />
                    <span style="margin-left: 12px; color: #909399">台/天</span>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="平均维修时长">
                    <el-input-number
                      v-model="storeForm.serviceCapabilities.dailyCapacity.averageDuration"
                      :min="10"
                      :step="10"
                      controls-position="right"
                    />
                    <span style="margin-left: 12px; color: #909399">分钟</span>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 定价信息 -->
        <el-tab-pane
          label="定价信息"
          name="pricing"
        >
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-header-title">定价信息配置</span>
                <el-button
                  type="primary"
                  size="small"
                  :loading="saving"
                  @click="handleSavePricing"
                >
                  <el-icon><Check /></el-icon>
                  保存
                </el-button>
              </div>
            </template>

            <el-alert
              title="提示"
              type="info"
              :closable="false"
              style="margin-bottom: 20px"
            >
              合理的定价有助于吸引客户，建议参考当地市场行情设置。
            </el-alert>

            <el-form
              :model="storeForm.pricingInfo"
              label-width="120px"
              style="max-width: 600px"
            >
              <el-divider content-position="left">
                工时费标准
              </el-divider>

              <el-form-item label="小修工时费">
                <el-input-number
                  v-model="storeForm.pricingInfo.laborRates.minorRepair"
                  :min="0"
                  :precision="2"
                  controls-position="right"
                  style="width: 200px"
                />
                <span style="margin-left: 12px; color: #909399">元/小时</span>
                <div class="form-item-tip">
                  更换机油、滤芯等小修项目
                </div>
              </el-form-item>

              <el-form-item label="中修工时费">
                <el-input-number
                  v-model="storeForm.pricingInfo.laborRates.mediumRepair"
                  :min="0"
                  :precision="2"
                  controls-position="right"
                  style="width: 200px"
                />
                <span style="margin-left: 12px; color: #909399">元/小时</span>
                <div class="form-item-tip">
                  刹车系统、悬挂系统等中修项目
                </div>
              </el-form-item>

              <el-form-item label="大修工时费">
                <el-input-number
                  v-model="storeForm.pricingInfo.laborRates.majorRepair"
                  :min="0"
                  :precision="2"
                  controls-position="right"
                  style="width: 200px"
                />
                <span style="margin-left: 12px; color: #909399">元/小时</span>
                <div class="form-item-tip">
                  发动机、变速箱等大修项目
                </div>
              </el-form-item>

              <el-divider content-position="left">
                其他费用
              </el-divider>

              <el-form-item label="服务费">
                <el-input-number
                  v-model="storeForm.pricingInfo.serviceFee"
                  :min="0"
                  :precision="2"
                  controls-position="right"
                  style="width: 200px"
                />
                <span style="margin-left: 12px; color: #909399">元/单</span>
                <div class="form-item-tip">
                  每次服务收取的基础服务费
                </div>
              </el-form-item>

              <el-form-item label="附加费用说明">
                <el-input
                  v-model="storeForm.pricingInfo.additionalFeeNote"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入附加费用说明，如：上门服务费、急件加收费用等"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 资质证书 -->
        <el-tab-pane
          label="资质证书"
          name="certificates"
        >
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-header-title">资质证书管理</span>
                <el-button
                  type="primary"
                  size="small"
                  :loading="saving"
                  @click="handleSaveCertificates"
                >
                  <el-icon><Check /></el-icon>
                  保存
                </el-button>
              </div>
            </template>

            <el-alert
              title="提示"
              type="info"
              :closable="false"
              style="margin-bottom: 20px"
            >
              完善资质证书有助于提升门店可信度，营业执照为必填项。
            </el-alert>

            <el-form
              label-width="140px"
              style="max-width: 700px"
            >
              <el-divider content-position="left">
                营业执照（必填）
              </el-divider>

              <el-form-item
                label="营业执照号码"
                required
              >
                <el-input
                  v-model="storeForm.businessLicense.number"
                  placeholder="请输入统一社会信用代码/营业执照号码"
                  maxlength="50"
                />
              </el-form-item>

              <el-form-item
                label="营业执照照片"
                required
              >
                <el-upload
                  v-if="!storeForm.businessLicense.url"
                  :http-request="(options) => handleUpload(options, 'businessLicense')"
                  :before-upload="beforeUpload"
                  :show-file-list="false"
                  accept="image/*"
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
                  v-else
                  class="uploaded-image-wrapper"
                >
                  <el-image
                    :src="storeForm.businessLicense.url"
                    fit="cover"
                    style="width: 150px; height: 150px; border-radius: 4px"
                    :preview-src-list="[storeForm.businessLicense.url]"
                  />
                  <el-button
                    type="danger"
                    size="small"
                    link
                    @click="storeForm.businessLicense.url = ''"
                  >
                    删除
                  </el-button>
                </div>
              </el-form-item>

              <el-divider content-position="left">
                其他资质证书（选填）
              </el-divider>

              <el-form-item label="组织机构代码证">
                <el-input
                  v-model="storeForm.organizationCode.number"
                  placeholder="请输入组织机构代码证号码"
                  maxlength="50"
                  style="margin-bottom: 10px"
                />
                <el-upload
                  v-if="!storeForm.organizationCode.url"
                  :http-request="(options) => handleUpload(options, 'organizationCode')"
                  :before-upload="beforeUpload"
                  :show-file-list="false"
                  accept="image/*"
                >
                  <el-button
                    size="small"
                    :loading="uploading"
                  >
                    <el-icon><Upload /></el-icon>
                    上传证书
                  </el-button>
                </el-upload>
                <div
                  v-else
                  class="uploaded-image-wrapper"
                >
                  <el-image
                    :src="storeForm.organizationCode.url"
                    fit="cover"
                    style="width: 100px; height: 100px; border-radius: 4px"
                    :preview-src-list="[storeForm.organizationCode.url]"
                  />
                  <el-button
                    type="danger"
                    size="small"
                    link
                    @click="storeForm.organizationCode.url = ''"
                  >
                    删除
                  </el-button>
                </div>
              </el-form-item>

              <el-form-item label="道路运输许可证">
                <el-input
                  v-model="storeForm.transportLicense.number"
                  placeholder="请输入道路运输许可证号码"
                  maxlength="50"
                  style="margin-bottom: 10px"
                />
                <el-upload
                  v-if="!storeForm.transportLicense.url"
                  :http-request="(options) => handleUpload(options, 'transportLicense')"
                  :before-upload="beforeUpload"
                  :show-file-list="false"
                  accept="image/*"
                >
                  <el-button
                    size="small"
                    :loading="uploading"
                  >
                    <el-icon><Upload /></el-icon>
                    上传证书
                  </el-button>
                </el-upload>
                <div
                  v-else
                  class="uploaded-image-wrapper"
                >
                  <el-image
                    :src="storeForm.transportLicense.url"
                    fit="cover"
                    style="width: 100px; height: 100px; border-radius: 4px"
                    :preview-src-list="[storeForm.transportLicense.url]"
                  />
                  <el-button
                    type="danger"
                    size="small"
                    link
                    @click="storeForm.transportLicense.url = ''"
                  >
                    删除
                  </el-button>
                </div>
              </el-form-item>

              <el-form-item label="维修资质备案表">
                <el-input
                  v-model="storeForm.repairLicense.number"
                  placeholder="请输入维修资质备案表号码"
                  maxlength="50"
                  style="margin-bottom: 10px"
                />
                <el-upload
                  v-if="!storeForm.repairLicense.url"
                  :http-request="(options) => handleUpload(options, 'repairLicense')"
                  :before-upload="beforeUpload"
                  :show-file-list="false"
                  accept="image/*"
                >
                  <el-button
                    size="small"
                    :loading="uploading"
                  >
                    <el-icon><Upload /></el-icon>
                    上传证书
                  </el-button>
                </el-upload>
                <div
                  v-else
                  class="uploaded-image-wrapper"
                >
                  <el-image
                    :src="storeForm.repairLicense.url"
                    fit="cover"
                    style="width: 100px; height: 100px; border-radius: 4px"
                    :preview-src-list="[storeForm.repairLicense.url]"
                  />
                  <el-button
                    type="danger"
                    size="small"
                    link
                    @click="storeForm.repairLicense.url = ''"
                  >
                    删除
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 银行账户 -->
        <el-tab-pane
          label="银行账户"
          name="bank"
        >
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-header-title">银行账户信息</span>
                <el-button
                  type="primary"
                  size="small"
                  :loading="saving"
                  @click="handleSaveBankInfo"
                >
                  <el-icon><Check /></el-icon>
                  保存
                </el-button>
              </div>
            </template>

            <el-form
              :model="storeForm.bankAccount"
              label-width="120px"
              style="max-width: 600px"
            >
              <el-form-item label="开户银行">
                <el-input
                  v-model="storeForm.bankAccount.bankName"
                  placeholder="请输入开户银行名称"
                  maxlength="50"
                />
              </el-form-item>

              <el-form-item label="银行账号">
                <el-input
                  v-model="storeForm.bankAccount.accountNumber"
                  placeholder="请输入银行账号"
                  maxlength="30"
                />
              </el-form-item>

              <el-form-item label="账户名称">
                <el-input
                  v-model="storeForm.bankAccount.accountName"
                  placeholder="请输入账户名称"
                  maxlength="50"
                />
              </el-form-item>

              <el-form-item label="结算周期">
                <el-radio-group v-model="storeForm.bankAccount.settlementCycle">
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
          </el-card>
        </el-tab-pane>

        <!-- 门店图片 -->
        <el-tab-pane
          label="门店图片"
          name="photos"
        >
          <el-card shadow="never">
            <template #header>
              <span class="card-header-title">门店图片展示</span>
            </template>

            <el-form label-width="120px">
              <el-form-item label="门店照片">
                <el-upload
                  v-model:file-list="imageList"
                  :http-request="handlePhotoUpload"
                  list-type="picture-card"
                  :on-preview="handlePicturePreview"
                  :on-remove="handlePhotoRemove"
                  :before-upload="beforeUpload"
                  :limit="5"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
                <div class="form-item-tip">
                  建议上传门店环境照片，最多5张，支持jpg/png格式，每张不超过2MB
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 数据统计 -->
        <el-tab-pane
          label="数据统计"
          name="stats"
        >
          <el-card shadow="never">
            <template #header>
              <span class="card-header-title">门店运营数据</span>
            </template>

            <el-row :gutter="20">
              <el-col :span="6">
                <el-statistic
                  title="综合评分"
                  :value="storeForm.ratingStats?.overallRating || 0"
                  :precision="1"
                >
                  <template #suffix>
                    <el-icon
                      color="#F7BA2A"
                      style="vertical-align: -2px"
                    >
                      <StarFilled />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic
                  title="评价数量"
                  :value="storeForm.ratingStats?.reviewCount || 0"
                />
              </el-col>
              <el-col :span="4">
                <el-statistic
                  title="技术专业度"
                  :value="storeForm.ratingStats?.ratings?.technicalSkill || 0"
                  :precision="1"
                >
                  <template #suffix>
                    /5
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="4">
                <el-statistic
                  title="服务效率"
                  :value="storeForm.ratingStats?.ratings?.serviceEfficiency || 0"
                  :precision="1"
                >
                  <template #suffix>
                    /5
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="4">
                <el-statistic
                  title="收费透明度"
                  :value="storeForm.ratingStats?.ratings?.pricingTransparency || 0"
                  :precision="1"
                >
                  <template #suffix>
                    /5
                  </template>
                </el-statistic>
              </el-col>
            </el-row>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="图片预览"
      width="600px"
    >
      <img
        :src="previewImageUrl"
        style="width: 100%"
      >
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Phone, Message, Plus, StarFilled, Upload } from '@element-plus/icons-vue'
import request from '@/utils/request'
import axios from 'axios'

const activeTab = ref('basic')
const saving = ref(false)
const uploading = ref(false)
const previewDialogVisible = ref(false)
const previewImageUrl = ref('')
const workingDays = ref(['1', '2', '3', '4', '5'])
const imageList = ref([])

// 门店表单数据
const storeForm = ref({
  name: '',
  storeType: 'comprehensive',
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
  businessHours: '8:00-18:00',
  serviceRange: 50,
  // 营业执照
  businessLicense: {
    number: '',
    url: ''
  },
  // 其他资质证书
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
  // 服务能力
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
  // 定价信息
  pricingInfo: {
    laborRates: {
      minorRepair: 0,
      mediumRepair: 0,
      majorRepair: 0
    },
    serviceFee: 0,
    additionalFeeNote: ''
  },
  // 银行账户
  bankAccount: {
    bankName: '',
    accountNumber: '',
    accountName: '',
    settlementCycle: 'monthly'
  },
  // 门店照片
  photos: [],
  // 评分统计
  ratingStats: {
    overallRating: 0,
    reviewCount: 0,
    ratings: {
      technicalSkill: 0,
      serviceEfficiency: 0,
      pricingTransparency: 0
    }
  }
})

// 地址数组（用于级联选择器）
const addressArray = ref([])

// 营业时间数组（用于时间选择器）
const businessHoursArray = ref(['08:00', '18:00'])

// 服务类型数组（用于 checkbox）
const serviceTypesArray = computed({
  get: () => storeForm.value.serviceCapabilities?.serviceTypes || [],
  set: (val) => {
    storeForm.value.serviceCapabilities.serviceTypes = val
  }
})

// 品牌专长文本
const brandSpecialtiesText = computed({
  get: () => (storeForm.value.serviceCapabilities?.brandSpecialties || []).join(','),
  set: (val) => {
    storeForm.value.serviceCapabilities.brandSpecialties = val.split(',').filter(s => s.trim())
  }
})

// 主修车型文本
const mainModelsText = computed({
  get: () => (storeForm.value.serviceCapabilities?.mainModels || []).join(','),
  set: (val) => {
    storeForm.value.serviceCapabilities.mainModels = val.split(',').filter(s => s.trim())
  }
})

// 获取用户所属门店ID
const userStoreId = computed(() => {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}')
  return user.storeInfo?.storeId
})

// 检查用户是否有关联门店
const hasStore = computed(() => {
  return !!userStoreId.value
})

// 获取门店信息
const fetchStoreInfo = async () => {
  if (!hasStore.value) {
    return
  }

  try {
    const res = await request({
      url: `/stores/${userStoreId.value}`,
      method: 'get'
    })

    if (res.data.store) {
      const store = res.data.store
      storeForm.value = {
        name: store.name || '',
        storeType: store.storeType || 'comprehensive',
        contact: {
          name: store.contact?.name || '',
          phone: store.contact?.phone || '',
          email: store.contact?.email || '',
          backupPhone: store.contact?.backupPhone || ''
        },
        address: {
          province: store.address?.province || '',
          city: store.address?.city || '',
          district: store.address?.district || '',
          detail: store.address?.detail || '',
          location: store.address?.location || { type: 'Point', coordinates: [0, 0] }
        },
        businessHours: store.businessHours || '8:00-18:00',
        serviceRange: store.serviceRange || 50,
        businessLicense: {
          number: store.businessLicense?.number || '',
          url: store.businessLicense?.url || ''
        },
        organizationCode: {
          number: store.organizationCode?.number || '',
          url: store.organizationCode?.url || ''
        },
        transportLicense: {
          number: store.transportLicense?.number || '',
          url: store.transportLicense?.url || ''
        },
        repairLicense: {
          number: store.repairLicense?.number || '',
          url: store.repairLicense?.url || ''
        },
        serviceCapabilities: {
          serviceTypes: store.serviceCapabilities?.serviceTypes || [],
          brandSpecialties: store.serviceCapabilities?.brandSpecialties || [],
          mainModels: store.serviceCapabilities?.mainModels || [],
          staffing: {
            seniorTechnicians: store.serviceCapabilities?.staffing?.seniorTechnicians || 0,
            technicians: store.serviceCapabilities?.staffing?.technicians || 0,
            workers: store.serviceCapabilities?.staffing?.workers || 0,
            apprentices: store.serviceCapabilities?.staffing?.apprentices || 0
          },
          dailyCapacity: {
            maxOrders: store.serviceCapabilities?.dailyCapacity?.maxOrders || 10,
            averageDuration: store.serviceCapabilities?.dailyCapacity?.averageDuration || 120
          }
        },
        pricingInfo: {
          laborRates: {
            minorRepair: store.pricingInfo?.laborRates?.minorRepair || 0,
            mediumRepair: store.pricingInfo?.laborRates?.mediumRepair || 0,
            majorRepair: store.pricingInfo?.laborRates?.majorRepair || 0
          },
          serviceFee: store.pricingInfo?.serviceFee || 0,
          additionalFeeNote: store.pricingInfo?.additionalFeeNote || ''
        },
        bankAccount: {
          bankName: store.bankAccount?.bankName || '',
          accountNumber: store.bankAccount?.accountNumber || '',
          accountName: store.bankAccount?.accountName || '',
          settlementCycle: store.bankAccount?.settlementCycle || 'monthly'
        },
        photos: store.photos || [],
        ratingStats: store.ratingStats || {
          overallRating: 0,
          reviewCount: 0,
          ratings: {
            technicalSkill: 0,
            serviceEfficiency: 0,
            pricingTransparency: 0
          }
        }
      }

      // 设置地址数组
      if (store.address?.province && store.address?.city && store.address?.district) {
        addressArray.value = [store.address.province, store.address.city, store.address.district]
      }

      // 解析营业时间
      if (store.businessHours) {
        const [start, end] = store.businessHours.split('-')
        businessHoursArray.value = [start, end]
      }

      // 设置图片列表
      if (store.photos && store.photos.length > 0) {
        imageList.value = store.photos.map((url, index) => ({
          uid: index,
          name: `image-${index}`,
          status: 'success',
          url
        }))
      }
    }
  } catch (error) {
    console.error('获取门店信息失败:', error)
    ElMessage.error('获取门店信息失败')
  }
}

// 地区变化
const handleRegionChange = (value) => {
  if (value && value.length === 3) {
    storeForm.value.address.province = value[0]
    storeForm.value.address.city = value[1]
    storeForm.value.address.district = value[2]
  }
}

// 营业时间变化
const handleBusinessHoursChange = (value) => {
  if (value && value.length === 2) {
    storeForm.value.businessHours = `${value[0]}-${value[1]}`
  }
}

// 保存基本信息
const handleSaveBasicInfo = async () => {
  if (!storeForm.value.name.trim()) {
    ElMessage.warning('请输入门店名称')
    return
  }
  if (!storeForm.value.contact.phone.trim()) {
    ElMessage.warning('请输入联系电话')
    return
  }
  if (!storeForm.value.address.detail.trim()) {
    ElMessage.warning('请输入详细地址')
    return
  }

  saving.value = true
  try {
    await request({
      url: `/stores/${userStoreId.value}`,
      method: 'put',
      data: {
        name: storeForm.value.name,
        contact: storeForm.value.contact,
        address: storeForm.value.address,
        businessHours: storeForm.value.businessHours,
        serviceRange: storeForm.value.serviceRange
      }
    })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 保存服务能力
const handleSaveCapability = async () => {
  saving.value = true
  try {
    await request({
      url: `/stores/${userStoreId.value}`,
      method: 'put',
      data: {
        serviceCapabilities: storeForm.value.serviceCapabilities
      }
    })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 保存定价信息
const handleSavePricing = async () => {
  saving.value = true
  try {
    await request({
      url: `/stores/${userStoreId.value}`,
      method: 'put',
      data: {
        pricingInfo: storeForm.value.pricingInfo
      }
    })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 保存资质证书
const handleSaveCertificates = async () => {
  if (!storeForm.value.businessLicense.number) {
    ElMessage.warning('请输入营业执照号码')
    return
  }
  if (!storeForm.value.businessLicense.url) {
    ElMessage.warning('请上传营业执照照片')
    return
  }

  saving.value = true
  try {
    await request({
      url: `/stores/${userStoreId.value}`,
      method: 'put',
      data: {
        businessLicense: storeForm.value.businessLicense,
        organizationCode: storeForm.value.organizationCode,
        transportLicense: storeForm.value.transportLicense,
        repairLicense: storeForm.value.repairLicense
      }
    })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 保存银行账户信息
const handleSaveBankInfo = async () => {
  if (!storeForm.value.bankAccount.bankName.trim()) {
    ElMessage.warning('请输入开户银行')
    return
  }
  if (!storeForm.value.bankAccount.accountNumber.trim()) {
    ElMessage.warning('请输入银行账号')
    return
  }
  if (!storeForm.value.bankAccount.accountName.trim()) {
    ElMessage.warning('请输入账户名称')
    return
  }

  saving.value = true
  try {
    await request({
      url: `/stores/${userStoreId.value}`,
      method: 'put',
      data: {
        bankAccount: storeForm.value.bankAccount
      }
    })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
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

// 资质证书上传
const handleUpload = async (options, type) => {
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
      storeForm.value[type].url = response.data.data.url
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

// 门店照片上传
const handlePhotoUpload = async (options) => {
  const { file, onSuccess, onError } = options

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.success) {
      // 更新 photos 数组
      storeForm.value.photos.push(response.data.data.url)

      // 保存到后端
      await request({
        url: `/stores/${userStoreId.value}`,
        method: 'put',
        data: {
          photos: storeForm.value.photos
        }
      })

      ElMessage.success('上传成功')
      onSuccess(response.data, file)
    } else {
      onError(new Error(response.data.message || '上传失败'))
    }
  } catch (error) {
    console.error('上传错误:', error)
    ElMessage.error('上传失败，请重试')
    onError(error)
  }
}

// 删除门店照片
const handlePhotoRemove = async (file) => {
  const index = imageList.value.findIndex(item => item.uid === file.uid)
  if (index > -1) {
    storeForm.value.photos.splice(index, 1)

    try {
      await request({
        url: `/stores/${userStoreId.value}`,
        method: 'put',
        data: {
          photos: storeForm.value.photos
        }
      })
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 图片预览
const handlePicturePreview = (uploadFile) => {
  previewImageUrl.value = uploadFile.url
  previewDialogVisible.value = true
}

onMounted(() => {
  fetchStoreInfo()
})
</script>

<style scoped lang="scss">
.store-settings {
  .card-header-title {
    font-weight: 600;
    color: #2c3e50;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;
  }

  .form-item-tip {
    margin-top: 8px;
    font-size: 13px;
    color: #909399;
    line-height: 1.5;
  }

  .uploaded-image-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  :deep(.el-statistic) {
    .el-statistic__head {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    .el-statistic__content {
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
    }
  }

  :deep(.el-tabs__content) {
    padding: 20px 0;
  }

  :deep(.el-upload-list__item) {
    transition: all 0.3s;
  }

  :deep(.el-upload--picture-card) {
    transition: all 0.3s;
  }
}
</style>
