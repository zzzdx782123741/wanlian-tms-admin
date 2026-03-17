<template>
  <div class="fleet-orders">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="待审批"
            :value="stats.pendingApproval"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-info">
          <el-statistic
            title="维修中"
            :value="stats.inRepair"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="待确认"
            :value="stats.pendingConfirmation"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="本月费用"
            :value="stats.monthlyAmount"
            :precision="2"
            prefix="¥"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
          <div class="header-actions">
            <el-button
              type="success"
              size="small"
              :loading="exporting"
              @click="exportExcel"
            >
              <el-icon><Download /></el-icon>
              导出Excel
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
        <el-form-item label="订单类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option
              label="全部类型"
              value=""
            />
            <el-option
              label="维修订单"
              value="repair"
            />
            <el-option
              label="保养订单"
              value="maintenance"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 180px"
          >
            <el-option
              label="全部状态"
              value=""
            />
            <el-option
              label="待车队审批"
              value="awaiting_fleet_approval"
            />
            <el-option
              label="待确认时间"
              value="awaiting_time_confirmation"
            />
            <el-option
              label="待接车检查"
              value="pending_assessment"
            />
            <el-option
              label="待审批报价"
              value="awaiting_approval"
            />
            <el-option
              label="维修中"
              value="in_repair"
            />
            <el-option
              label="增项待审批"
              value="awaiting_addon_approval"
            />
            <el-option
              label="待确认"
              value="pending_confirmation"
            />
            <el-option
              label="已完成"
              value="completed"
            />
            <el-option
              label="已退款"
              value="refunded"
            />
            <el-option
              label="已拒绝"
              value="rejected"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="车牌号/订单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button
              type="primary"
              @click="handleQuery"
            >
              查询
            </el-button>
            <el-button @click="handleReset">
              重置
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <!-- 订单列表 -->
      <el-table
        v-loading="loading"
        :data="orderList"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="orderNumber"
          label="订单号"
          width="180"
        />
        <el-table-column
          label="类型"
          width="80"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.type === 'maintenance' ? 'success' : 'primary'"
              size="small"
            >
              {{ row.type === 'maintenance' ? '保养' : '维修' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="车牌号"
          width="110"
        >
          <template #default="{ row }">
            {{ row.vehicleId?.plateNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="品牌/车型"
          width="150"
        >
          <template #default="{ row }">
            {{ row.vehicleId?.brand }} {{ row.vehicleId?.model }}
          </template>
        </el-table-column>
        <el-table-column
          label="故障描述"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.faultDescription || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="当前里程"
          width="100"
          align="right"
        >
          <template #default="{ row }">
            {{ row.milestone || '-' }} km
          </template>
        </el-table-column>
        <el-table-column
          label="报修人"
          width="110"
        >
          <template #default="{ row }">
            {{ getReporterDisplayName(row.reporterId) }}
          </template>
        </el-table-column>
        <el-table-column
          label="报价金额"
          width="110"
          align="right"
        >
          <template #default="{ row }">
            <span
              v-if="row.quote && row.quote.total != null"
              class="amount"
            >¥{{ Number(row.quote.total).toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="110"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          width="160"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="280"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'awaiting_fleet_approval'"
              type="primary"
              size="small"
              link
              @click="handleApprove(row)"
            >
              审批
            </el-button>
            <el-button
              v-if="row.status === 'awaiting_approval'"
              type="warning"
              size="small"
              link
              @click="handleQuoteApproval(row)"
            >
              审批报价
            </el-button>
            <el-button
              v-if="row.status === 'awaiting_addon_approval'"
              type="warning"
              size="small"
              link
              @click="handleAddonApproval(row)"
            >
              审批增项
            </el-button>
            <el-button
              v-if="canCancelOrder(row)"
              type="danger"
              size="small"
              link
              @click="handleCancel(row)"
            >
              撤销
            </el-button>
            <el-button
              type="info"
              size="small"
              link
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
      width="700px"
    >
      <div v-if="currentOrder">
        <!-- 订单基本信息 -->
        <el-descriptions
          :column="2"
          border
          style="margin-bottom: 20px"
        >
          <el-descriptions-item label="订单号">
            {{ currentOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="车牌号">
            {{ currentOrder.vehicleId?.plateNumber }}
          </el-descriptions-item>
          <el-descriptions-item
            label="品牌型号"
            :span="2"
          >
            {{ currentOrder.vehicleId?.brand }} {{ currentOrder.vehicleId?.model }}
          </el-descriptions-item>
          <el-descriptions-item
            label="故障描述"
            :span="2"
          >
            {{ currentOrder.faultDescription }}
          </el-descriptions-item>
          <el-descriptions-item label="当前里程">
            {{ currentOrder.milestone || '-' }} km
          </el-descriptions-item>
          <el-descriptions-item label="报修人">
            {{ getReporterDisplayName(currentOrder.reporterId) }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentOrder.reporterId?.phone || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(currentOrder.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 里程照片 -->
        <div
          v-if="currentOrder.milestonePhotos && currentOrder.milestonePhotos.length > 0"
          style="margin-bottom: 20px"
        >
          <div style="margin-bottom: 8px; font-weight: 600;">
            里程照片：
          </div>
          <el-image
            v-for="(photo, index) in currentOrder.milestonePhotos"
            :key="index"
            :src="getImageUrl(photo)"
            :preview-src-list="getMilestonePhotoUrls(currentOrder)"
            :initial-index="index"
            fit="cover"
            style="width: 100px; height: 100px; margin-right: 8px; border-radius: 4px; cursor: pointer;"
          />
        </div>

        <!-- 故障图片 -->
        <div
          v-if="currentOrder.faultImages && currentOrder.faultImages.length > 0"
          style="margin-bottom: 20px"
        >
          <div style="margin-bottom: 8px; font-weight: 600;">
            故障图片：
          </div>
          <el-image
            v-for="(photo, index) in currentOrder.faultImages"
            :key="index"
            :src="getImageUrl(photo)"
            :preview-src-list="getFaultImageUrls(currentOrder)"
            :initial-index="index"
            fit="cover"
            style="width: 100px; height: 100px; margin-right: 8px; border-radius: 4px; cursor: pointer;"
          />
        </div>

        <!-- 车队配置信息 -->
        <el-alert
          title="车队配置"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <div>门店选择模式：{{ fleetConfig.allowDriverSelectStore ? '司机自选门店' : '车队分配门店' }}</div>
        </el-alert>

        <!-- 司机已选择的门店信息 -->
        <el-alert
          v-if="fleetConfig.allowDriverSelectStore && currentOrder?.storeId"
          title="司机选择的门店"
          type="success"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <div>门店名称：{{ getStoreName(currentOrder.storeId) }}</div>
          <div>门店地址：{{ getStoreAddress(currentOrder.storeId) }}</div>
        </el-alert>

        <!-- 选择门店（仅当车队分配门店时显示） -->
        <el-form
          v-if="!fleetConfig.allowDriverSelectStore"
          :model="approveForm"
          label-width="100px"
        >
          <el-form-item
            label="选择门店"
            required
          >
            <el-select
              v-model="approveForm.storeId"
              placeholder="请选择维修门店"
              style="width: 100%"
              filterable
              @change="handleStoreChange"
            >
              <el-option
                v-for="store in storeList"
                :key="store._id"
                :label="`${store.name}（${formatStoreAddress(store.address)}）`"
                :value="store._id"
              />
            </el-select>
          </el-form-item>

          <!-- 保养订单需要选择套餐 -->
          <template v-if="currentOrder?.type === 'maintenance'">
            <el-form-item
              label="套餐选择"
              required
            >
              <el-select
                v-model="approveForm.packageId"
                placeholder="请选择套餐"
                style="width: 100%"
                filterable
                @change="handlePackageChange"
              >
                <el-option
                  v-for="pkg in availablePackages"
                  :key="pkg._id"
                  :label="`${pkg.name} - ¥${pkg.price.toFixed(2)}（原价¥${pkg.originalPrice.toFixed(2)}）`"
                  :value="pkg._id"
                />
              </el-select>
            </el-form-item>

            <!-- 套餐详情 -->
            <el-alert
              v-if="selectedPackage"
              title="套餐详情"
              type="info"
              :closable="false"
              style="margin-bottom: 16px"
            >
              <div>套餐名称：{{ selectedPackage.name }}</div>
              <div>套餐档次：{{ selectedPackage.tier }}</div>
              <div>套餐价格：¥{{ selectedPackage.price.toFixed(2) }}</div>
              <div>适用里程：{{ selectedPackage.mileageRange?.min }}km - {{ selectedPackage.mileageRange?.max }}km</div>
              <div>预计工时：{{ selectedPackage.estimatedDuration || '-' }}小时</div>
            </el-alert>

            <!-- 审批金额 -->
            <el-form-item
              label="审批金额"
              required
            >
              <el-input-number
                v-model="approveForm.finalAmount"
                :min="0"
                :precision="2"
                :step="100"
                controls-position="right"
                style="width: 200px"
              />
              <span style="margin-left: 12px; color: #909399;">元（审批通过后将从车队账户冻结此金额）</span>
            </el-form-item>

            <!-- 资金冻结提示 -->
            <el-alert
              v-if="approveForm.finalAmount > 0"
              title="资金冻结说明"
              type="warning"
              :closable="false"
              style="margin-bottom: 16px"
            >
              <div>审批通过后将从车队账户冻结 <strong>¥{{ approveForm.finalAmount.toFixed(2) }}</strong></div>
              <div>完工结算时多退少补，剩余资金将自动解冻</div>
            </el-alert>
          </template>

          <el-form-item label="审批备注">
            <el-input
              v-model="approveForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入审批备注（可选）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="approveDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="danger"
          @click="confirmReject"
        >
          拒绝
        </el-button>
        <el-button
          type="primary"
          :disabled="!canApprove"
          @click="confirmApprove"
        >
          确认审批
        </el-button>
      </template>
    </el-dialog>

    <!-- 报价审批对话框 -->
    <el-dialog
      v-model="quoteApproveDialogVisible"
      title="审批报价"
      width="800px"
    >
      <div v-if="currentOrder">
        <!-- 订单基本信息 -->
        <el-descriptions
          :column="2"
          border
          style="margin-bottom: 20px"
        >
          <el-descriptions-item label="订单号">
            {{ currentOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="车牌号">
            {{ currentOrder.vehicleId?.plateNumber }}
          </el-descriptions-item>
          <el-descriptions-item
            label="品牌型号"
            :span="2"
          >
            {{ currentOrder.vehicleId?.brand }} {{ currentOrder.vehicleId?.model }}
          </el-descriptions-item>
          <el-descriptions-item
            label="故障描述"
            :span="2"
          >
            {{ currentOrder.faultDescription }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 接车检查信息 -->
        <div
          v-if="currentOrder.receiveCheck"
          style="margin-bottom: 20px"
        >
          <div style="margin-bottom: 10px; font-weight: 600;">
            接车检查信息：
          </div>
          <el-descriptions
            :column="2"
            border
          >
            <el-descriptions-item label="检查里程">
              {{ currentOrder.receiveCheck.mileage || '-' }} 公里
            </el-descriptions-item>
            <el-descriptions-item label="诊断结果">
              {{ currentOrder.receiveCheck.diagnosis || '-' }}
            </el-descriptions-item>
          </el-descriptions>
          <!-- 接车照片 -->
          <div
            v-if="currentOrder.receiveCheck.checkinPhotos && currentOrder.receiveCheck.checkinPhotos.length > 0"
            style="margin-top: 10px"
          >
            <div style="margin-bottom: 8px; font-weight: 600;">
              接车照片：
            </div>
            <el-image
              v-for="(photo, index) in currentOrder.receiveCheck.checkinPhotos"
              :key="index"
              :src="getImageUrl(photo)"
              :preview-src-list="getCheckinPhotoUrls(currentOrder)"
              :initial-index="index"
              fit="cover"
              style="width: 80px; height: 80px; margin-right: 8px; border-radius: 4px; cursor: pointer;"
            />
          </div>
        </div>

        <!-- 报价信息 -->
        <div
          v-if="currentOrder.quote"
          style="margin-bottom: 20px"
        >
          <div style="margin-bottom: 10px; font-weight: 600;">
            报价明细：
          </div>
          <el-table
            :data="currentOrder.quote.items"
            size="small"
            border
            style="margin-bottom: 10px;"
          >
            <el-table-column
              prop="item"
              label="项目名称"
            />
            <el-table-column
              prop="price"
              label="单价"
              width="100"
            >
              <template #default="{ row }">
                ¥{{ Number(row.price).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="quantity"
              label="数量"
              width="80"
            />
            <el-table-column
              label="小计"
              width="100"
            >
              <template #default="{ row }">
                ¥{{ (row.price * row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
          <div style="text-align: right;">
            <span style="color: #909399;">报价总额：</span>
            <span style="color: #f56c6c; font-size: 20px; font-weight: bold; margin-left: 10px;">
              ¥{{ Number(currentOrder.quote.total || 0).toFixed(2) }}
            </span>
          </div>
          <!-- 报价说明 -->
          <div
            v-if="currentOrder.quote.description"
            style="margin-top: 10px; color: #606266;"
          >
            <strong>报价说明：</strong>{{ currentOrder.quote.description }}
          </div>
          <!-- 报价图片 -->
          <div
            v-if="getQuoteImageUrls(currentOrder).length > 0"
            style="margin-top: 10px"
          >
            <div style="margin-bottom: 8px; font-weight: 600;">
              报价图片：
            </div>
            <el-image
              v-for="(photo, index) in getQuoteImageUrls(currentOrder)"
              :key="index"
              :src="photo"
              :preview-src-list="getQuoteImageUrls(currentOrder)"
              :initial-index="index"
              fit="cover"
              style="width: 80px; height: 80px; margin-right: 8px; border-radius: 4px; cursor: pointer;"
            />
          </div>
        </div>

        <!-- 审批备注 -->
        <el-form
          :model="quoteApproveForm"
          label-width="100px"
        >
          <el-form-item label="审批备注">
            <el-input
              v-model="quoteApproveForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入审批备注（可选）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="quoteApproveDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="danger"
          @click="confirmQuoteReject"
        >
          拒绝报价
        </el-button>
        <el-button
          type="primary"
          @click="confirmQuoteApprove"
        >
          批准报价
        </el-button>
      </template>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      width="800px"
    >
      <div v-if="currentOrder">
        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="订单号">
            {{ currentOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(currentOrder.status)">
              {{ getStatusText(currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单类型">
            <el-tag :type="currentOrder.type === 'maintenance' ? 'success' : 'primary'">
              {{ currentOrder.type === 'maintenance' ? '保养订单' : '维修订单' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="车牌号">
            {{ currentOrder.vehicleId?.plateNumber }}
          </el-descriptions-item>
          <el-descriptions-item
            label="品牌型号"
            :span="2"
          >
            {{ currentOrder.vehicleId?.brand }} {{ currentOrder.vehicleId?.model }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.vehicleId?.vehicleType"
            label="车辆类型"
            :span="2"
          >
            {{ currentOrder.vehicleId.vehicleType }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.vehicleId?.vin"
            label="VIN码"
            :span="2"
          >
            {{ currentOrder.vehicleId.vin }}
          </el-descriptions-item>
          <el-descriptions-item
            label="故障描述"
            :span="2"
          >
            {{ currentOrder.faultDescription }}
          </el-descriptions-item>
          <el-descriptions-item label="当前里程">
            {{ currentOrder.milestone || '-' }} km
          </el-descriptions-item>
          <el-descriptions-item label="报修人">
            {{ getReporterDisplayName(currentOrder.reporterId) }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentOrder.reporterId?.phone || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="维修门店">
            {{ currentOrder.storeId?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(currentOrder.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.milestonePhotos?.length > 0"
            label="里程照片"
            :span="2"
          >
            <el-image
              v-for="(img, idx) in currentOrder.milestonePhotos"
              :key="idx"
              :src="getImageUrl(img)"
              :preview-src-list="getMilestonePhotoUrls(currentOrder)"
              :initial-index="idx"
              style="width: 80px; height: 80px; margin-right: 8px; border-radius: 4px;"
              fit="cover"
            />
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.faultImages?.length > 0"
            label="故障图片"
            :span="2"
          >
            <el-image
              v-for="(img, idx) in currentOrder.faultImages"
              :key="idx"
              :src="getImageUrl(img)"
              :preview-src-list="getFaultImageUrls(currentOrder)"
              :initial-index="idx"
              style="width: 80px; height: 80px; margin-right: 8px; border-radius: 4px;"
              fit="cover"
            />
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.receiveCheck"
            label="接车检查"
            :span="2"
          >
            <div><strong>检查里程：</strong>{{ currentOrder.receiveCheck.mileage || '-' }} 公里</div>
            <div><strong>诊断结果：</strong>{{ currentOrder.receiveCheck.diagnosis || '-' }}</div>
            <div v-if="currentOrder.receiveCheck.checkinPhotos?.length > 0">
              <strong>接车照片：</strong>
            </div>
            <el-image
              v-for="(img, idx) in currentOrder.receiveCheck.checkinPhotos || []"
              :key="idx"
              :src="getImageUrl(img)"
              :preview-src-list="getCheckinPhotoUrls(currentOrder)"
              :initial-index="idx"
              style="width: 80px; height: 80px; margin-right: 8px; border-radius: 4px; margin-top: 8px;"
              fit="cover"
            />
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.quote"
            label="报价信息"
            :span="2"
          >
            <div><strong>报价项目：</strong></div>
            <el-table
              :data="currentOrder.quote.items"
              size="small"
              border
              style="margin-top: 8px;"
            >
              <el-table-column
                prop="item"
                label="项目名称"
              />
              <el-table-column
                prop="price"
                label="单价"
                width="100"
              >
                <template #default="{ row }">
                  ¥{{ Number(row.price).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column
                prop="quantity"
                label="数量"
                width="80"
              />
              <el-table-column
                label="小计"
                width="100"
              >
                <template #default="{ row }">
                  ¥{{ (row.price * row.quantity).toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
            <div style="margin-top: 10px;">
              <strong>报价总额：</strong>
              <span style="color: #f56c6c; font-size: 18px; font-weight: bold;">¥{{ Number(currentOrder.quote.total || 0).toFixed(2) }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.addon"
            label="增项信息"
            :span="2"
          >
            <div><strong>增项原因：</strong>{{ currentOrder.addon.reason || '-' }}</div>
            <el-table
              :data="currentOrder.addon.items || []"
              size="small"
              border
              style="margin-top: 8px;"
            >
              <el-table-column
                prop="item"
                label="项目名称"
              />
              <el-table-column
                prop="price"
                label="单价"
                width="100"
              >
                <template #default="{ row }">
                  ¥{{ Number(row.price || 0).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column
                prop="quantity"
                label="数量"
                width="80"
              />
              <el-table-column
                label="小计"
                width="100"
              >
                <template #default="{ row }">
                  ¥{{ (Number(row.price || 0) * Number(row.quantity || 0)).toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
            <div style="margin-top: 10px;">
              <strong>增项总额：</strong>
              <span style="color: #f56c6c; font-size: 18px; font-weight: bold;">¥{{ Number(currentOrder.addon.total || 0).toFixed(2) }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentOrder.completion"
            label="完工信息"
            :span="2"
          >
            <div><strong>完工说明：</strong>{{ currentOrder.completion.description || '-' }}</div>
            <div v-if="currentOrder.completion.images?.length > 0">
              <strong>完工照片：</strong>
            </div>
            <el-image
              v-for="(img, idx) in currentOrder.completion.images || []"
              :key="idx"
              :src="img"
              :preview-src-list="currentOrder.completion.images || []"
              :initial-index="idx"
              style="width: 80px; height: 80px; margin-right: 8px; border-radius: 4px; margin-top: 8px;"
              fit="cover"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
        <el-button
          v-if="currentOrder?.status === 'awaiting_addon_approval'"
          type="danger"
          @click="confirmAddonReject()"
        >
          拒绝增项
        </el-button>
        <el-button
          v-if="currentOrder?.status === 'awaiting_addon_approval'"
          type="primary"
          @click="confirmAddonApprove()"
        >
          批准增项
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getStores } from '@/api/store'
import { getFleetConfig } from '@/api/fleet'
import { getImageUrl, getImageUrls } from '@/utils/image'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const exporting = ref(false)
const orderList = ref([])
const total = ref(0)
const storeList = ref([])

// 统计数据
const stats = ref({
  pendingApproval: 0,      // 待审批
  inRepair: 0,             // 维修中
  pendingConfirmation: 0,   // 待确认
  monthlyAmount: 0         // 本月费用
})

const queryParams = ref({
  page: 1,
  limit: 20,
  type: '',
  status: '',
  keyword: ''
})

const approveDialogVisible = ref(false)
const quoteApproveDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentOrder = ref(null)

const approveForm = ref({
  storeId: null,
  packageId: null,
  finalAmount: 0,
  remark: ''
})

// 套餐列表
const availablePackages = ref([])

const quoteApproveForm = ref({
  remark: ''
})

const fleetConfig = ref({
  allowDriverSelectStore: false
})

// 获取用户车队ID
const userFleetId = computed(() => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  return userInfo.fleetInfo?.fleetId
})

const getOrderActualAmount = (order) => {
  const amountCandidates = [
    order?.quote?.actualTotal,
    order?.quote?.total,
    order?.maintenanceOrder?.finalAmount
  ]

  const matchedAmount = amountCandidates.find(amount => {
    const normalizedAmount = Number(amount)
    return Number.isFinite(normalizedAmount) && normalizedAmount > 0
  })

  return Number(matchedAmount || 0)
}

const getOrderCompletedAt = (order) => {
  const completedAt =
    order?.completion?.confirmedAt ||
    order?.completion?.completedAt ||
    order?.completion?.submittedAt ||
    order?.updatedAt ||
    order?.createdAt

  const parsedDate = completedAt ? new Date(completedAt) : null
  return parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null
}

const getCheckinPhotoUrls = (order) => getImageUrls(order?.receiveCheck?.checkinPhotos || [])

const getQuoteImageUrls = (order) => getImageUrls(order?.quote?.quoteImages || order?.quote?.images || [])

const getMilestonePhotoUrls = (order) => getImageUrls(order?.milestonePhotos || [])

const getFaultImageUrls = (order) => getImageUrls(order?.faultImages || [])

const cancelableStatuses = ['awaiting_fleet_approval', 'awaiting_time_confirmation', 'pending_assessment']

const canCancelOrder = (order) => cancelableStatuses.includes(order?.status)

// 是否可以审批
const canApprove = computed(() => {
  if (fleetConfig.value.allowDriverSelectStore) {
    // 司机自选门店，不需要选择
    return true
  } else {
    // 车队分配门店，必须选择门店
    return !!approveForm.value.storeId
  }
})

// 获取门店名称
const getStoreName = (storeId) => {
  const store = storeList.value.find(s => s._id === storeId)
  return store?.name || '-'
}

// 获取门店地址
const getStoreAddress = (storeId) => {
  const store = storeList.value.find(s => s._id === storeId)
  if (!store?.address) return '-'
  // 如果地址是对象，拼接成完整地址
  if (typeof store.address === 'object') {
    const addr = store.address
    const parts = [addr.province, addr.city, addr.district, addr.detail].filter(Boolean)
    return parts.join('') || '-'
  }
  return store.address
}

// 格式化门店地址（用于下拉选项）
const formatStoreAddress = (address) => {
  if (!address) return '-'
  if (typeof address === 'string') return address
  const addr = address
  const parts = [addr.province, addr.city, addr.district, addr.detail].filter(Boolean)
  return parts.join('') || '-'
}

// 获取车队配置
const getReporterDisplayName = (reporter) => {
  return reporter?.name || reporter?.nickname || '-'
}

const fetchFleetConfig = async () => {
  try {
    const res = await getFleetConfig(userFleetId.value)
    fleetConfig.value = res.data.fleet || {}
  } catch (error) {
    console.error('获取车队配置失败:', error)
  }
}

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {}

    // 状态筛选
    if (queryParams.value.status) {
      params.status = queryParams.value.status
    }

    const res = await request({
      url: '/orders',
      method: 'get',
      params
    })

    // 根据订单类型筛选
    let orders = res.data.orders || []
    if (queryParams.value.type) {
      orders = orders.filter(o => o.type === queryParams.value.type)
    }

    // 关键词搜索
    if (queryParams.value.keyword) {
      const keyword = queryParams.value.keyword.toLowerCase()
      orders = orders.filter(o =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(keyword)) ||
        (o.vehicleId?.plateNumber && o.vehicleId.plateNumber.toLowerCase().includes(keyword))
      )
    }

    // 分页
    const start = (queryParams.value.page - 1) * queryParams.value.limit
    const end = start + queryParams.value.limit
    orderList.value = orders.slice(start, end)
    total.value = orders.length

    // 同时更新统计数据
    await fetchStatistics()
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 获取门店列表
const fetchStores = async () => {
  try {
    const res = await getStores({ status: 'normal', limit: 100 })
    storeList.value = res.data.stores || []
  } catch (error) {
    console.error('获取门店列表失败:', error)
  }
}

// 获取套餐列表
const fetchPackages = async (storeId = null) => {
  try {
    const params = { auditStatus: 'approved', limit: 100 }
    // 如果提供了门店ID，则获取该门店的套餐和平台套餐
    if (storeId) {
      params.storeId = storeId
    }
    const res = await request({
      url: '/maintenance/fleet/store-packages',
      method: 'get',
      params
    })
    availablePackages.value = res.data.packages || []
  } catch (error) {
    console.error('获取套餐列表失败:', error)
  }
}

// 选中的套餐
const selectedPackage = computed(() => {
  if (!approveForm.value.packageId) return null
  return availablePackages.value.find(p => p._id === approveForm.value.packageId)
})

// 套餐变化
const handlePackageChange = (packageId) => {
  const pkg = availablePackages.value.find(p => p._id === packageId)
  if (pkg) {
    approveForm.value.finalAmount = pkg.price
  }
}

// 门店变化：清空已选套餐并重新加载套餐列表
const handleStoreChange = async (storeId) => {
  // 清空已选套餐
  approveForm.value.packageId = null
  approveForm.value.finalAmount = 0

  // 根据选择的门店重新加载套餐列表
  if (storeId) {
    await fetchPackages(storeId)
  } else {
    // 如果没有选择门店，清空套餐列表
    availablePackages.value = []
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    // 获取所有订单（不限制数量）用于统计
    const res = await request({
      url: '/orders',
      method: 'get',
      params: { limit: 9999 }
    })

    const orders = res.data.orders || []

    // 统计各状态订单数量
    stats.value.pendingApproval = orders.filter(o => o.status === 'awaiting_fleet_approval').length
    stats.value.inRepair = orders.filter(o => o.status === 'in_repair' || o.status === 'awaiting_addon_approval').length
    stats.value.pendingConfirmation = orders.filter(o => o.status === 'pending_confirmation').length

    // 计算本月费用：按本月完成订单的实际消费金额汇总
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const monthlyOrders = orders.filter(order => {
      const completedAt = getOrderCompletedAt(order)
      return order.status === 'completed' && completedAt && completedAt >= monthStart && getOrderActualAmount(order) > 0
    })

    stats.value.monthlyAmount = monthlyOrders.reduce((sum, order) => {
      return sum + getOrderActualAmount(order)
    }, 0)
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const getRouteOrderId = () => {
  const orderId = route.query.orderId
  return typeof orderId === 'string' ? orderId : ''
}

const clearRouteOrderId = async () => {
  if (!route.query.orderId) return

  const nextQuery = { ...route.query }
  delete nextQuery.orderId
  await router.replace({
    path: route.path,
    query: nextQuery
  })
}

const openOrderDetailById = async (orderId) => {
  if (!orderId) return

  try {
    const res = await request({
      url: `/orders/${orderId}`,
      method: 'get'
    })

    currentOrder.value = res.data
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error(error.response?.data?.message || '获取订单详情失败')
  } finally {
    await clearRouteOrderId()
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
    status: '',
    keyword: ''
  }
  fetchOrders()
}

// 刷新
const handleRefresh = () => {
  fetchOrders()
  fetchStatistics()
}

// 车队审批
const handleApprove = async (order) => {
  currentOrder.value = order
  approveForm.value = {
    storeId: order.storeId || null,
    packageId: null,
    finalAmount: 0,
    remark: ''
  }

  // 获取车队配置
  await fetchFleetConfig()

  // 如果需要选择门店
  if (!fleetConfig.value.allowDriverSelectStore) {
    await fetchStores()
  }

  // 确定要查询套餐的门店ID
  let packageStoreId = null
  if (fleetConfig.value.allowDriverSelectStore) {
    // 司机自选门店模式：使用订单中的门店ID
    packageStoreId = order.storeId || null
  } else {
    // 车队分配门店模式：使用车队选择的门店ID
    packageStoreId = approveForm.value.storeId || null
  }

  // 如果是保养订单，加载套餐列表
  if (order.type === 'maintenance' && packageStoreId) {
    await fetchPackages(packageStoreId)
  }

  approveDialogVisible.value = true
}

// 确认审批
const confirmApprove = async () => {
  // 验证门店：仅当车队分配门店时需要验证
  if (!fleetConfig.value.allowDriverSelectStore && !approveForm.value.storeId) {
    ElMessage.warning('请选择门店')
    return
  }

  // 验证套餐：保养订单必须选择套餐
  if (currentOrder.value.type === 'maintenance' && !approveForm.value.packageId) {
    ElMessage.warning('请选择保养套餐')
    return
  }

  // 验证金额：保养订单必须输入金额
  if (currentOrder.value.type === 'maintenance' && (!approveForm.value.finalAmount || approveForm.value.finalAmount <= 0)) {
    ElMessage.warning('请输入审批金额')
    return
  }

  try {
    const data = {
      storeId: approveForm.value.storeId,
      remark: approveForm.value.remark
    }

    // 如果是保养订单，添加套餐信息
    if (currentOrder.value.type === 'maintenance') {
      data.packageId = approveForm.value.packageId
      // 确定门店ID
      let storeId = approveForm.value.storeId
      if (fleetConfig.value.allowDriverSelectStore && currentOrder.value.storeId) {
        storeId = currentOrder.value.storeId
      }
      data.storeId = storeId
    }

    await request({
      url: `/orders/${currentOrder.value._id}/fleet-approve`,
      method: 'post',
      data
    })

    const successMessage = currentOrder.value.type === 'maintenance'
      ? '审批成功，资金已冻结，订单已分配门店'
      : '审批成功，订单已分配门店'

    ElMessage.success(successMessage)
    approveDialogVisible.value = false
    fetchOrders()
    fetchStatistics() // 刷新统计数据
  } catch (error) {
    console.error('审批失败:', error)
    ElMessage.error(error.response?.data?.message || '审批失败')
  }
}

// 拒绝订单
const confirmReject = async () => {
  try {
    await request({
      url: `/orders/${currentOrder.value._id}/fleet-reject`,
      method: 'post',
      data: { reason: '车队管理员拒绝' }
    })

    ElMessage.success('已拒绝订单')
    approveDialogVisible.value = false
    fetchOrders()
    fetchStatistics() // 刷新统计数据
  } catch (error) {
    console.error('拒绝失败:', error)
    ElMessage.error(error.response?.data?.message || '拒绝失败')
  }
}

// 报价审批
const handleCancel = async (order) => {
  try {
    const { value } = await ElMessageBox.prompt('请填写撤销原因', '撤销订单', {
      confirmButtonText: '确认撤销',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：门店长期未确认时间，改为重新申请',
      inputValidator: (input) => {
        if (!input || !input.trim()) {
          return '请填写撤销原因'
        }
        return true
      }
    })

    await request({
      url: `/orders/${order._id}/cancel`,
      method: 'post',
      data: { reason: value.trim() }
    })

    ElMessage.success('订单已撤销')
    fetchOrders()
    fetchStatistics()
  } catch (error) {
    if (error === 'cancel' || error?.action === 'cancel' || error?.action === 'close') {
      return
    }
    console.error('撤销订单失败:', error)
    ElMessage.error(error.response?.data?.message || '撤销订单失败')
  }
}

const handleQuoteApproval = (order) => {
  currentOrder.value = order
  quoteApproveForm.value = { remark: '' }
  quoteApproveDialogVisible.value = true
}

const handleAddonApproval = (order) => {
  currentOrder.value = order
  detailDialogVisible.value = true
}

const submitAddonDecision = async (approved) => {
  await request({
    url: `/orders/${currentOrder.value._id}/approve-addon`,
    method: 'post',
    data: { approved }
  })

  const successMessage = approved ? '增项已批准，订单继续处理中' : '增项已拒绝，订单继续按原方案处理'
  ElMessage.success(successMessage)
  detailDialogVisible.value = false
  fetchOrders()
  fetchStatistics()
}

// 确认批准报价
const confirmQuoteApprove = async () => {
  try {
    await request({
      url: `/orders/${currentOrder.value._id}/approve-quote`,
      method: 'post',
      data: { approved: true, rejectReason: quoteApproveForm.value.remark }
    })

    ElMessage.success('报价已批准，订单进入维修中')
    quoteApproveDialogVisible.value = false
    fetchOrders()
    fetchStatistics()
  } catch (error) {
    console.error('批准报价失败:', error)
    ElMessage.error(error.response?.data?.message || '批准报价失败')
  }
}

const confirmAddonApprove = async () => {
  try {
    await ElMessageBox.confirm(
      `确认批准该笔增项申请？\n增项总额：¥${Number(currentOrder.value?.addon?.total || 0).toFixed(2)}`,
      '审批增项',
      {
        confirmButtonText: '批准',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await submitAddonDecision(true)
  } catch (error) {
    if (error === 'cancel' || error?.action === 'cancel' || error?.action === 'close') {
      return
    }
    console.error('批准增项失败:', error)
    ElMessage.error(error.response?.data?.message || '批准增项失败')
  }
}

const confirmAddonReject = async () => {
  try {
    await ElMessageBox.confirm(
      '确认拒绝该笔增项申请？拒绝后订单将继续按原方案处理。',
      '审批增项',
      {
        confirmButtonText: '拒绝',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await submitAddonDecision(false)
  } catch (error) {
    if (error === 'cancel' || error?.action === 'cancel' || error?.action === 'close') {
      return
    }
    console.error('拒绝增项失败:', error)
    ElMessage.error(error.response?.data?.message || '拒绝增项失败')
  }
}

// 确认拒绝报价
const confirmQuoteReject = async () => {
  try {
    await request({
      url: `/orders/${currentOrder.value._id}/approve-quote`,
      method: 'post',
      data: { approved: false, rejectReason: quoteApproveForm.value.remark || '车队管理员拒绝报价' }
    })

    ElMessage.success('已拒绝报价，订单退回待接车检查')
    quoteApproveDialogVisible.value = false
    fetchOrders()
    fetchStatistics()
  } catch (error) {
    console.error('拒绝报价失败:', error)
    ElMessage.error(error.response?.data?.message || '拒绝报价失败')
  }
}

// 查看详情
const handleViewDetail = (order) => {
  currentOrder.value = order
  detailDialogVisible.value = true
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'awaiting_fleet_approval': 'warning',
    'awaiting_time_confirmation': 'info',
    'pending_assessment': 'info',
    'awaiting_approval': 'warning',
    'in_repair': 'primary',
    'awaiting_addon_approval': 'warning',
    'pending_confirmation': 'warning',
    'completed': 'success',
    'refunded': 'info',
    'rejected': 'danger',
    'cancelled': 'info',
    'expired': 'warning'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'awaiting_fleet_approval': '待车队审批',
    'awaiting_time_confirmation': '待确认时间',
    'pending_assessment': '待接车检查',
    'awaiting_approval': '待审批报价',
    'in_repair': '维修中',
    'awaiting_addon_approval': '增项待审批',
    'pending_confirmation': '待确认',
    'completed': '已完成',
    'refunded': '已退款',
    'rejected': '已拒绝'
  }
  textMap.cancelled = '已撤销'
  textMap.expired = '已超时关闭'
  return textMap[status] || status
}

// 格式化金额
const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return parseFloat(amount / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 格式化日期时间
const formatDateTime = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 导出Excel
const exportExcel = async () => {
  try {
    exporting.value = true

    const params = {
      type: queryParams.value.type,
      status: queryParams.value.status,
      keyword: queryParams.value.keyword,
      exportExcel: 'true'
    }

    const blob = await request({
      url: '/orders',
      method: 'get',
      params,
      responseType: 'blob'
    })

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `车队订单记录_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error(error.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  fetchStores()
  fetchStatistics()
  fetchOrders()
  fetchFleetConfig()

  const orderId = getRouteOrderId()
  if (orderId) {
    await openOrderDetailById(orderId)
  }
})
</script>

<style scoped lang="scss">
.fleet-orders {
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
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }

  .search-form {
    margin-bottom: 20px;
  }

  .amount {
    color: #f56c6c;
    font-weight: 600;
  }
}
</style>
