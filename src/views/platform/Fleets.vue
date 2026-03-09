<template>
  <div class="platform-fleets">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="总车队数"
            :value="stats.totalFleets"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="待审核"
            :value="stats.pendingFleets"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="正常运营"
            :value="stats.normalFleets"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-info">
          <el-statistic
            title="本月新增"
            :value="stats.newFleets"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 车队列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>车队列表</span>
          <div class="header-actions">
            <el-button
              type="success"
              size="small"
              @click="handleRegister"
            >
              <el-icon><Plus /></el-icon>
              注册车队
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
            placeholder="车队名称/联系人/电话"
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
        :data="fleetList"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="name"
          label="车队名称"
          min-width="180"
        />
        <el-table-column
          label="规模"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            {{ row.scale }} 辆
          </template>
        </el-table-column>
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
          label="账户余额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: 600">
              ¥{{ row.accountBalance?.toLocaleString() || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="车辆数"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            {{ row.vehicleCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column
          label="管理员"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            {{ row.managerCount || 0 }}
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
        @size-change="fetchFleets"
        @current-change="fetchFleets"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="车队详情"
      width="800px"
    >
      <el-descriptions
        v-if="currentFleet._id"
        :column="2"
        border
      >
        <el-descriptions-item
          label="车队名称"
          :span="2"
        >
          {{ currentFleet.name }}
        </el-descriptions-item>
        <el-descriptions-item label="车队规模">
          {{ currentFleet.scale }} 辆
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentFleet.status)">
            {{ getStatusText(currentFleet.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系人">
          {{ currentFleet.contact?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ currentFleet.contact?.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="邮箱"
          :span="2"
        >
          {{ currentFleet.contact?.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="地址"
          :span="2"
        >
          {{ currentFleet.address?.province }}{{ currentFleet.address?.city }}{{ currentFleet.address?.district }}{{ currentFleet.address?.detail }}
        </el-descriptions-item>
        <el-descriptions-item label="账户余额">
          <span style="color: #67c23a; font-weight: 600; font-size: 18px">
            ¥{{ currentFleet.account?.balance?.toLocaleString() || 0 }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="车辆统计">
          正常: {{ currentFleet.vehicleStats?.normal || 0 }} |
          维修中: {{ currentFleet.vehicleStats?.repairing || 0 }} |
          报废: {{ currentFleet.vehicleStats?.scrapped || 0 }}
        </el-descriptions-item>
        <el-descriptions-item
          label="创建时间"
          :span="2"
        >
          {{ formatDateTime(currentFleet.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 管理员列表 -->
      <template v-if="currentFleet.managers && currentFleet.managers.length">
        <el-divider content-position="left">
          车队管理员
        </el-divider>
        <el-table
          :data="currentFleet.managers"
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

      <!-- 车辆列表 -->
      <template v-if="currentFleet.vehicles && currentFleet.vehicles.length">
        <el-divider content-position="left">
          车队车辆
        </el-divider>
        <el-table
          :data="currentFleet.vehicles"
          size="small"
          max-height="200"
        >
          <el-table-column
            prop="plateNumber"
            label="车牌号"
          />
          <el-table-column
            prop="brand"
            label="品牌"
          />
          <el-table-column
            prop="model"
            label="车型"
          />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag
                :type="getVehicleStatusType(row.status)"
                size="small"
              >
                {{ getVehicleStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="车队审核"
      width="500px"
    >
      <el-form
        :model="approveForm"
        label-width="80px"
      >
        <el-form-item label="车队名称">
          <el-input
            :value="currentFleet.name"
            disabled
          />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input
            :value="currentFleet.contact?.name"
            disabled
          />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input
            :value="currentFleet.contact?.phone"
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
import { getFleets, getFleetDetail, approveFleet, updateFleetStatus, deleteFleet, getFleetStats } from '@/api/fleet'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const fleetList = ref([])
const total = ref(0)
const stats = ref({
  totalFleets: 0,
  pendingFleets: 0,
  normalFleets: 0,
  newFleets: 0
})

const queryParams = ref({
  page: 1,
  limit: 20,
  status: '',
  keyword: ''
})

const detailDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const currentFleet = ref({})
const approveForm = ref({
  approved: true,
  remark: ''
})

// 获取车队列表
const fetchFleets = async () => {
  loading.value = true
  try {
    const res = await getFleets(queryParams.value)
    fleetList.value = res.data.fleets || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取车队列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await getFleetStats()
    stats.value = res.data
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 查询
const handleQuery = () => {
  queryParams.value.page = 1
  fetchFleets()
}

// 重置
const handleReset = () => {
  queryParams.value = {
    page: 1,
    limit: 20,
    status: '',
    keyword: ''
  }
  fetchFleets()
}

// 刷新
const handleRefresh = () => {
  fetchFleets()
  fetchStats()
}

// 注册车队
const handleRegister = () => {
  router.push('/fleet-register')
}

// 查看详情
const handleViewDetail = async (row) => {
  try {
    const res = await getFleetDetail(row._id)
    currentFleet.value = res.data
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

// 审核
const handleApprove = (row) => {
  currentFleet.value = row
  approveForm.value = {
    approved: true,
    remark: ''
  }
  approveDialogVisible.value = true
}

// 确认审核
const confirmApprove = async () => {
  try {
    await approveFleet(currentFleet.value._id, approveForm.value)
    ElMessage.success('审核成功')
    approveDialogVisible.value = false
    fetchFleets()
    fetchStats()
  } catch (error) {
    console.error('审核失败:', error)
  }
}

// 更新状态
const handleUpdateStatus = async (row, status) => {
  const statusText = status === 'normal' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定要${statusText}该车队吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateFleetStatus(row._id, { status })
    ElMessage.success(`${statusText}成功`)
    fetchFleets()
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
    await ElMessageBox.confirm('确定要删除该车队吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    await deleteFleet(row._id)
    ElMessage.success('删除成功')
    fetchFleets()
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
  return typeMap[status] || ''
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

// 获取车辆状态类型
const getVehicleStatusType = (status) => {
  const typeMap = {
    'normal': 'success',
    'repairing': 'warning',
    'scrapped': 'danger'
  }
  return typeMap[status] || ''
}

// 获取车辆状态文本
const getVehicleStatusText = (status) => {
  const textMap = {
    'normal': '正常',
    'repairing': '维修中',
    'scrapped': '已报废'
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
  fetchFleets()
  fetchStats()
})
</script>

<style scoped lang="scss">
.platform-fleets {
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
