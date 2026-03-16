<template>
  <div class="store-orders">
    <div class="page-header">
      <h2>门店订单</h2>
      <el-dropdown
        split-button
        type="warning"
        size="small"
        :loading="exporting"
        @click="handleExport('filtered')"
      >
        <el-icon><Download /></el-icon>
        导出数据
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleExport('filtered')">
              导出当前页 ({{ orders.length }} 条)
            </el-dropdown-item>
            <el-dropdown-item @click="handleExport('all')">
              导出全部
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 统计卡片 -->
    <el-row
      :gutter="20"
      class="stats-row"
    >
      <el-col :span="3">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="待车队审批"
            :value="stats.awaiting_fleet_approval"
          />
        </el-card>
      </el-col>
      <el-col :span="3">
        <el-card class="stat-card stat-card-info">
          <el-statistic
            title="待确认时间"
            :value="stats.awaiting_time_confirmation"
          />
        </el-card>
      </el-col>
      <el-col :span="3">
        <el-card class="stat-card">
          <el-statistic
            title="待接车检查"
            :value="stats.pending_assessment"
          />
        </el-card>
      </el-col>
      <el-col :span="3">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="待审批报价"
            :value="stats.awaiting_approval"
          />
        </el-card>
      </el-col>
      <el-col :span="3">
        <el-card class="stat-card stat-card-primary">
          <el-statistic
            title="维修中"
            :value="stats.in_repair"
          />
        </el-card>
      </el-col>
      <el-col :span="3">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="增项待审批"
            :value="stats.awaiting_addon_approval"
          />
        </el-card>
      </el-col>
      <el-col :span="3">
        <el-card class="stat-card stat-card-warning">
          <el-statistic
            title="待确认"
            :value="stats.pending_confirmation"
          />
        </el-card>
      </el-col>
      <el-col :span="3">
        <el-card class="stat-card stat-card-success">
          <el-statistic
            title="已完成"
            :value="stats.completed"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form
        :inline="true"
        :model="filters"
      >
        <el-form-item label="订单状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            style="width: 180px"
            @change="loadOrders"
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
        <el-form-item label="订单类型">
          <el-select
            v-model="filters.type"
            placeholder="全部类型"
            clearable
            style="width: 150px"
            @change="loadOrders"
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
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadOrders"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button
              type="primary"
              @click="loadOrders"
            >
              查询
            </el-button>
            <el-button @click="resetFilters">
              重置
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="orders"
        stripe
      >
        <el-table-column
          prop="orderNumber"
          label="订单号"
          width="180"
        />
        <el-table-column
          label="类型"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.type === 'repair' ? 'warning' : 'success'"
              size="small"
            >
              {{ row.type === 'repair' ? '维修' : '保养' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="车辆"
          width="150"
        >
          <template #default="{ row }">
            {{ row.vehicleId?.plateNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="报修人"
          width="120"
        >
          <template #default="{ row }">
            {{ row.reporterId?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="故障描述"
          min-width="200"
        >
          <template #default="{ row }">
            {{ row.faultDescription || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="报价金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span class="amount">{{ row.quote && row.quote.total != null ? '¥' + Number(row.quote.total).toFixed(2) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusColor(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="创建时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="150"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="isStoreManager && row.status === 'awaiting_time_confirmation'"
              link
              type="warning"
              size="small"
              @click="openConfirmTimeDialog(row)"
            >
              确认时间
            </el-button>
            <el-button
              v-if="isStoreTechnician && row.status === 'pending_assessment'"
              link
              type="primary"
              size="small"
              @click="handleReceive(row)"
            >
              接车
            </el-button>
            <el-button
              v-if="isStoreTechnician && row.status === 'in_repair'"
              link
              type="warning"
              size="small"
              @click="handleAddon(row)"
            >
              增项
            </el-button>
            <el-button
              v-if="isStoreTechnician && row.status === 'in_repair'"
              link
              type="success"
              size="small"
              @click="handleComplete(row)"
            >
              完工
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="loadOrders"
        @current-change="loadOrders"
      />
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="900px"
    >
      <el-descriptions
        v-if="currentOrder"
        :column="2"
        border
      >
        <el-descriptions-item label="订单号">
          {{ currentOrder.orderNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="订单类型">
          <el-tag :type="currentOrder.type === 'repair' ? 'warning' : 'success'">
            {{ currentOrder.type === 'repair' ? '维修订单' : '保养订单' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车牌号">
          {{ currentOrder.vehicleId?.plateNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="品牌型号">
          {{ currentOrder.vehicleId?.brand }} {{ currentOrder.vehicleId?.model }}
        </el-descriptions-item>
        <el-descriptions-item label="报修人">
          {{ currentOrder.reporterId?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ currentOrder.reporterId?.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="预约时间">
          {{ getAppointmentDisplay(currentOrder) }}
        </el-descriptions-item>
        <el-descriptions-item label="当前里程">
          {{ currentOrder.milestone ? currentOrder.milestone + ' 公里' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item
          label="故障描述"
          :span="2"
        >
          {{ currentOrder.faultDescription }}
        </el-descriptions-item>
        <el-descriptions-item
          label="里程图片"
          :span="2"
        >
          <div
            v-if="currentOrder.milestonePhotos?.length"
            class="detail-image-list"
          >
            <el-image
              v-for="(img, idx) in currentOrder.milestonePhotos"
              :key="`milestone-${idx}`"
              :src="getImageUrl(img)"
              :preview-src-list="getDetailImageUrls(currentOrder.milestonePhotos)"
              :initial-index="idx"
              class="detail-image-item"
              fit="cover"
            />
          </div>
          <span
            v-else
            class="empty-text"
          >暂无图片</span>
        </el-descriptions-item>
        <el-descriptions-item
          label="故障图片"
          :span="2"
        >
          <div
            v-if="currentOrder.faultImages?.length"
            class="detail-image-list"
          >
            <el-image
              v-for="(img, idx) in currentOrder.faultImages"
              :key="`fault-${idx}`"
              :src="getImageUrl(img)"
              :preview-src-list="getDetailImageUrls(currentOrder.faultImages)"
              :initial-index="idx"
              class="detail-image-item"
              fit="cover"
            />
          </div>
          <span
            v-else
            class="empty-text"
          >暂无图片</span>
        </el-descriptions-item>
        <el-descriptions-item
          label="接车检查图片"
          :span="2"
        >
          <div
            v-if="currentOrder.receiveCheck?.checkinPhotos?.length"
            class="detail-image-list"
          >
            <el-image
              v-for="(img, idx) in currentOrder.receiveCheck.checkinPhotos"
              :key="`checkin-${idx}`"
              :src="getImageUrl(img)"
              :preview-src-list="getDetailImageUrls(currentOrder.receiveCheck.checkinPhotos)"
              :initial-index="idx"
              class="detail-image-item"
              fit="cover"
            />
          </div>
          <span
            v-else
            class="empty-text"
          >暂无图片</span>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentOrder.receiveCheck"
          label="接车检查"
          :span="2"
        >
          <div><strong>检查里程：</strong>{{ currentOrder.receiveCheck.mileage || '-' }} 公里</div>
          <div><strong>诊断结果：</strong>{{ currentOrder.receiveCheck.diagnosis || '-' }}</div>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentOrder.quote"
          label="报价信息"
          :span="2"
        >
          <div>
            <strong>报价总额：</strong>
            <span class="total-amount">¥{{ Number(currentOrder.quote.total || 0).toFixed(2) }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusColor(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(currentOrder.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 确认时间对话框 -->
    <el-dialog
      v-model="confirmTimeDialogVisible"
      title="确认到店时间"
      width="500px"
    >
      <el-form
        v-if="currentOrder"
        :model="confirmTimeForm"
        label-width="100px"
      >
        <el-form-item label="订单号">
          <el-input
            :value="currentOrder.orderNumber"
            disabled
          />
        </el-form-item>

        <el-form-item label="期望时间">
          <div class="expected-time">
            {{ currentOrder.appointment?.expectedDate ? dayjs(currentOrder.appointment.expectedDate).format('YYYY-MM-DD') : '-' }}
            {{ currentOrder.appointment?.expectedTimeSlot || '-' }}
          </div>
        </el-form-item>

        <el-form-item
          label="确认日期"
          required
        >
          <el-date-picker
            v-model="confirmTimeForm.confirmedDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item
          label="时间段"
          required
        >
          <el-select
            v-model="confirmTimeForm.confirmedTimeSlot"
            placeholder="选择时间段"
            style="width: 100%"
          >
            <el-option
              v-for="slot in timeSlotOptions"
              :key="slot.value"
              :label="slot.label"
              :value="slot.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="是否调整">
          <el-switch
            v-model="confirmTimeForm.adjusted"
            active-text="已调整时间"
            inactive-text="按原时间"
          />
          <div
            class="form-tip"
            style="margin-top: 8px;"
          >
            如调整了司机期望的时间，请开启此选项
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="confirmTimeForm.remark"
            type="textarea"
            :rows="3"
            placeholder="如有调整请说明原因（会发送给司机）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="confirmTimeDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="confirming"
          @click="handleConfirmTime"
        >
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 接车检查对话框 -->
    <el-dialog
      v-model="receiveDialogVisible"
      title="接车检查"
      width="900px"
      :close-on-click-modal="false"
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
          <el-descriptions-item label="报修里程">
            {{ currentOrder.milestone }} 公里
          </el-descriptions-item>
          <el-descriptions-item label="故障描述">
            {{ currentOrder.faultDescription }}
          </el-descriptions-item>
        </el-descriptions>

        <el-form
          ref="receiveFormRef"
          :model="receiveForm"
          label-width="120px"
        >
          <!-- 当前里程 -->
          <el-form-item
            label="当前里程"
            required
          >
            <el-input-number
              v-model="receiveForm.mileage"
              :min="0"
              :max="1000000"
              :step="1"
              placeholder="请输入当前里程"
              style="width: 200px"
            />
            <span style="margin-left: 10px">公里</span>
          </el-form-item>

          <!-- 故障诊断 -->
          <el-form-item
            label="故障诊断"
            required
          >
            <el-input
              v-model="receiveForm.diagnosis"
              type="textarea"
              :rows="3"
              placeholder="请详细描述故障诊断结果"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <!-- 接车照片 -->
          <el-form-item
            label="接车照片"
            required
          >
            <el-upload
              v-model:file-list="receiveForm.checkinPhotos"
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :limit="9"
              accept="image/*"
              :on-change="handleCheckinPhotoChange"
              :on-preview="handlePreviewImage"
              :on-remove="handleRemoveCheckinPhoto"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              至少上传一张接车照片
            </div>
          </el-form-item>

          <!-- 报价商品 -->
          <el-form-item
            label="报价商品"
            required
          >
            <el-button
              type="primary"
              size="small"
              @click="showProductSelectDialog"
            >
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
            <div class="selected-items">
              <div
                v-if="receiveForm.selectedItems.length === 0"
                class="empty-tip"
              >
                暂未选择商品
              </div>
              <el-table
                v-else
                :data="receiveForm.selectedItems"
                style="width: 100%; margin-top: 10px"
                size="small"
              >
                <el-table-column
                  prop="name"
                  label="商品名称"
                  width="200"
                />
                <el-table-column
                  prop="category"
                  label="分类"
                  width="100"
                >
                  <template #default="{ row }">
                    {{ getCategoryText(row.category) }}
                  </template>
                </el-table-column>
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
                  width="150"
                >
                  <template #default="{ row, $index: _$index }">
                    <el-input-number
                      v-model="row.quantity"
                      :min="1"
                      :max="99"
                      size="small"
                      @change="updateItemTotal"
                    />
                  </template>
                </el-table-column>
                <el-table-column
                  label="小计"
                  width="100"
                >
                  <template #default="{ row }">
                    ¥{{ (row.price * row.quantity).toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column
                  label="操作"
                  width="80"
                >
                  <template #default="{ row: _row, $index }">
                    <el-button
                      type="danger"
                      link
                      size="small"
                      @click="removeSelectedItem($index)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-form-item>

          <!-- 报价总额 -->
          <el-form-item label="报价总额">
            <div class="total-amount">
              <span class="amount">¥{{ receiveForm.totalAmount }}</span>
            </div>
          </el-form-item>

          <!-- 报价说明 -->
          <el-form-item label="报价说明">
            <el-input
              v-model="receiveForm.description"
              type="textarea"
              :rows="3"
              placeholder="请填写报价说明（选填）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <!-- 报价图片 -->
          <el-form-item label="报价图片">
            <el-upload
              v-model:file-list="receiveForm.quoteImages"
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :limit="9"
              accept="image/*"
              :on-change="handleQuotePhotoChange"
              :on-preview="handlePreviewImage"
              :on-remove="handleRemoveQuotePhoto"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              可选：上传报价单、检测报告等图片
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="receiveDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="receiving"
          @click="handleSubmitQuote"
        >
          提交报价
        </el-button>
      </template>
    </el-dialog>

    <!-- 商品选择对话框 -->
    <el-dialog
      v-model="productSelectDialogVisible"
      title="选择商品"
      width="800px"
    >
      <el-input
        v-model="productSearchKeyword"
        placeholder="搜索商品名称或编码"
        clearable
        style="margin-bottom: 15px"
        @input="handleProductSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-table
        v-loading="loadingProducts"
        :data="productList"
        style="width: 100%; height: 400px"
        @selection-change="handleProductSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
        />
        <el-table-column
          prop="name"
          label="商品名称"
          width="200"
        />
        <el-table-column
          prop="code"
          label="编码"
          width="120"
        />
        <el-table-column
          prop="category"
          label="分类"
          width="100"
        >
          <template #default="{ row }">
            {{ getCategoryText(row.category) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="price"
          label="销售价格"
          width="100"
        >
          <template #default="{ row }">
            ¥{{ getProductPrice(row).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="stock"
          label="库存"
          width="80"
        />
        <el-table-column
          prop="unit"
          label="单位"
          width="60"
        />
      </el-table>

      <el-pagination
        v-model:current-page="productPagination.page"
        v-model:page-size="productPagination.limit"
        :total="productPagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 15px"
        @size-change="loadProducts"
        @current-change="loadProducts"
      />

      <template #footer>
        <el-button @click="productSelectDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :disabled="selectedProducts.length === 0"
          @click="confirmProductSelection"
        >
          确定添加（{{ selectedProducts.length }}）
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="imagePreviewVisible"
      title="图片预览"
      width="600px"
    >
      <img
        :src="previewImageUrl"
        style="width: 100%"
      >
    </el-dialog>

    <!-- 完工对话框 -->
    <el-dialog
      v-model="completeDialogVisible"
      title="维修完工"
      width="600px"
    >
      <el-form
        v-if="currentOrder"
        ref="completeFormRef"
        :model="completeForm"
        label-width="120px"
      >
        <el-form-item label="订单号">
          <el-input
            :value="currentOrder.orderNumber"
            disabled
          />
        </el-form-item>

        <el-form-item label="车牌号">
          <el-input
            :value="currentOrder.vehicleId?.plateNumber"
            disabled
          />
        </el-form-item>

        <el-form-item label="维修项目">
          <div
            v-if="currentOrder.quote && currentOrder.quote.items"
            style="margin-bottom: 10px"
          >
            <div
              v-for="(item, index) in currentOrder.quote.items"
              :key="index"
              style="padding: 5px 0; border-bottom: 1px solid #eee;"
            >
              {{ item.name }} - ¥{{ item.price }} x {{ item.quantity }}{{ item.unit }}
            </div>
          </div>
          <div v-else>
            无
          </div>
        </el-form-item>

        <el-form-item
          label="完工里程"
          required
        >
          <el-input-number
            v-model="completeForm.completionMileage"
            :min="0"
            :max="1000000"
            :step="1"
            placeholder="请输入完工里程"
            style="width: 200px"
          />
          <span style="margin-left: 10px">公里</span>
        </el-form-item>

        <el-form-item
          label="维修说明"
          required
        >
          <el-input
            v-model="completeForm.workDescription"
            type="textarea"
            :rows="4"
            placeholder="请详细说明维修内容和完成情况"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="注意事项">
          <el-input
            v-model="completeForm.notes"
            type="textarea"
            :rows="2"
            placeholder="填写需要司机注意的事项（选填）"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="completeDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="completing"
          @click="handleSubmitComplete"
        >
          提交完工
        </el-button>
      </template>
    </el-dialog>

    <!-- 增项对话框 -->
    <el-dialog
      v-model="addonDialogVisible"
      title="维修增项"
      width="800px"
    >
      <el-form
        v-if="currentOrder"
        ref="addonFormRef"
        :model="addonForm"
        label-width="120px"
      >
        <!-- 订单基本信息 -->
        <el-form-item label="订单号">
          <el-input
            :value="currentOrder.orderNumber"
            disabled
          />
        </el-form-item>

        <el-form-item label="车牌号">
          <el-input
            :value="currentOrder.vehicleId?.plateNumber"
            disabled
          />
        </el-form-item>

        <!-- 增项项目 -->
        <el-form-item
          label="增项项目"
          required
        >
          <el-button
            type="primary"
            plain
            @click="openAddonProductSelectDialog"
          >
            <el-icon><Plus /></el-icon>
            添加商品
          </el-button>

          <!-- 已选商品表格 -->
          <el-table
            v-if="addonForm.selectedItems.length > 0"
            :data="addonForm.selectedItems"
            style="width: 100%; margin-top: 10px"
            size="small"
            border
          >
            <el-table-column
              prop="name"
              label="商品名称"
              width="200"
            />
            <el-table-column
              prop="categoryText"
              label="分类"
              width="100"
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
              label="数量"
              width="150"
            >
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="99"
                  size="small"
                  @change="updateAddonTotal"
                />
              </template>
            </el-table-column>
            <el-table-column
              label="小计"
              width="120"
            >
              <template #default="{ row }">
                ¥{{ (row.price * row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="80"
            >
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="removeAddonItem($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <!-- 增项总额 -->
        <el-form-item label="增项总额">
          <div class="total-amount">
            ¥{{ addonForm.totalAmount }}
          </div>
        </el-form-item>

        <!-- 增项原因 -->
        <el-form-item
          label="增项原因"
          required
        >
          <el-input
            v-model="addonForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请详细说明增项原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <!-- 增项图片 -->
        <el-form-item label="增项图片">
          <el-upload
            v-model:file-list="addonForm.imageFileList"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="9"
            accept="image/*"
            :on-change="handleAddonPhotoChange"
            :on-preview="handlePreviewImage"
            :on-remove="handleRemoveAddonPhoto"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addonDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="warning"
          :loading="submittingAddon"
          @click="handleSubmitAddon"
        >
          提交增项
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Download } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getStoreOrders } from '@/api/store'
import { getOrderDetail } from '@/api/order'
import { getImageUrl, getImageUrls } from '@/utils/image'
import dayjs from 'dayjs'

const userRole = localStorage.getItem('role') || ''
const isStoreManager = userRole === 'STORE_MANAGER'
const isStoreTechnician = userRole === 'STORE_TECHNICIAN'

const loading = ref(false)
const exporting = ref(false)
const orders = ref([])
const detailVisible = ref(false)
const currentOrder = ref(null)

// 接车检查对话框相关
const receiveDialogVisible = ref(false)
const receiving = ref(false)
const receiveForm = ref({
  mileage: null,
  diagnosis: '',
  checkinPhotos: [],
  selectedItems: [],
  totalAmount: '0.00',
  description: '',
  quoteImages: []
})

// 商品选择相关
const productSelectDialogVisible = ref(false)
const productSelectSource = ref('') // 'quote' 或 'addon'
const loadingProducts = ref(false)
const productList = ref([])
const selectedProducts = ref([])
const productSearchKeyword = ref('')
const productPagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 图片预览
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

// 完工对话框相关
const completeDialogVisible = ref(false)
const completing = ref(false)
const completeForm = ref({
  completionMileage: null,
  workDescription: '',
  notes: ''
})

// 增项对话框相关
const addonDialogVisible = ref(false)
const submittingAddon = ref(false)
const addonFormRef = ref(null)
const addonForm = ref({
  selectedItems: [],
  totalAmount: '0.00',
  reason: '',
  imageFileList: []
})

const filters = reactive({
  status: '',
  type: '',
  startDate: '',
  endDate: ''
})

const dateRange = ref([])

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const stats = reactive({
  awaiting_fleet_approval: 0,
  awaiting_time_confirmation: 0,
  pending_assessment: 0,
  awaiting_approval: 0,
  in_repair: 0,
  awaiting_addon_approval: 0,
  pending_confirmation: 0,
  completed: 0
})

const defaultStats = {
  awaiting_fleet_approval: 0,
  awaiting_time_confirmation: 0,
  pending_assessment: 0,
  awaiting_approval: 0,
  in_repair: 0,
  awaiting_addon_approval: 0,
  pending_confirmation: 0,
  completed: 0
}

// 确认时间对话框相关
const confirmTimeDialogVisible = ref(false)
const confirming = ref(false)
const confirmTimeForm = ref({
  confirmedDate: '',
  confirmedTimeSlot: '',
  adjusted: false,
  remark: ''
})

// 时间段选项
const timeSlotOptions = [
  { label: '上午 08:00-10:00', value: '08:00-10:00' },
  { label: '上午 10:00-12:00', value: '10:00-12:00' },
  { label: '下午 14:00-16:00', value: '14:00-16:00' },
  { label: '下午 16:00-18:00', value: '16:00-18:00' },
  { label: '晚上 18:00-20:00', value: '18:00-20:00' }
]

onMounted(() => {
  loadOrders()
})

// 加载订单列表
async function loadOrders() {
  try {
    loading.value = true

    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }

    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    // 使用门店订单 API
    const res = await getStoreOrders(params)

    orders.value = res.data.list || []
    pagination.total = res.data.total || 0
    Object.assign(stats, defaultStats, res.data.stats || {})
  } catch (error) {
    ElMessage.error(error.message || '加载订单列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
function resetFilters() {
  Object.assign(filters, {
    status: '',
    type: ''
  })
  dateRange.value = []
  pagination.page = 1
  loadOrders()
}

// 导出订单列表
async function handleExport(type = 'all') {
  exporting.value = true
  try {
    const params = {}
    if (type === 'filtered') {
      // 导出当前页数据（支持筛选）
      if (filters.status) params.status = filters.status
      if (filters.type) params.type = filters.type
      params.limit = orders.value.length
    } else {
      // 导出全部数据（支持筛选）
      if (filters.status) params.status = filters.status
      if (filters.type) params.type = filters.type
      params.all = 'true'
    }

    const response = await request({
      url: '/orders/export',
      method: 'get',
      params,
      responseType: 'blob',
      timeout: 60000
    })

    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `订单列表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

// 查看详情
async function viewDetail(row) {
  try {
    const res = await getOrderDetail(row._id)
    currentOrder.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error(error.response?.data?.message || '获取订单详情失败')
  }
}

// 接车检查
function handleReceive(row) {
  currentOrder.value = row
  // 初始化表单，如果有之前的检查数据则回填
  receiveForm.value = {
    mileage: row.receiveCheck?.mileage || row.milestone || null,
    diagnosis: row.receiveCheck?.diagnosis || '',
    checkinPhotos: [],
    selectedItems: [],
    totalAmount: '0.00',
    description: '',
    quoteImages: []
  }
  receiveDialogVisible.value = true
}

// 显示商品选择对话框
async function showProductSelectDialog() {
  productSelectSource.value = 'quote'
  productSelectDialogVisible.value = true
  productSearchKeyword.value = ''
  selectedProducts.value = []
  await loadProducts()
}

// 加载商品列表
async function loadProducts() {
  loadingProducts.value = true
  try {
    const params = {
      page: productPagination.page,
      limit: productPagination.limit
    }

    if (productSearchKeyword.value) {
      params.keyword = productSearchKeyword.value
    }

    // 使用门店专属的商品API
    const res = await request({
      url: '/store/products',
      method: 'GET',
      params
    })

    productList.value = res.data.list || []
    productPagination.total = res.data.total || 0
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error(error.response?.data?.message || '加载商品列表失败')
  } finally {
    loadingProducts.value = false
  }
}

// 搜索商品
async function handleProductSearch() {
  productPagination.page = 1
  await loadProducts()
}

// 商品选择变化
function handleProductSelectionChange(selection) {
  selectedProducts.value = selection
}

function getProductPrice(product) {
  const rawPrice = product?.price ?? product?.salePrice ?? 0
  const parsedPrice = Number(rawPrice)
  return Number.isFinite(parsedPrice) ? parsedPrice : 0
}

function getCategoryText(category) {
  const categoryMap = {
    parts: '配件',
    labor: '工时',
    service: '服务',
    material: '材料'
  }
  return categoryMap[category] || category || '-'
}

// 确认商品选择
function confirmProductSelection() {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请至少选择一个商品')
    return
  }

  if (productSelectSource.value === 'addon') {
    // 增项来源
    addSelectedProductsToAddon()
  } else {
    // 报价来源（默认）
    addSelectedProductsToQuote()
  }
}

// 添加商品到报价（原confirmProductSelection的逻辑）
function addSelectedProductsToQuote() {
  // 添加到已选商品列表
  selectedProducts.value.forEach(product => {
    // 检查是否已存在
    const existingIndex = receiveForm.value.selectedItems.findIndex(item => item.id === product._id)

    if (existingIndex >= 0) {
      // 已存在，数量+1
      receiveForm.value.selectedItems[existingIndex].quantity += 1
    } else {
      // 不存在，添加新商品
      receiveForm.value.selectedItems.push({
        id: product._id,
        name: product.name,
        code: product.code,
        category: product.category,
        categoryText: getCategoryText(product.category),
        price: getProductPrice(product),
        quantity: 1,
        unit: product.unit
      })
    }
  })

  updateTotal()
  productSelectDialogVisible.value = false
  ElMessage.success(`成功添加 ${selectedProducts.value.length} 个商品`)
}

// 移除已选商品
function removeSelectedItem(index) {
  receiveForm.value.selectedItems.splice(index, 1)
  updateTotal()
}

// 更新单项总价
function updateItemTotal() {
  updateTotal()
}

// 计算并更新总价
function updateTotal() {
  const total = receiveForm.value.selectedItems.reduce((sum, item) => {
    return sum + (parseFloat(item.price) || 0) * (item.quantity || 1)
  }, 0)
  receiveForm.value.totalAmount = total.toFixed(2)
}

// 接车照片变化
function handleCheckinPhotoChange(file, fileList) {
  receiveForm.value.checkinPhotos = fileList
}

// 移除接车照片
function handleRemoveCheckinPhoto(file, fileList) {
  receiveForm.value.checkinPhotos = fileList
}

// 报价照片变化
function handleQuotePhotoChange(file, fileList) {
  receiveForm.value.quoteImages = fileList
}

// 移除报价照片
function handleRemoveQuotePhoto(file, fileList) {
  receiveForm.value.quoteImages = fileList
}

// 预览图片
function handlePreviewImage(file) {
  previewImageUrl.value = file.url
  imagePreviewVisible.value = true
}

// 提交报价
async function handleSubmitQuote() {
  // 验证表单
  if (!receiveForm.value.mileage) {
    ElMessage.warning('请输入当前里程')
    return
  }
  if (!receiveForm.value.diagnosis) {
    ElMessage.warning('请填写故障诊断')
    return
  }
  if (receiveForm.value.checkinPhotos.length === 0) {
    ElMessage.warning('请至少上传一张接车照片')
    return
  }
  if (receiveForm.value.selectedItems.length === 0) {
    ElMessage.warning('请至少选择一个商品')
    return
  }

  const total = parseFloat(receiveForm.value.totalAmount)
  if (total <= 0) {
    ElMessage.warning('报价金额必须大于0')
    return
  }

  receiving.value = true
  try {
    // 上传接车照片
    const uploadedCheckinPhotos = []
    for (let i = 0; i < receiveForm.value.checkinPhotos.length; i++) {
      const file = receiveForm.value.checkinPhotos[i]
      if (file.raw) {
        const formData = new FormData()
        formData.append('file', file.raw)
        const uploadRes = await request({
          url: '/upload',
          method: 'POST',
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploadedCheckinPhotos.push(uploadRes.url)
      } else if (file.url) {
        uploadedCheckinPhotos.push(file.url)
      }
    }

    // 上传报价图片
    const uploadedQuoteImages = []
    for (let i = 0; i < receiveForm.value.quoteImages.length; i++) {
      const file = receiveForm.value.quoteImages[i]
      if (file.raw) {
        const formData = new FormData()
        formData.append('file', file.raw)
        const uploadRes = await request({
          url: '/upload',
          method: 'POST',
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploadedQuoteImages.push(uploadRes.url)
      } else if (file.url) {
        uploadedQuoteImages.push(file.url)
      }
    }

    // 构建报价数据
    const quoteData = {
      mileage: receiveForm.value.mileage,
      diagnosis: receiveForm.value.diagnosis,
      checkinPhotos: uploadedCheckinPhotos,
      quoteItems: receiveForm.value.selectedItems.map(item => ({
        item: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity,
        productId: item.id,
        category: item.category
      })),
      description: receiveForm.value.description,
      quoteImages: uploadedQuoteImages
    }

    await request({
      url: `/orders/${currentOrder.value._id}/quote`,
      method: 'POST',
      data: quoteData
    })

    ElMessage.success('报价提交成功')
    receiveDialogVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    receiving.value = false
  }
}

// 完工
function handleComplete(row) {
  currentOrder.value = row
  completeForm.value = {
    completionMileage: row.receiveCheck?.mileage || null,
    workDescription: '',
    notes: ''
  }
  completeDialogVisible.value = true
}

// 提交完工
async function handleSubmitComplete() {
  // 验证表单
  if (!completeForm.value.completionMileage) {
    ElMessage.warning('请输入完工里程')
    return
  }
  if (!completeForm.value.workDescription) {
    ElMessage.warning('请填写维修说明')
    return
  }

  completing.value = true
  try {
    await request({
      url: `/orders/${currentOrder.value._id}/complete`,
      method: 'POST',
      data: completeForm.value
    })
    ElMessage.success('维修完工提交成功')
    completeDialogVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    completing.value = false
  }
}

// 增项相关方法
function handleAddon(row) {
  currentOrder.value = row
  addonForm.value = {
    selectedItems: [],
    totalAmount: '0.00',
    reason: '',
    imageFileList: []
  }
  addonDialogVisible.value = true
}

// 打开增项商品选择对话框
async function openAddonProductSelectDialog() {
  productSelectSource.value = 'addon'
  productSelectDialogVisible.value = true
  productSearchKeyword.value = ''
  // 使用临时变量存储选中的商品
  selectedProducts.value = []
  await loadProducts()
}

// 从商品选择对话框添加商品到增项
function addSelectedProductsToAddon() {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请先选择商品')
    return
  }

  // 添加到增项表单
  selectedProducts.value.forEach(product => {
    const existingIndex = addonForm.value.selectedItems.findIndex(item => item.id === product._id)
    if (existingIndex >= 0) {
      // 已存在，数量+1
      addonForm.value.selectedItems[existingIndex].quantity += 1
    } else {
      // 不存在，添加新商品
      addonForm.value.selectedItems.push({
        id: product._id,
        name: product.name,
        code: product.code,
        category: product.category,
        categoryText: getCategoryText(product.category),
        price: getProductPrice(product),
        quantity: 1,
        unit: product.unit
      })
    }
  })

  updateAddonTotal()
  productSelectDialogVisible.value = false
  selectedProducts.value = []
  ElMessage.success(`成功添加 ${selectedProducts.value.length} 个增项商品`)
}

function removeAddonItem(index) {
  addonForm.value.selectedItems.splice(index, 1)
  updateAddonTotal()
}

function updateAddonTotal() {
  const total = addonForm.value.selectedItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  )
  addonForm.value.totalAmount = total.toFixed(2)
}

// 增项图片相关
function handleAddonPhotoChange(file, fileList) {
  addonForm.value.imageFileList = fileList
}

function handleRemoveAddonPhoto(file, fileList) {
  addonForm.value.imageFileList = fileList
}

// 上传单张图片
function uploadSingleImage(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file.raw)

    request({
      url: '/upload',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(res => {
        resolve(res.url)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 提交增项
async function handleSubmitAddon() {
  // 验证
  if (addonForm.value.selectedItems.length === 0) {
    ElMessage.warning('请至少添加一个增项商品')
    return
  }
  if (!addonForm.value.reason || addonForm.value.reason.trim() === '') {
    ElMessage.warning('请填写增项原因')
    return
  }

  submittingAddon.value = true
  try {
    // 上传图片
    const uploadedImages = []
    for (let i = 0; i < addonForm.value.imageFileList.length; i++) {
      try {
        const url = await uploadSingleImage(addonForm.value.imageFileList[i])
        uploadedImages.push(url)
      } catch (error) {
        console.error('上传图片失败:', error)
      }
    }

    // 构建增项数据
    const addonData = {
      addonItems: addonForm.value.selectedItems.map(item => ({
        item: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity,
        productId: item.id,
        category: item.category
      })),
      reason: addonForm.value.reason.trim(),
      addonImages: uploadedImages
    }

    await request({
      url: `/orders/${currentOrder.value._id}/addon`,
      method: 'POST',
      data: addonData
    })

    ElMessage.success('增项提交成功')
    addonDialogVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    submittingAddon.value = false
  }
}

// 辅助函数
function getStatusText(status) {
  const map = {
    awaiting_fleet_approval: '待车队审批',
    awaiting_time_confirmation: '待确认时间',
    pending_assessment: '待接车检查',
    awaiting_approval: '待审批报价',
    in_repair: '维修中',
    awaiting_addon_approval: '增项待审批',
    pending_confirmation: '待确认',
    completed: '已完成',
    refunded: '已退款',
    rejected: '已拒绝',
    cancelled: '已撤销',
    expired: '已超时关闭'
  }
  return map[status] || '未知'
}

function getStatusColor(status) {
  const map = {
    awaiting_fleet_approval: 'warning',
    awaiting_time_confirmation: 'info',
    pending_assessment: 'warning',
    awaiting_approval: 'warning',
    in_repair: 'primary',
    awaiting_addon_approval: 'warning',
    pending_confirmation: 'warning',
    completed: 'success',
    refunded: 'info',
    rejected: 'danger',
    cancelled: 'info',
    expired: 'warning'
  }
  return map[status] || 'info'
}

function formatAmount(amount) {
  if (!amount) return '0.00'
  return parseFloat(amount / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

function getDetailImageUrls(images) {
  return getImageUrls(images || [])
}

function getAppointmentDisplay(order) {
  if (!order) return '-'

  if (order.appointmentAt) {
    return formatDate(order.appointmentAt)
  }

  if (order.appointment?.confirmedDate) {
    const confirmedDate = dayjs(order.appointment.confirmedDate).format('YYYY-MM-DD')
    return `${confirmedDate} ${order.appointment.confirmedTimeSlot || ''}`.trim()
  }

  if (order.appointment?.expectedDate) {
    const expectedDate = dayjs(order.appointment.expectedDate).format('YYYY-MM-DD')
    return `${expectedDate} ${order.appointment.expectedTimeSlot || ''}`.trim()
  }

  return '-'
}

// 打开确认时间对话框
function openConfirmTimeDialog(order) {
  currentOrder.value = order

  // 默认填充司机期望的时间
  const expectedDate = order.appointment?.expectedDate
    ? dayjs(order.appointment.expectedDate).format('YYYY-MM-DD')
    : dayjs().format('YYYY-MM-DD')

  confirmTimeForm.value = {
    confirmedDate: expectedDate,
    confirmedTimeSlot: order.appointment?.expectedTimeSlot || '09:00-11:00',
    adjusted: false,
    remark: ''
  }

  confirmTimeDialogVisible.value = true
}

// 确认时间
async function handleConfirmTime() {
  if (!confirmTimeForm.value.confirmedDate) {
    ElMessage.warning('请选择确认日期')
    return
  }
  if (!confirmTimeForm.value.confirmedTimeSlot) {
    ElMessage.warning('请选择确认时间段')
    return
  }

  confirming.value = true
  try {
    await request({
      url: `/orders/${currentOrder.value._id}/confirm-time`,
      method: 'put',
      data: confirmTimeForm.value
    })

    ElMessage.success(confirmTimeForm.value.adjusted ? '已调整到店时间' : '已确认到店时间')
    confirmTimeDialogVisible.value = false
    loadOrders() // 刷新订单列表
  } catch (error) {
    console.error('确认时间失败:', error)
    ElMessage.error(error.message || '确认时间失败')
  } finally {
    confirming.value = false
  }
}
</script>

<style scoped>
.store-orders {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card :deep(.el-statistic__number) {
  color: #409EFF;
}

.stat-card-warning :deep(.el-statistic__number) {
  color: #E6A23C;
}

.stat-card-primary :deep(.el-statistic__number) {
  color: #409EFF;
}

.stat-card-success :deep(.el-statistic__number) {
  color: #67C23A;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.amount {
  color: #F56C6C;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 接车检查相关样式 */
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.selected-items {
  margin-top: 10px;
}

.empty-tip {
  color: #909399;
  font-size: 14px;
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.total-amount {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

.detail-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-image-item {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
}

.empty-text {
  color: #909399;
}
</style>
