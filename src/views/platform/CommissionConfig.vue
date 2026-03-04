<template>
  <div class="commission-config-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>佣金配置管理</h2>
      <div class="header-stats">
        <el-statistic title="总配置数" :value="stats.total" />
        <el-statistic title="已启用" :value="stats.enabled" />
        <el-statistic title="已禁用" :value="stats.disabled" />
      </div>
    </div>

    <!-- 配置类型Tab -->
    <el-card style="margin-top: 20px">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 全局配置 -->
        <el-tab-pane label="全局配置" name="global">
          <div class="tab-header">
            <span class="tab-desc">全局默认佣金比例（当没有匹配到其他配置时使用）</span>
            <el-button type="primary" size="small" @click="handleCreate('global')">
              <el-icon><Plus /></el-icon>
              新增全局配置
            </el-button>
          </div>
          <ConfigTable
            :configs="globalConfigs"
            :loading="loading"
            @edit="handleEdit"
            @delete="handleDelete"
            @toggle="handleToggle"
          />
        </el-tab-pane>

        <!-- 服务类型配置 -->
        <el-tab-pane label="服务类型配置" name="service_type">
          <div class="tab-header">
            <span class="tab-desc">按服务类型设置不同佣金比例（维修/保养/增项）</span>
            <el-button type="primary" size="small" @click="handleCreate('service_type')">
              <el-icon><Plus /></el-icon>
              新增服务类型配置
            </el-button>
          </div>
          <ConfigTable
            :configs="serviceTypeConfigs"
            :loading="loading"
            @edit="handleEdit"
            @delete="handleDelete"
            @toggle="handleToggle"
          />
        </el-tab-pane>

        <!-- 区域配置 -->
        <el-tab-pane label="区域配置" name="region">
          <div class="tab-header">
            <span class="tab-desc">按省市设置不同佣金比例</span>
            <el-button type="primary" size="small" @click="handleCreate('region')">
              <el-icon><Plus /></el-icon>
              新增区域配置
            </el-button>
          </div>
          <ConfigTable
            :configs="regionConfigs"
            :loading="loading"
            @edit="handleEdit"
            @delete="handleDelete"
            @toggle="handleToggle"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 配置编辑对话框 -->
    <ConfigDialog
      v-model="dialogVisible"
      :config-type="dialogConfigType"
      :config="currentConfig"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getCommissionConfigs,
  getCommissionConfigStats,
  deleteCommissionConfig,
  toggleCommissionConfig
} from '@/api/commission'
import ConfigTable from './components/CommissionConfigTable.vue'
import ConfigDialog from './components/CommissionConfigDialog.vue'

const activeTab = ref('global')
const loading = ref(false)
const dialogVisible = ref(false)
const dialogConfigType = ref('')

// 统计数据
const stats = reactive({
  total: 0,
  enabled: 0,
  disabled: 0
})

// 配置列表
const globalConfigs = ref([])
const serviceTypeConfigs = ref([])
const regionConfigs = ref([])

// 当前编辑的配置
const currentConfig = ref(null)

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await getCommissionConfigStats()
    Object.assign(stats, res.data)
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 获取配置列表
const fetchConfigs = async () => {
  loading.value = true
  try {
    const res = await getCommissionConfigs({ enabled: undefined })
    const allConfigs = res.data.list || []

    // 按类型分组
    globalConfigs.value = allConfigs.filter(c => c.configType === 'global')
    serviceTypeConfigs.value = allConfigs.filter(c => c.configType === 'service_type')
    regionConfigs.value = allConfigs.filter(c => c.configType === 'region')
  } catch (error) {
    console.error('获取配置列表失败:', error)
    ElMessage.error('获取配置列表失败')
  } finally {
    loading.value = false
  }
}

// Tab切换
const handleTabChange = () => {
  // 可以在这里添加特定逻辑
}

// 新增配置
const handleCreate = (configType) => {
  dialogConfigType.value = configType
  currentConfig.value = null
  dialogVisible.value = true
}

// 编辑配置
const handleEdit = (config) => {
  dialogConfigType.value = config.configType
  currentConfig.value = config
  dialogVisible.value = true
}

// 删除配置
const handleDelete = async (config) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配置"${config.name}"吗？删除后将无法恢复！`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    await deleteCommissionConfig(config._id)
    ElMessage.success('删除成功')
    await fetchConfigs()
    await fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 切换启用状态
const handleToggle = async (config) => {
  try {
    await toggleCommissionConfig(config._id)
    ElMessage.success(config.enabled ? '已禁用' : '已启用')
    await fetchConfigs()
    await fetchStats()
  } catch (error) {
    console.error('切换状态失败:', error)
    ElMessage.error('操作失败')
  }
}

// 对话框成功回调
const handleDialogSuccess = () => {
  fetchConfigs()
  fetchStats()
}

onMounted(() => {
  fetchConfigs()
  fetchStats()
})
</script>

<style scoped lang="scss">
.commission-config-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .header-stats {
      display: flex;
      gap: 40px;

      :deep(.el-statistic) {
        .el-statistic__head {
          font-size: 14px;
          color: #909399;
        }

        .el-statistic__number {
          font-size: 24px;
          font-weight: 600;
        }
      }
    }
  }

  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #ebeef5;

    .tab-desc {
      color: #909399;
      font-size: 14px;
    }
  }
}
</style>
