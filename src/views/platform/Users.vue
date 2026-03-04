<template>
  <div class="platform-users">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="4">
        <el-card class="stat-card">
          <el-statistic title="总用户数" :value="stats.totalUsers" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-primary">
          <el-statistic title="司机" :value="stats.drivers" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-success">
          <el-statistic title="车队管理员" :value="stats.fleetManagers" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-warning">
          <el-statistic title="门店技师" :value="stats.technicians" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-info">
          <el-statistic title="平台运营" :value="stats.operators" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card stat-card-danger">
          <el-statistic title="本月新增" :value="stats.newUsers" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" size="small" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="角色">
          <el-select v-model="queryParams.roleType" placeholder="全部" clearable style="width: 150px">
            <el-option label="司机" value="DRIVER" />
            <el-option label="车队管理员" value="FLEET_MANAGER" />
            <el-option label="门店技师" value="STORE_TECHNICIAN" />
            <el-option label="平台运营" value="PLATFORM_OPERATOR" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" value="normal" />
            <el-option label="待审核" value="pending_audit" />
            <el-option label="已停用" value="suspended" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="昵称/姓名/电话/OpenID"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button type="primary" @click="handleQuery">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        style="width: 100%"
      >
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="50" :src="row.avatar">
              {{ row.nickname?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role?.type)">
              {{ getRoleText(row.role?.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="所属车队" width="150">
          <template #default="{ row }">
            {{ row.fleetName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="所属门店" width="150">
          <template #default="{ row }">
            {{ row.storeName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.role?.status)">
              {{ getStatusText(row.role?.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="110">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-dropdown v-if="row.role?.status !== 'pending_audit'" style="margin-left: 10px">
              <el-button type="primary" size="small" link>
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="row.role?.status === 'normal'"
                    @click="handleUpdateStatus(row, 'suspended')"
                  >
                    <el-icon><Lock /></el-icon>
                    停用
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.role?.status === 'suspended'"
                    @click="handleUpdateStatus(row, 'normal')"
                  >
                    <el-icon><Unlock /></el-icon>
                    启用
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
        @size-change="fetchUsers"
        @current-change="fetchUsers"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="700px"
    >
      <el-descriptions v-if="currentUser._id" :column="2" border>
        <el-descriptions-item label="头像" :span="2">
          <el-avatar :size="80" :src="currentUser.avatar">
            {{ currentUser.nickname?.charAt(0) }}
          </el-avatar>
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ currentUser.nickname }}
        </el-descriptions-item>
        <el-descriptions-item label="姓名">
          {{ currentUser.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="电话">
          {{ currentUser.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="身份证号">
          {{ currentUser.idCard ? currentUser.idCard.replace(/(.{6})(.*)(.{4})/, '$1****$3') : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="OpenID" :span="2">
          {{ currentUser.openid }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="getRoleType(currentUser.role?.type)">
            {{ getRoleText(currentUser.role?.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentUser.role?.status)">
            {{ getStatusText(currentUser.role?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属车队" v-if="currentUser.role?.type === 'FLEET_MANAGER'">
          {{ currentUser.fleetInfo?.fleetName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="所属门店" v-if="currentUser.role?.type === 'STORE_TECHNICIAN'">
          {{ currentUser.storeInfo?.storeName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="2">
          {{ formatDateTime(currentUser.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="最后更新" :span="2">
          {{ formatDateTime(currentUser.updatedAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, getUserDetail, updateUserStatus, getUserStats } from '@/api/user'
import dayjs from 'dayjs'

const loading = ref(false)
const userList = ref([])
const total = ref(0)
const stats = ref({
  totalUsers: 0,
  drivers: 0,
  fleetManagers: 0,
  technicians: 0,
  operators: 0,
  newUsers: 0
})

const queryParams = ref({
  page: 1,
  limit: 20,
  roleType: '',
  status: '',
  keyword: ''
})

const detailDialogVisible = ref(false)
const currentUser = ref({})

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers(queryParams.value)
    userList.value = res.data.users || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await getUserStats()
    stats.value = res.data
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 查询
const handleQuery = () => {
  queryParams.value.page = 1
  fetchUsers()
}

// 重置
const handleReset = () => {
  queryParams.value = {
    page: 1,
    limit: 20,
    roleType: '',
    status: '',
    keyword: ''
  }
  fetchUsers()
}

// 刷新
const handleRefresh = () => {
  fetchUsers()
  fetchStats()
}

// 查看详情
const handleViewDetail = async (row) => {
  try {
    const res = await getUserDetail(row._id)
    currentUser.value = res.data
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

// 更新状态
const handleUpdateStatus = async (row, status) => {
  const statusText = status === 'normal' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定要${statusText}该用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateUserStatus(row._id, { status })
    ElMessage.success(`${statusText}成功`)
    fetchUsers()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新状态失败:', error)
    }
  }
}

// 获取角色类型
const getRoleType = (role) => {
  const typeMap = {
    'DRIVER': '',
    'FLEET_MANAGER': 'success',
    'STORE_TECHNICIAN': 'warning',
    'PLATFORM_OPERATOR': 'danger'
  }
  return typeMap[role] || ''
}

// 获取角色文本
const getRoleText = (role) => {
  const textMap = {
    'DRIVER': '司机',
    'FLEET_MANAGER': '车队管理员',
    'STORE_TECHNICIAN': '门店技师',
    'PLATFORM_OPERATOR': '平台运营'
  }
  return textMap[role] || role
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'normal': 'success',
    'pending_audit': 'warning',
    'suspended': 'danger'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'normal': '正常',
    'pending_audit': '待审核',
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
  fetchUsers()
  fetchStats()
})
</script>

<style scoped lang="scss">
.platform-users {
  .stat-card {
    margin-bottom: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.stat-card-primary :deep(.el-statistic__number) {
      color: #409eff;
    }

    &.stat-card-success :deep(.el-statistic__number) {
      color: #67c23a;
    }

    &.stat-card-warning :deep(.el-statistic__number) {
      color: #e6a23c;
    }

    &.stat-card-info :deep(.el-statistic__number) {
      color: #909399;
    }

    &.stat-card-danger :deep(.el-statistic__number) {
      color: #f56c6c;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;
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
