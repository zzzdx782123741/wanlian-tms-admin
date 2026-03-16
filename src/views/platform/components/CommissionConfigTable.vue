<template>
  <el-table
    v-loading="loading"
    :data="configs"
    stripe
    style="width: 100%"
  >
    <el-table-column label="配置名称" min-width="220">
      <template #default="{ row }">
        <div class="config-name">
          <el-tag v-if="!row.enabled" type="info" size="small">已禁用</el-tag>
          <span>{{ row.name }}</span>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="维修佣金" width="120" align="center">
      <template #default="{ row }">
        <span class="commission-rate">{{ formatRate(row.repairCommissionRate, row.commissionRate) }}</span>
      </template>
    </el-table-column>

    <el-table-column label="保养佣金" width="120" align="center">
      <template #default="{ row }">
        <span class="commission-rate maintenance">{{ formatRate(row.maintenanceCommissionRate, row.commissionRate) }}</span>
      </template>
    </el-table-column>

    <el-table-column label="适用范围" min-width="260">
      <template #default="{ row }">
        <div v-if="row.configType === 'global'" class="scope-text">
          <el-tag type="warning" size="small">全局默认</el-tag>
        </div>

        <div v-else-if="row.configType === 'region'" class="scope-text">
          <el-tag type="success" size="small">{{ row.province }}</el-tag>
          <el-tag v-if="row.city" type="info" size="small" style="margin-left: 6px">
            {{ row.city }}
          </el-tag>
          <span v-else class="scope-note">全省</span>
        </div>

        <div v-else-if="row.configType === 'store'" class="scope-text">
          <el-tag type="danger" size="small">门店级</el-tag>
          <span class="store-name">{{ getStoreName(row) }}</span>
        </div>

        <div v-else class="scope-text">
          <el-tag type="info" size="small">历史配置</el-tag>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="说明" min-width="220">
      <template #default="{ row }">
        <span class="description">{{ row.description || '-' }}</span>
      </template>
    </el-table-column>

    <el-table-column label="状态" width="110" align="center">
      <template #default="{ row }">
        <el-switch
          :model-value="row.enabled"
          active-text="启用"
          inactive-text="禁用"
          @change="$emit('toggle', row)"
        />
      </template>
    </el-table-column>

    <el-table-column label="创建时间" width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
    </el-table-column>

    <el-table-column label="操作" width="140" fixed="right">
      <template #default="{ row }">
        <el-button type="primary" size="small" link @click="$emit('edit', row)">
          编辑
        </el-button>
        <el-button type="danger" size="small" link @click="$emit('delete', row)">
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import dayjs from 'dayjs'

defineProps({
  configs: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['edit', 'delete', 'toggle'])

const formatRate = (value, fallbackValue) => {
  const numericValue = Number(value ?? fallbackValue ?? 0)
  return `${(numericValue * 100).toFixed(1)}%`
}

const getStoreName = (row) => row.storeName || row.storeId?.name || '未关联门店'

const formatDateTime = (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
</script>

<style scoped lang="scss">
.config-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.commission-rate {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;

  &.maintenance {
    color: #e6a23c;
  }
}

.scope-text {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.scope-note {
  color: #909399;
  font-size: 12px;
}

.store-name {
  color: #303133;
  font-weight: 500;
}

.description {
  color: #909399;
  font-size: 14px;
}
</style>
