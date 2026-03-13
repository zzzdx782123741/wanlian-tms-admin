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

    <el-table-column label="佣金比例" width="120" align="center">
      <template #default="{ row }">
        <span class="commission-rate">{{ (Number(row.commissionRate || 0) * 100).toFixed(1) }}%</span>
      </template>
    </el-table-column>

    <el-table-column label="适用范围" min-width="260">
      <template #default="{ row }">
        <div v-if="row.configType === 'global'" class="scope-text">
          <el-tag type="warning" size="small">全局默认</el-tag>
        </div>

        <div v-else-if="row.configType === 'service_type'" class="scope-text">
          <el-tag
            v-for="type in row.serviceTypes"
            :key="type"
            :type="getServiceTypeTag(type)"
            size="small"
            style="margin-right: 6px"
          >
            {{ getServiceTypeName(type) }}
          </el-tag>
        </div>

        <div v-else-if="row.configType === 'region'" class="scope-text">
          <el-tag type="success" size="small">{{ row.province }}</el-tag>
          <el-tag v-if="row.city" type="info" size="small" style="margin-left: 6px">
            {{ row.city }}
          </el-tag>
        </div>

        <div v-else-if="row.configType === 'store'" class="scope-text">
          <el-tag type="danger" size="small">门店级</el-tag>
          <span class="store-name">{{ getStoreName(row) }}</span>
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

const getServiceTypeName = (type) => {
  const map = {
    repair: '维修',
    maintenance: '保养',
    addon: '增项'
  }
  return map[type] || type
}

const getServiceTypeTag = (type) => {
  const map = {
    repair: 'danger',
    maintenance: 'warning',
    addon: 'success'
  }
  return map[type] || 'info'
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
}

.scope-text {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.store-name {
  margin-left: 8px;
  color: #303133;
  font-weight: 500;
}

.description {
  color: #909399;
  font-size: 14px;
}
</style>
