<template>
  <div class="platform-stores">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="总门店数"
            :value="stats.totalStores"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="待审核"
            :value="stats.pendingStores"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="正常营业"
            :value="stats.normalStores"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-info">
          <el-statistic
            title="本月新增"
            :value="stats.newStores"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 门店列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>门店列表</span>
          <div class="header-actions">
            <el-button
              type="success"
              size="small"
              @click="handleRegister"
            >
              <el-icon><Plus /></el-icon>
              注册门店
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleRefresh"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form
        :inline="true"
        class="search-form"
      >
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部"
            clearable
            style="width: 160px"
          >
            <el-option
              label="待审核"
              value="pending_audit"
            />
            <el-option
              label="正常"
              value="normal"
            />
            <el-option
              label="已停用"
              value="suspended"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="门店名称/联系人/电话"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button
              type="primary"
              @click="handleQuery"
            >
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset">
              重置
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="storeList"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="name"
          label="门店名称"
          min-width="200"
        />
        <el-table-column
          label="联系人"
          width="120"
        >
          <template #default="{ row }">
            {{ row.contact?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="联系电话"
          width="140"
        >
          <template #default="{ row }">
            {{ row.contact?.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="服务范围"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            {{ row.serviceRange }} km
          </template>
        </el-table-column>
        <el-table-column
          label="技师数"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            {{ row.technicianCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column
          label="营业时间"
          width="140"
        >
          <template #default="{ row }">
            {{ row.businessHours || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          width="110"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="240"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending_audit'"
              type="success"
              size="small"
              link
              @click="handleApprove(row)"
            >
              审核
            </el-button>
            <el-dropdown
              v-if="row.status !== 'pending_audit'"
              style="margin-left: 10px"
            >
              <el-button
                type="primary"
                size="small"
                link
              >
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="row.status === 'normal'"
                    @click="handleUpdateStatus(row, 'suspended')"
                  >
                    <el-icon><Lock /></el-icon>
                    停用
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 'suspended'"
                    @click="handleUpdateStatus(row, 'normal')"
                  >
                    <el-icon><Unlock /></el-icon>
                    启用
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    @click="handleDelete(row)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px"
        @size-change="fetchStores"
        @current-change="fetchStores"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="门店详情"
      width="700px"
    >
      <el-descriptions
        v-if="currentStore._id"
        :column="2"
        border
      >
        <el-descriptions-item
          label="门店名称"
          :span="2"
        >
          {{ currentStore.name }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentStore.status)">
            {{ getStatusText(currentStore.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="营业时间">
          {{ currentStore.businessHours }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">
          {{ currentStore.contact?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ currentStore.contact?.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="邮箱"
          :span="2"
        >
          {{ currentStore.contact?.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="服务范围">
          {{ currentStore.serviceRange }} 公里
        </el-descriptions-item>
        <el-descriptions-item label="银行账户">
          {{ currentStore.bankAccount?.bankName }} - {{ currentStore.bankAccount?.accountNumber }}
        </el-descriptions-item>
        <el-descriptions-item
          label="地址"
          :span="2"
        >
          {{ currentStore.address?.province }}{{ currentStore.address?.city }}{{ currentStore.address?.district }}{{ currentStore.address?.detail }}
        </el-descriptions-item>
        <el-descriptions-item
          label="创建时间"
          :span="2"
        >
          {{ formatDateTime(currentStore.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 技师列表 -->
      <template v-if="currentStore.technicians && currentStore.technicians.length">
        <el-divider content-position="left">
          门店技师
        </el-divider>
        <el-table
          :data="currentStore.technicians"
          size="small"
          max-height="200"
        >
          <el-table-column
            prop="nickname"
            label="昵称"
          />
          <el-table-column
            prop="name"
            label="姓名"
          />
          <el-table-column
            prop="phone"
            label="电话"
          />
          <el-table-column
            prop="technicianCert"
            label="资质证书"
          />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag
                :type="row.role?.status === 'normal' ? 'success' : 'danger'"
                size="small"
              >
                {{ row.role?.status === 'normal' ? '正常' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="门店审核"
      width="500px"
    >
      <el-form
        :model="approveForm"
        label-width="80px"
      >
        <el-form-item label="门店名称">
          <el-input
            :value="currentStore.name"
            disabled
          />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input
            :value="currentStore.contact?.name"
            disabled
          />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input
            :value="currentStore.contact?.phone"
            disabled
          />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="approveForm.approved">
            <el-radio :label="true">
              通过
            </el-radio>
            <el-radio :label="false">
              拒绝
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="confirmApprove"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStores, getStoreDetail, approveStore, updateStoreStatus, deleteStore, getStoreStats } from '@/api/store'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const storeList = ref([])
const total = ref(0)
const stats = ref({
  totalStores: 0,
  pendingStores: 0,
  normalStores: 0,
  newStores: 0
})

const queryParams = ref({
  page: 1,
  limit: 20,
  status: '',
  keyword: ''
})

const detailDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const currentStore = ref({})
const approveForm = ref({
  approved: true,
  remark: ''
})

// 获取门店列表
const fetchStores = async () => {
  loading.value = true
  try {
    const res = await getStores(queryParams.value)
    storeList.value = res.data.stores || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取门店列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await getStoreStats()
    stats.value = res.data
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 查询
const handleQuery = () => {
  queryParams.value.page = 1
  fetchStores()
}

// 重置
const handleReset = () => {
  queryParams.value = {
    page: 1,
    limit: 20,
    status: '',
    keyword: ''
  }
  fetchStores()
}

// 刷新
const handleRefresh = () => {
  fetchStores()
  fetchStats()
}

// 注册门店
const handleRegister = () => {
  router.push('/store-register')
}

// 查看详情
const handleViewDetail = async (row) => {
  try {
    const res = await getStoreDetail(row._id)
    // 后端返回的数据结构是 { store, technicians }
    currentStore.value = {
      ...res.data.store,
      technicians: res.data.technicians || []
    }
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取门店详情失败')
  }
}

// 审核
const handleApprove = (row) => {
  currentStore.value = row
  approveForm.value = {
    approved: true,
    remark: ''
  }
  approveDialogVisible.value = true
}

// 确认审核
const confirmApprove = async () => {
  try {
    await approveStore(currentStore.value._id, approveForm.value)
    ElMessage.success('审核成功')
    approveDialogVisible.value = false
    fetchStores()
    fetchStats()
  } catch (error) {
    console.error('审核失败:', error)
  }
}

// 更新状态
const handleUpdateStatus = async (row, status) => {
  const statusText = status === 'normal' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定要${statusText}该门店吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateStoreStatus(row._id, { status })
    ElMessage.success(`${statusText}成功`)
    fetchStores()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新状态失败:', error)
    }
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该门店吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    await deleteStore(row._id)
    ElMessage.success('删除成功')
    fetchStores()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'pending_audit': 'warning',
    'normal': 'success',
    'suspended': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending_audit': '待审核',
    'normal': '正常',
    'suspended': '已停用'
  }
  return textMap[status] || status
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 格式化日期时间
const formatDateTime = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchStores()
  fetchStats()
})
</script>

<style scoped lang="scss">
.platform-stores {
  .stat-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.stat-card-warning :deep(.el-statistic__number) {
      color: #e6a23c;
    }

    &.stat-card-success :deep(.el-statistic__number) {
      color: #67c23a;
    }

    &.stat-card-info :deep(.el-statistic__number) {
      color: #409eff;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .search-form {
    margin-bottom: 20px;

    .form-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}
</style>
