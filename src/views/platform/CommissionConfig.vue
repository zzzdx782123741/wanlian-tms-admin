<template>
  <div class="commission-config-page">
    <div class="page-header">
      <h2>佣金配置管理</h2>
      <div class="header-stats">
        <el-statistic title="总配置数" :value="stats.total" />
        <el-statistic title="已启用" :value="stats.enabled" />
        <el-statistic title="已禁用" :value="stats.disabled" />
      </div>
    </div>

    <el-card style="margin-top: 20px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全局配置" name="global">
          <div class="tab-header">
            <span class="tab-desc">全局默认佣金比例，未命中其他配置时使用</span>
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

        <el-tab-pane label="服务类型配置" name="service_type">
          <div class="tab-header">
            <span class="tab-desc">按维修、保养、增项服务设置不同佣金比例</span>
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

        <el-tab-pane label="门店配置" name="store">
          <div class="tab-header">
            <span class="tab-desc">按具体门店设置佣金比例，优先级高于区域、服务类型和全局配置</span>
            <el-button type="primary" size="small" @click="handleCreate('store')">
              <el-icon><Plus /></el-icon>
              新增门店配置
            </el-button>
          </div>
          <ConfigTable
            :configs="storeConfigs"
            :loading="loading"
            @edit="handleEdit"
            @delete="handleDelete"
            @toggle="handleToggle"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <ConfigDialog
      v-model="dialogVisible"
      :config-type="dialogConfigType"
      :config="currentConfig"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  deleteCommissionConfig,
  getCommissionConfigStats,
  getCommissionConfigs,
  toggleCommissionConfig
} from '@/api/commission'
import ConfigDialog from './components/CommissionConfigDialog.vue'
import ConfigTable from './components/CommissionConfigTable.vue'

const activeTab = ref('global')
const loading = ref(false)
const dialogVisible = ref(false)
const dialogConfigType = ref('global')
const currentConfig = ref(null)

const stats = reactive({
  total: 0,
  enabled: 0,
  disabled: 0
})

const globalConfigs = ref([])
const serviceTypeConfigs = ref([])
const regionConfigs = ref([])
const storeConfigs = ref([])

const fetchStats = async () => {
  try {
    const res = await getCommissionConfigStats()
    Object.assign(stats, res.data || {})
  } catch (error) {
    console.error('获取佣金配置统计失败:', error)
  }
}

const fetchConfigs = async () => {
  loading.value = true
  try {
    const res = await getCommissionConfigs()
    const allConfigs = res.data?.list || []

    globalConfigs.value = allConfigs.filter(item => item.configType === 'global')
    serviceTypeConfigs.value = allConfigs.filter(item => item.configType === 'service_type')
    regionConfigs.value = allConfigs.filter(item => item.configType === 'region')
    storeConfigs.value = allConfigs.filter(item => item.configType === 'store')
  } catch (error) {
    console.error('获取佣金配置列表失败:', error)
    ElMessage.error(error.message || '获取佣金配置列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = (configType) => {
  dialogConfigType.value = configType
  currentConfig.value = null
  dialogVisible.value = true
}

const handleEdit = (config) => {
  dialogConfigType.value = config.configType
  currentConfig.value = config
  dialogVisible.value = true
}

const handleDelete = async (config) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配置“${config.name}”吗？删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteCommissionConfig(config._id)
    ElMessage.success('删除成功')
    await Promise.all([fetchConfigs(), fetchStats()])
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除佣金配置失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleToggle = async (config) => {
  try {
    await toggleCommissionConfig(config._id)
    ElMessage.success(config.enabled ? '已禁用' : '已启用')
    await Promise.all([fetchConfigs(), fetchStats()])
  } catch (error) {
    console.error('切换佣金配置状态失败:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

const handleDialogSuccess = async () => {
  await Promise.all([fetchConfigs(), fetchStats()])
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
