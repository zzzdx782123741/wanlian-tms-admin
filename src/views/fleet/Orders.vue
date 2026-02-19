<template>
  <div class="fleet-orders">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="订单类型">
          <el-select v-model="queryParams.type" placeholder="请选择" clearable>
            <el-option label="维修订单" value="repair" />
            <el-option label="保养订单" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable>
            <el-option label="待车队审批" value="awaiting_fleet_approval" />
            <el-option label="待评估" value="pending_assessment" />
            <el-option label="待审批" value="awaiting_approval" />
            <el-option label="维修中" value="in_repair" />
            <el-option label="已完成" value="completed" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 订单列表 -->
      <el-table
        v-loading="loading"
        :data="orderList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="orderNumber" label="订单号" width="180" />
        <el-table-column label="订单类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'maintenance' ? 'success' : 'primary'" size="small">
              {{ row.type === 'maintenance' ? '保养' : '维修' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vehicleId.plateNumber" label="车牌号" width="120" />
        <el-table-column prop="faultDescription" label="故障描述" show-overflow-tooltip />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span v-if="row.type === 'maintenance' && row.maintenanceOrder">
              ¥{{ row.maintenanceOrder.finalAmount || '-' }}
            </span>
            <span v-else-if="row.quote">
              ¥{{ row.quote.total }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <!-- 维修订单操作 -->
            <template v-if="row.type === 'repair'">
              <el-button
                v-if="row.status === 'awaiting_fleet_approval'"
                type="primary"
                size="small"
                @click="handleApprove(row)"
              >
                审批
              </el-button>
              <el-button
                v-if="row.status === 'approved'"
                type="success"
                size="small"
                @click="handlePay(row)"
              >
                支付
              </el-button>
            </template>
            <!-- 保养订单操作 -->
            <template v-if="row.type === 'maintenance'">
              <el-button
                v-if="row.status === 'awaiting_fleet_approval'"
                type="primary"
                size="small"
                @click="handleMaintenanceApprove(row)"
              >
                审批
              </el-button>
            </template>
            <el-button
              type="info"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
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
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchOrders"
        @current-change="fetchOrders"
      />
    </el-card>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="订单审批"
      width="600px"
    >
      <el-form :model="approveForm" label-width="120px">
        <el-form-item label="订单号">
          <el-input v-model="currentOrder.orderNumber" disabled />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input :value="currentOrder.vehicleId?.plateNumber || '-'" disabled />
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input
            :value="currentOrder.faultDescription"
            type="textarea"
            :rows="2"
            disabled
          />
        </el-form-item>

        <!-- 门店选择（车队管理员选门店模式） -->
        <el-form-item
          v-if="!currentOrder.storeId"
          label="选择门店"
          required
        >
          <el-select
            v-model="approveForm.storeId"
            placeholder="请选择维修门店"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="store in storeList"
              :key="store._id"
              :label="`${store.name} - ${store.address?.city || ''}${store.address?.district || ''}`"
              :value="store._id"
            />
          </el-select>
          <div class="form-tip">💡 此订单需要分配维修门店</div>
        </el-form-item>

        <!-- 已选择门店提示（司机已选门店模式） -->
        <el-form-item v-else label="维修门店">
          <el-input :value="currentOrder.storeId?.name || '-'" disabled />
          <div class="form-tip">✓ 司机已选择门店，无需更改</div>
        </el-form-item>

        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.approved">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="!approveForm.approved"
          label="拒绝原因"
          required
        >
          <el-input
            v-model="approveForm.rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
        <el-form-item v-else label="备注">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">确定</el-button>
      </template>
    </el-dialog>

    <!-- 支付确认对话框 -->
    <el-dialog
      v-model="payDialogVisible"
      title="确认支付"
      width="500px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单号">
          {{ currentOrder.orderNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="车牌号">
          {{ currentOrder.vehicleId?.plateNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="支付金额">
          <span style="color: #f56c6c; font-size: 20px; font-weight: bold">
            ¥{{ currentOrder.quote?.total || 0 }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="账户余额">
          ¥{{ accountBalance }}
        </el-descriptions-item>
      </el-descriptions>
      <el-alert
        v-if="accountBalance < (currentOrder.quote?.total || 0)"
        title="余额不足，请先充值"
        type="error"
        :closable="false"
        style="margin-top: 15px"
      />
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="accountBalance < (currentOrder.quote?.total || 0)"
          @click="confirmPay"
        >
          确认支付
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { getOrders } from '@/api/order'
import { payOrder, getBalance } from '@/api/account'
import { getStores } from '@/api/store'
import dayjs from 'dayjs'

const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const accountBalance = ref(0)
const storeList = ref([])

const queryParams = ref({
  page: 1,
  limit: 20,
  type: '',
  status: ''
})

const approveDialogVisible = ref(false)
const payDialogVisible = ref(false)
const currentOrder = ref({})
const approveForm = ref({
  approved: true,
  storeId: '',
  remark: '',
  rejectReason: ''
})

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrders(queryParams.value)
    orderList.value = res.data.orders || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取门店列表
const fetchStores = async () => {
  try {
    const res = await getStores({ status: 'normal' })
    storeList.value = res.data.stores || []
  } catch (error) {
    console.error('获取门店列表失败:', error)
  }
}

// 获取账户余额
const fetchBalance = async () => {
  try {
    const res = await getBalance()
    accountBalance.value = res.data.balance
  } catch (error) {
    console.error('获取余额失败:', error)
  }
}

// 查询
const handleQuery = () => {
  queryParams.value.page = 1
  fetchOrders()
}

// 重置
const handleReset = () => {
  queryParams.value = {
    page: 1,
    limit: 20,
    type: '',
    status: ''
  }
  fetchOrders()
}

// 保养审批
const handleMaintenanceApprove = (row) => {
  // 跳转到保养审批页面
  window.location.href = `/fleet-maintenance-approval?id=${row._id}`
}

// 车队审批
const handleApprove = (row) => {
  currentOrder.value = row
  approveForm.value = {
    approved: true,
    storeId: '',
    remark: '',
    rejectReason: ''
  }
  approveDialogVisible.value = true
}

// 确认车队审批
const confirmApprove = async () => {
  try {
    // 验证：如果订单没有门店，必须选择门店
    if (!currentOrder.value.storeId && !approveForm.value.storeId) {
      ElMessage.warning('请选择维修门店')
      return
    }

    // 如果拒绝，必须填写拒绝原因
    if (!approveForm.value.approved && !approveForm.value.rejectReason?.trim()) {
      ElMessage.warning('请填写拒绝原因')
      return
    }

    loading.value = true

    if (approveForm.value.approved) {
      // 审批通过 - 调用车队审批API
      const data = {
        storeId: approveForm.value.storeId || currentOrder.value.storeId,
        remark: approveForm.value.remark
      }
      await request({
        url: `/orders/${currentOrder.value._id}/fleet-approve`,
        method: 'post',
        data
      })
      ElMessage.success('审批成功')
    } else {
      // 拒绝订单
      await request({
        url: `/orders/${currentOrder.value._id}/fleet-reject`,
        method: 'post',
        data: {
          reason: approveForm.value.rejectReason
        }
      })
      ElMessage.success('已拒绝订单')
    }

    approveDialogVisible.value = false
    fetchOrders()
  } catch (error) {
    console.error('审批失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '审批失败')
  } finally {
    loading.value = false
  }
}

// 支付
const handlePay = (row) => {
  currentOrder.value = row
  payDialogVisible.value = true
}

// 确认支付
const confirmPay = async () => {
  try {
    await payOrder({ orderId: currentOrder.value._id })
    ElMessage.success('支付成功')
    payDialogVisible.value = false
    fetchOrders()
    fetchBalance()
  } catch (error) {
    console.error('支付失败:', error)
  }
}

// 查看详情
const handleViewDetail = (row) => {
  let detailHTML = ''

  if (row.type === 'maintenance') {
    // 保养订单详情
    const maint = row.maintenanceOrder || {}
    detailHTML = `
      <p><strong>订单号：</strong>${row.orderNumber}</p>
      <p><strong>订单类型：</strong>保养订单</p>
      <p><strong>车牌号：</strong>${row.vehicleId?.plateNumber}</p>
      <p><strong>保养类型：</strong>${maint.maintenanceTypeName || '-'}</p>
      <p><strong>套餐：</strong>${maint.packageName || maint.selectedTier || '-'}</p>
      <p><strong>服务地址：</strong>${maint.serviceLocation?.address || '-'}</p>
      <p><strong>期望时间：</strong>${maint.preferredTime || '-'}</p>
      <p><strong>司机备注：</strong>${maint.driverRemark || '-'}</p>
      <p><strong>最终金额：</strong>¥${maint.finalAmount || '-'}</p>
      <p><strong>车队备注：</strong>${maint.fleetRemark || '-'}</p>
    `
  } else {
    // 维修订单详情
    detailHTML = `
      <p><strong>订单号：</strong>${row.orderNumber}</p>
      <p><strong>订单类型：</strong>维修订单</p>
      <p><strong>车牌号：</strong>${row.vehicleId?.plateNumber}</p>
      <p><strong>故障描述：</strong>${row.faultDescription}</p>
      <p><strong>报价金额：</strong>¥${row.quote?.total || 0}</p>
      <p><strong>报价明细：</strong></p>
      <ul>
        ${(row.quote?.items || []).map(item => `<li>${item.item} × ${item.quantity} = ¥${item.price * item.quantity}</li>`).join('')}
      </ul>
    `
  }

  ElMessageBox.alert(detailHTML, '订单详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  })
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'awaiting_fleet_approval': 'info',
    'pending_assessment': 'warning',
    'awaiting_approval': 'warning',
    'in_repair': 'primary',
    'awaiting_addon_approval': 'warning',
    'completed': 'success',
    'refunded': 'info',
    'rejected': 'danger'
  }
  return typeMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'awaiting_fleet_approval': '待车队审批',
    'pending_assessment': '待评估',
    'awaiting_approval': '待审批',
    'in_repair': '维修中',
    'awaiting_addon_approval': '增项待审批',
    'completed': '已完成',
    'refunded': '已退款',
    'rejected': '已拒绝'
  }
  return textMap[status] || status
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  fetchOrders()
  fetchBalance()
  fetchStores()
})
</script>

<style scoped lang="scss">
.fleet-orders {
  .card-header {
    font-weight: 600;
    color: #2c3e50;
  }

  .search-form {
    margin-bottom: 20px;
  }

  .form-tip {
    margin-top: 5px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }
}
</style>
