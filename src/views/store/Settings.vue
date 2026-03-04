<template>
  <div class="store-settings">
    <!-- 未关联门店提示 -->
    <el-card v-if="!hasStore">
      <el-result icon="warning" title="未关联门店" sub-title="您的账号尚未关联门店，无法访问门店设置">
        <template #extra>
          <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
        </template>
      </el-result>
    </el-card>

    <!-- 门店基本信息 -->
    <el-card v-else>
      <template #header>
        <div class="card-header">
          <span class="card-header-title">门店基本信息</span>
          <el-button
            type="primary"
            size="small"
            @click="handleSaveBasicInfo"
            :loading="saving"
          >
            <el-icon><Check /></el-icon>
            保存
          </el-button>
        </div>
      </template>

      <el-form :model="storeForm" label-width="120px" style="max-width: 800px">
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

        <el-divider content-position="left">地址信息</el-divider>

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
          <span style="margin-left: 12px; color: #909399;">公里</span>
          <div class="form-item-tip">
            门店提供上门服务的最大半径范围
          </div>
        </el-form-item>

        <el-divider content-position="left">营业时间</el-divider>

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
            <el-checkbox label="1">周一</el-checkbox>
            <el-checkbox label="2">周二</el-checkbox>
            <el-checkbox label="3">周三</el-checkbox>
            <el-checkbox label="4">周四</el-checkbox>
            <el-checkbox label="5">周五</el-checkbox>
            <el-checkbox label="6">周六</el-checkbox>
            <el-checkbox label="7">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 银行账户信息 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span class="card-header-title">银行账户信息</span>
          <el-button
            type="primary"
            size="small"
            @click="handleSaveBankInfo"
            :loading="saving"
          >
            <el-icon><Check /></el-icon>
            保存
          </el-button>
        </div>
      </template>

      <el-form :model="storeForm.bankAccount" label-width="120px" style="max-width: 600px">
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
      </el-form>
    </el-card>

    <!-- 门店图片 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span class="card-header-title">门店图片</span>
      </template>

      <el-form label-width="120px">
        <el-form-item label="门店照片">
          <el-upload
            v-model:file-list="imageList"
            action="/api/upload"
            list-type="picture-card"
            :on-preview="handlePicturePreview"
            :on-success="handleUploadSuccess"
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

    <!-- 数据统计 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span class="card-header-title">门店数据</span>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="综合评分" :value="storeForm.ratingStats?.overallRating || 0" :precision="1">
            <template #suffix>
              <el-icon color="#F7BA2A" style="vertical-align: -2px"><StarFilled /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="评价数量" :value="storeForm.ratingStats?.reviewCount || 0" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="技术专业度" :value="storeForm.ratingStats?.ratings?.technicalSkill || 0" :precision="1">
            <template #suffix>/5</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="服务效率" :value="storeForm.ratingStats?.ratings?.serviceEfficiency || 0" :precision="1">
            <template #suffix>/5</template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="图片预览" width="600px">
      <img :src="previewImageUrl" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElResult } from 'element-plus'
import { Check, Phone, Message, Plus, StarFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'

const saving = ref(false)
const previewDialogVisible = ref(false)
const previewImageUrl = ref('')
const workingDays = ref(['1', '2', '3', '4', '5'])
const imageList = ref([])

// 门店表单数据
const storeForm = ref({
  name: '',
  contact: {
    name: '',
    phone: '',
    email: ''
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
  bankAccount: {
    bankName: '',
    accountNumber: '',
    accountName: ''
  },
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
    ElMessage.warning('您尚未关联门店，请联系管理员')
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
        contact: {
          name: store.contact?.name || '',
          phone: store.contact?.phone || '',
          email: store.contact?.email || ''
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
        bankAccount: {
          bankName: store.bankAccount?.bankName || '',
          accountNumber: store.bankAccount?.accountNumber || '',
          accountName: store.bankAccount?.accountName || ''
        },
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
  // 验证必填字段
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

// 图片预览
const handlePicturePreview = (uploadFile) => {
  previewImageUrl.value = uploadFile.url
  previewDialogVisible.value = true
}

// 上传前验证
const beforeUpload = (file) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！')
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = (response, uploadFile) => {
  if (response.success) {
    ElMessage.success('上传成功')
  }
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

  :deep(.el-upload-list__item) {
    transition: all 0.3s;
  }

  :deep(.el-upload--picture-card) {
    transition: all 0.3s;
  }
}
</style>
