<template>
  <div class="store-packages">
    <!-- 操作栏 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="18">
          <el-button
            type="primary"
            @click="handleCreate"
          >
            <el-icon><Plus /></el-icon>
            新建套餐
          </el-button>
          <el-button
            type="success"
            @click="handleBatchImport"
          >
            <el-icon><Upload /></el-icon>
            批量导入
          </el-button>
        </el-col>
        <el-col
          :span="6"
          style="text-align: right"
        >
          <el-select
            v-model="filters.vehicleGroup"
            placeholder="车型分组"
            clearable
            style="width: 140px"
            @change="handleFilterChange"
          >
            <el-option
              label="牵引车"
              value="牵引车"
            />
            <el-option
              label="载货车"
              value="载货车"
            />
            <el-option
              label="轻卡"
              value="轻卡"
            />
            <el-option
              label="自卸"
              value="自卸"
            />
          </el-select>
          <el-select
            v-model="filters.tier"
            placeholder="套餐档位"
            clearable
            style="width: 140px"
            @change="handleFilterChange"
          >
            <el-option
              label="实惠"
              value="实惠"
            />
            <el-option
              label="标准"
              value="标准"
            />
            <el-option
              label="优质"
              value="优质"
            />
            <el-option
              label="尊享"
              value="尊享"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- 套餐列表 -->
    <el-card>
      <!-- 状态标签页 -->
      <el-tabs
        v-model="activeTab"
        @tab-change="handleTabChange"
      >
        <el-tab-pane
          label="草稿"
          name="draft"
        />
        <el-tab-pane
          label="待审核"
          name="pending_audit"
        />
        <el-tab-pane
          label="已上架"
          name="approved"
        />
        <el-tab-pane
          label="被拒绝"
          name="rejected"
        />
      </el-tabs>

      <el-table
        v-loading="loading"
        :data="packages"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="name"
          label="套餐名称"
          width="180"
        />
        <el-table-column
          prop="code"
          label="套餐编码"
          width="160"
        />
        <el-table-column
          label="套餐类型"
          width="200"
        >
          <template #default="{ row }">
            <div v-if="row.standardId">
              <el-tag
                size="small"
                type="info"
              >
                {{ row.vehicleGroup || '-' }}
              </el-tag>
              <el-tag
                size="small"
                style="margin-left: 4px;"
              >
                {{ row.tier || '-' }}
              </el-tag>
              <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                {{ row.standardId.name }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="价格"
          width="120"
        >
          <template #default="{ row }">
            <span style="color: #f56c6c;">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="预估时长"
          width="100"
        >
          <template #default="{ row }">
            {{ row.estimatedDuration }} 小时
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.auditStatus)"
              size="small"
            >
              {{ getStatusLabel(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="审核备注"
          width="200"
        >
          <template #default="{ row }">
            <div
              v-if="row.auditInfo"
              class="audit-info"
            >
              <span v-if="row.auditInfo.auditNote">{{ row.auditInfo.auditNote }}</span>
              <span
                v-if="row.auditInfo.rejectReason"
                style="color: #f56c6c;"
              >
                拒绝原因：{{ row.auditInfo.rejectReason }}
              </span>
            </div>
            <span
              v-else
              style="color: #909399;"
            >-</span>
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
          width="220"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.auditStatus === 'draft' || row.auditStatus === 'rejected'"
              type="primary"
              size="small"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.auditStatus === 'draft' || row.auditStatus === 'rejected'"
              type="success"
              size="small"
              link
              @click="handleSubmit(row)"
            >
              提交审核
            </el-button>
            <el-button
              v-if="row.auditStatus === 'draft' || row.auditStatus === 'rejected'"
              type="danger"
              size="small"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <el-button
              v-if="row.auditStatus === 'approved'"
              type="warning"
              size="small"
              link
              @click="handleToggleEnabled(row)"
            >
              {{ row.enabled ? '停用' : '启用' }}
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
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px"
        @size-change="fetchPackages"
        @current-change="fetchPackages"
      />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑套餐' : '新建套餐'"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <!-- 套餐类型选择（从平台创建的套餐类型中选择） -->
        <el-form-item
          label="套餐类型"
          prop="standardId"
        >
          <el-select
            v-model="form.standardId"
            placeholder="请选择套餐类型"
            style="width: 100%"
            filterable
            @change="handleStandardChange"
          >
            <el-option
              v-for="standard in availableStandards"
              :key="standard._id"
              :label="standard.name"
              :value="standard._id"
            />
          </el-select>
          <div class="form-item-tip">
            请选择平台运营维护的保养类型，车型和档位由门店单独配置
          </div>
        </el-form-item>

        <el-form-item
          label="车型分组"
          prop="vehicleGroup"
        >
          <el-select
            v-model="form.vehicleGroup"
            placeholder="请选择车型分组"
            style="width: 100%"
          >
            <el-option
              label="牵引车"
              value="牵引车"
            />
            <el-option
              label="载货车"
              value="载货车"
            />
            <el-option
              label="轻卡"
              value="轻卡"
            />
            <el-option
              label="自卸"
              value="自卸"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          label="套餐档位"
          prop="tier"
        >
          <el-select
            v-model="form.tier"
            placeholder="请选择套餐档位"
            style="width: 100%"
          >
            <el-option
              label="实惠"
              value="实惠"
            />
            <el-option
              label="标准"
              value="标准"
            />
            <el-option
              label="优质"
              value="优质"
            />
            <el-option
              label="尊享"
              value="尊享"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          label="套餐名称"
          prop="name"
        >
          <el-input
            v-model="form.name"
            placeholder="请输入套餐名称（如：春季牵引车标准保养套餐）"
          />
        </el-form-item>

        <el-form-item label="套餐描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入套餐描述"
          />
        </el-form-item>

        <el-form-item label="里程范围">
          <el-input-number
            v-model="form.mileageRangeMin"
            :min="0"
            :max="999999"
            placeholder="最小里程"
            style="width: 150px"
          />
          <span style="margin: 0 12px;">-</span>
          <el-input-number
            v-model="form.mileageRangeMax"
            :min="0"
            :max="999999"
            placeholder="最大里程"
            style="width: 150px"
          />
          <span style="margin-left: 12px;">km</span>
        </el-form-item>

        <el-form-item label="套餐价格">
          <el-input-number
            v-model="form.price"
            :min="0"
            :precision="2"
            :step="100"
            controls-position="right"
            style="width: 200px"
            placeholder="请先添加商品"
          />
          <span style="margin-left: 12px;">元</span>
          <div style="margin-top: 8px; font-size: 12px; color: #909399;">
            原价：¥{{ calculatedOriginalPrice.toFixed(2) }}
            <span
              v-if="form.price && form.price !== calculatedOriginalPrice"
              style="margin-left: 8px; color: #409eff;"
            >
              ({{ form.price > calculatedOriginalPrice ? '加价' : '打折' }}: ¥{{ (form.price - calculatedOriginalPrice).toFixed(2) }})
            </span>
          </div>
          <!-- 价格区间提示 -->
          <div
            v-if="currentPriceRange"
            class="price-range-hint"
          >
            <el-tag
              :type="getPriceTagType(form.price || calculatedOriginalPrice)"
              size="small"
            >
              规范区间：¥{{ currentPriceRange.minPrice }} - ¥{{ currentPriceRange.maxPrice }}
            </el-tag>
            <span
              v-if="isPriceOutOfRange"
              style="color: #f56c6c; margin-left: 8px;"
            >
              ⚠️ 价格超出区间，提交后需要人工审核
            </span>
            <span
              v-else
              style="color: #67c23a; margin-left: 8px;"
            >
              ✓ 价格在区间内
            </span>
          </div>
        </el-form-item>

        <!-- 原价显示（自动计算） -->
        <el-form-item label="原价（商品总价）">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 18px; color: #909399;">
              ¥{{ calculatedOriginalPrice.toFixed(2) }}
            </span>
            <el-tag
              v-if="form.products.length > 0"
              size="small"
              style="margin-left: 12px;"
            >
              由商品总价自动计算
            </el-tag>
            <span
              v-else
              style="color: #909399; font-size: 12px; margin-left: 8px;"
            >
              添加商品后自动计算
            </span>
          </div>
        </el-form-item>

        <el-form-item label="预估时长">
          <el-input-number
            v-model="form.estimatedDuration"
            :min="0.5"
            :max="24"
            :step="0.5"
            controls-position="right"
            style="width: 150px"
          />
          <span style="margin-left: 12px;">小时</span>
        </el-form-item>

        <!-- 服务项目 -->
        <el-form-item label="服务项目">
          <div class="service-items-container">
            <div
              v-for="(item, index) in form.serviceItems"
              :key="index"
              class="service-item-row"
            >
              <el-input
                v-model="item.name"
                placeholder="项目名称"
                style="width: 180px; margin-right: 8px;"
              />
              <el-input
                v-model="item.icon"
                placeholder="图标emoji"
                style="width: 100px; margin-right: 8px;"
              />
              <el-input
                v-model="item.description"
                placeholder="描述"
                style="width: 200px; margin-right: 8px;"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeServiceItem(index)"
              >
                删除
              </el-button>
            </div>
            <el-button
              type="primary"
              size="small"
              style="margin-top: 10px;"
              @click="addServiceItem"
            >
              + 添加服务项目
            </el-button>
          </div>
        </el-form-item>

        <!-- 商品列表（从门店商品库选择） -->
        <el-form-item label="包含商品">
          <div class="products-container">
            <div
              v-for="(item, index) in form.products"
              :key="index"
              class="product-selected-row"
            >
              <div style="flex: 1;">
                <span
                  v-if="item.productName"
                  style="font-weight: 500;"
                >
                  {{ item.productName }}
                </span>
                <span
                  v-else
                  style="color: #909399;"
                >
                  请选择商品
                </span>
                <el-tag
                  v-if="item.productUnit"
                  size="small"
                  style="margin-left: 8px;"
                >
                  {{ item.productUnit }}
                </el-tag>
                <span
                  v-if="item.productPrice"
                  style="color: #f56c6c; margin-left: 8px;"
                >
                  ¥{{ item.productPrice }}
                </span>
              </div>
              <el-input-number
                v-model="item.quantity"
                :min="1"
                placeholder="数量"
                style="width: 120px; margin: 0 8px;"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeProduct(index)"
              >
                删除
              </el-button>
            </div>
            <el-button
              type="primary"
              size="small"
              style="margin-top: 10px;"
              @click="showProductSelector"
            >
              + 从商品库选择
            </el-button>
          </div>
          <div class="form-item-tip">
            从本门店商品库中选择商品，原价将自动计算为商品总价
          </div>
        </el-form-item>

        <el-form-item label="套餐标签">
          <el-input
            v-model="tagsInput"
            placeholder="输入标签，用逗号分隔"
            @blur="handleTagsChange"
          />
          <div
            v-if="form.tags && form.tags.length > 0"
            class="tags-container"
          >
            <el-tag
              v-for="(tag, index) in form.tags"
              :key="index"
              closable
              style="margin-right: 8px; margin-top: 8px;"
              @close="removeTag(index)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmitForm"
        >
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 商品选择对话框 -->
    <el-dialog
      v-model="productSelectorVisible"
      title="选择商品"
      width="700px"
    >
      <el-input
        v-model="productSearchKeyword"
        placeholder="搜索商品名称"
        style="margin-bottom: 16px;"
        clearable
        @input="searchProducts"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-table
        v-loading="productsLoading"
        :data="availableProducts"
        height="400"
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
          label="类别"
          width="100"
        />
        <el-table-column
          label="价格"
          width="100"
        >
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column
          prop="unit"
          label="单位"
          width="80"
        />
      </el-table>

      <template #footer>
        <el-button @click="productSelectorVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="confirmProductSelection"
        >
          确定添加（{{ tempSelectedProducts.length }} 件）
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="套餐详情"
      width="600px"
    >
      <div
        v-if="currentPackage"
        class="package-detail"
      >
        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="套餐名称">
            {{ currentPackage.name }}
          </el-descriptions-item>
          <el-descriptions-item label="套餐编码">
            {{ currentPackage.code }}
          </el-descriptions-item>
          <el-descriptions-item label="套餐类型">
            <div v-if="currentPackage.standardId">
              {{ currentPackage.vehicleGroup || '-' }} - {{ currentPackage.tier || '-' }}
              <div style="font-size: 12px; color: #909399;">
                {{ currentPackage.standardId.name }}
              </div>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="套餐价格">
            ¥{{ currentPackage.price }}
          </el-descriptions-item>
          <el-descriptions-item label="原价">
            {{ currentPackage.originalPrice ? '¥' + currentPackage.originalPrice.toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="预估时长">
            {{ currentPackage.estimatedDuration }} 小时
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="getStatusType(currentPackage.auditStatus)">
              {{ getStatusLabel(currentPackage.auditStatus) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div
          v-if="currentPackage.auditInfo"
          style="margin-top: 20px;"
        >
          <h4>审核信息</h4>
          <div
            v-if="currentPackage.auditInfo.auditNote"
            style="color: #67c23a;"
          >
            {{ currentPackage.auditInfo.auditNote }}
          </div>
          <div
            v-if="currentPackage.auditInfo.rejectReason"
            style="color: #f56c6c;"
          >
            拒绝原因：{{ currentPackage.auditInfo.rejectReason }}
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4>服务项目</h4>
          <div v-if="currentPackage.serviceItems && currentPackage.serviceItems.length > 0">
            <div
              v-for="(item, index) in currentPackage.serviceItems"
              :key="index"
              style="padding: 4px 0;"
            >
              {{ item.icon }} {{ item.name }}
              <span
                v-if="item.description"
                style="color: #909399;"
              > - {{ item.description }}</span>
            </div>
          </div>
          <div
            v-else
            style="color: #909399;"
          >
            无服务项目
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4>包含商品</h4>
          <div v-if="currentPackage.products && currentPackage.products.length > 0">
            <div
              v-for="(item, index) in currentPackage.products"
              :key="index"
              style="padding: 4px 0; display: flex; justify-content: space-between;"
            >
              <span>{{ item.productId?.name || '-' }}</span>
              <span>x {{ item.quantity }} {{ item.productId?.unit || '' }}</span>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <strong>商品总价：¥{{ currentPackage.products.reduce((sum, item) => sum + (item.productId?.price || 0) * item.quantity, 0).toFixed(2) }}</strong>
            </div>
          </div>
          <div
            v-else
            style="color: #909399;"
          >
            无商品
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量导入套餐"
      width="720px"
    >
      <div class="batch-import-content">
        <div
          v-if="!importResult.message"
          class="upload-section"
        >
          <div class="upload-header">
            <el-button
              type="primary"
              link
              :loading="downloading"
              @click="downloadTemplate"
            >
              <el-icon><Download /></el-icon>
              下载 Excel 模板
            </el-button>
          </div>

          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
          >
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">
              拖拽 Excel 文件到此处，或点击上传
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .xlsx / .xls，文件大小不超过 5MB
              </div>
            </template>
          </el-upload>

          <el-alert
            type="info"
            :closable="false"
            show-icon
            style="margin-top: 20px"
          >
            批量导入套餐后，可直接保存或提交平台审核。
          </el-alert>

          <div class="upload-footer">
            <el-button @click="batchDialogVisible = false">
              取消
            </el-button>
            <el-button
              type="primary"
              :loading="importing"
              :disabled="!uploadFile"
              @click="startImport"
            >
              <el-icon><Upload /></el-icon>
              开始导入
            </el-button>
          </div>
        </div>

        <div
          v-else
          class="result-section"
        >
          <el-result
            :icon="importResult.successCount > 0 ? 'success' : 'error'"
            :title="importResult.message"
          >
            <template #sub-title>
              <div class="result-stats">
                <p>总计：{{ importResult.total }} 条</p>
                <p style="color: #67c23a">
                  成功：{{ importResult.successCount }} 条
                </p>
                <p style="color: #f56c6c">
                  失败：{{ importResult.failedCount }} 条
                </p>
              </div>
            </template>
            <template #extra>
              <div
                v-if="importResult.errors?.length"
                class="error-list"
              >
                <el-divider content-position="left">
                  错误详情
                </el-divider>
                <el-scrollbar height="200px">
                  <div
                    v-for="(error, index) in importResult.errors.slice(0, 50)"
                    :key="index"
                    class="error-item"
                  >
                    第 {{ error.row }} 行：{{ error.error }}
                  </div>
                </el-scrollbar>
              </div>
              <div class="result-actions">
                <el-button @click="batchDialogVisible = false">
                  关闭
                </el-button>
                <el-button
                  v-if="importResult.failedCount > 0"
                  type="primary"
                  @click="resetImport"
                >
                  <el-icon><Refresh /></el-icon>
                  重新导入
                </el-button>
              </div>
            </template>
          </el-result>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, InfoFilled, Upload, Download, UploadFilled, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { batchImportStorePackages } from '@/api/batch'
import {
  getMyStorePackages,
  createStorePackage,
  updateStorePackage,
  deleteStorePackage,
  submitPackageForAudit,
  getAvailablePackageTypes,
  getStoreProducts
} from '@/api/packageStandard'

// 数据
const loading = ref(false)
const submitting = ref(false)
const packages = ref([])
const total = ref(0)
const activeTab = ref('draft')

// 套餐类型列表
const availableStandards = ref([])

// 门店商品列表
const availableProducts = ref([])
const productsLoading = ref(false)
const productSearchKeyword = ref('')
const productSelectorVisible = ref(false)
const tempSelectedProducts = ref([])

const filters = reactive({
  vehicleGroup: '',
  tier: ''
})

const pagination = reactive({
  page: 1,
  limit: 20
})

// 价格区间参考
const currentPriceRange = ref(null)

// 对话框
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentPackage = ref(null)
const tagsInput = ref('')

const form = reactive({
  standardId: '',
  name: '',
  description: '',
  vehicleGroup: '',
  mileageRangeMin: 0,
  mileageRangeMax: 999999,
  tier: '',
  price: null,
  estimatedDuration: 2,
  serviceItems: [],
  products: [],
  tags: []
})

const formRules = {
  standardId: [{ required: true, message: '请选择套餐类型', trigger: 'change' }],
  vehicleGroup: [{ required: true, message: '请选择车型分组', trigger: 'change' }],
  tier: [{ required: true, message: '请选择套餐档位', trigger: 'change' }],
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }]
  // price 改为可选，默认等于原价
}

// 批量导入相关
const batchDialogVisible = ref(false)
const importing = ref(false)
const downloading = ref(false)
const uploadFile = ref(null)
const uploadRef = ref()
const importResult = ref({
  message: '',
  total: 0,
  successCount: 0,
  failedCount: 0,
  errors: []
})

// 计算属性：原价（商品总价）
const calculatedOriginalPrice = computed(() => {
  return calculateProductsTotal(form.products)
})

// 计算属性：价格是否超出区间
const isPriceOutOfRange = computed(() => {
  if (!currentPriceRange.value || !form.price) return false
  // 套餐价格和规范价格区间单位都是元，直接比较
  return form.price < currentPriceRange.value.minPrice || form.price > currentPriceRange.value.maxPrice
})

// 计算商品总价
function calculateProductsTotal(products) {
  if (!products || products.length === 0) return 0
  return products.reduce((total, item) => {
    return total + (item.productPrice || 0) * (item.quantity || 1)
  }, 0)
}

// 方法
const fetchPackages = async () => {
  loading.value = true
  try {
    const response = await getMyStorePackages({
      page: pagination.page,
      limit: pagination.limit,
      auditStatus: activeTab.value,
      ...filters
    })
    packages.value = response.data?.packages || []
    total.value = response.data?.total || 0
  } catch (error) {
    ElMessage.error('获取套餐列表失败')
  } finally {
    loading.value = false
  }
}

const fetchAvailableStandards = async () => {
  try {
    console.log('开始获取套餐类型列表...')
    const response = await getAvailablePackageTypes()
    console.log('套餐类型响应:', response)
    const standards = response?.data || []
    console.log('解析到套餐类型数量:', standards.length)
    availableStandards.value = standards
  } catch (error) {
    console.error('获取套餐类型失败:', error)
    console.error('错误详情:', error.response?.data)
    ElMessage.error(error.response?.data?.message || '获取套餐类型失败')
  }
}

const fetchStoreProducts = async (keyword = '') => {
  productsLoading.value = true
  try {
    console.log('开始获取商品列表, keyword:', keyword)
    const response = await getStoreProducts({ keyword })
    console.log('商品列表响应:', response)
    const products = response?.data || []
    console.log('解析到商品数量:', products.length)
    availableProducts.value = products
  } catch (error) {
    console.error('获取商品列表失败:', error)
    console.error('错误详情:', error.response?.data)
    ElMessage.error(error.response?.data?.message || '获取商品列表失败')
  } finally {
    productsLoading.value = false
  }
}

const searchProducts = () => {
  fetchStoreProducts(productSearchKeyword.value)
}

const handleTabChange = () => {
  pagination.page = 1
  fetchPackages()
}

const handleFilterChange = () => {
  pagination.page = 1
  fetchPackages()
}

// 套餐类型变化
const handleStandardChange = (standardId) => {
  console.log('套餐类型变化，standardId:', standardId)
  console.log('可用的套餐类型:', availableStandards.value)
  const standard = availableStandards.value.find(s => String(s._id) === String(standardId))
  console.log('找到的套餐类型:', standard)
  if (standard) {
    console.log('当前套餐类型仅用于选择平台保养类型，车型和档位由门店自行配置')
  } else {
    console.error('未找到匹配的套餐类型，standardId:', standardId)
  }
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, {
    standardId: '',
    name: '',
    description: '',
    vehicleGroup: '',
    mileageRangeMin: 0,
    mileageRangeMax: 999999,
    tier: '',
    price: null,
    estimatedDuration: 2,
    serviceItems: [],
    products: [],
    tags: []
  })
  tagsInput.value = ''
  currentPriceRange.value = null
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    _id: row._id,
    standardId: row.standardId?._id,
    name: row.name,
    description: row.description || '',
    vehicleGroup: row.vehicleGroup,
    mileageRangeMin: row.mileageRange?.min || 0,
    mileageRangeMax: row.mileageRange?.max || 999999,
    tier: row.tier,
    price: row.price,
    estimatedDuration: row.estimatedDuration || 2,
    serviceItems: row.serviceItems ? [...row.serviceItems] : [],
    products: row.products ? row.products.map(p => ({
      productId: p.productId?._id,
      quantity: p.quantity,
      productName: p.productId?.name,
      productUnit: p.productId?.unit,
      productPrice: p.productId?.price
    })) : [],
    tags: row.tags ? [...row.tags] : []
  })
  tagsInput.value = row.tags ? row.tags.join(', ') : ''
  dialogVisible.value = true
}

const handleSubmitForm = async () => {
  // 清除 price 字段的验证状态（因为 price 是可选的）
  formRef.value.clearValidate('price')

  // 验证表单
  await formRef.value.validate()

  submitting.value = true
  try {
    const submitData = {
      standardId: form.standardId,
      name: form.name,
      description: form.description,
      vehicleGroup: form.vehicleGroup,
      mileageRangeMin: form.mileageRangeMin,
      mileageRangeMax: form.mileageRangeMax,
      tier: form.tier,
      // price 为空时不发送，后端会使用原价作为默认值
      ...(form.price != null && form.price !== '' && { price: form.price }),
      estimatedDuration: form.estimatedDuration,
      serviceItems: form.serviceItems,
      products: form.products.map(p => ({
        productId: p.productId,
        quantity: p.quantity
      })),
      tags: form.tags
    }

    if (isEdit.value) {
      await updateStorePackage(form._id, submitData)
      ElMessage.success('更新成功')
    } else {
      await createStorePackage(submitData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchPackages()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleSubmit = (row) => {
  ElMessageBox.confirm(
    '提交审核后，套餐将进入平台审核流程。',
    '确认提交审核？',
    {
      type: 'warning'
    }
  ).then(async () => {
    try {
      await submitPackageForAudit(row._id)
      ElMessage.success('套餐已提交审核')
      fetchPackages()
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '提交失败')
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该套餐吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteStorePackage(row._id)
      ElMessage.success('删除成功')
      fetchPackages()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const handleToggleEnabled = async (row) => {
  try {
    await updateStorePackage(row._id, { enabled: !row.enabled })
    ElMessage.success(row.enabled ? '已停用' : '已启用')
    fetchPackages()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleViewDetail = (row) => {
  currentPackage.value = row
  detailVisible.value = true
}

// 批量导入相关函数
const handleBatchImport = () => {
  uploadFile.value = null
  importResult.value = {
    message: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: []
  }
  batchDialogVisible.value = true
}

const resetImport = () => {
  uploadFile.value = null
  importResult.value = {
    message: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    errors: []
  }
}

async function downloadTemplate() {
  downloading.value = true
  try {
    const response = await request({
      url: '/batch/template/store-packages',
      method: 'get',
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.download = '套餐导入模板.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败')
  } finally {
    downloading.value = false
  }
}

function handleFileChange(file) {
  uploadFile.value = file.raw
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件')
}

async function startImport() {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.value)

    const res = await batchImportStorePackages(formData)

    importResult.value = {
      message: res.message || '导入完成',
      total: res.data?.total || 0,
      successCount: res.data?.success || 0,
      failedCount: res.data?.failed || 0,
      errors: res.data?.errors || []
    }

    if (importResult.value.successCount > 0) {
      fetchPackages()
    }
  } catch (error) {
    console.error('导入失败:', error)
    importResult.value = {
      message: error.message || '导入失败',
      total: 0,
      successCount: 0,
      failedCount: 0,
      errors: []
    }
  } finally {
    importing.value = false
  }
}

// 商品选择相关
const showProductSelector = () => {
  tempSelectedProducts.value = []
  productSearchKeyword.value = ''
  fetchStoreProducts()
  productSelectorVisible.value = true
}

const handleProductSelectionChange = (selection) => {
  tempSelectedProducts.value = selection
}

const confirmProductSelection = () => {
  tempSelectedProducts.value.forEach(product => {
    // 检查是否已经添加
    const exists = form.products.some(p => p.productId === product._id)
    if (!exists) {
      form.products.push({
        productId: product._id,
        quantity: 1,
        productName: product.name,
        productUnit: product.unit,
        productPrice: product.price
      })
    }
  })
  productSelectorVisible.value = false
  ElMessage.success(`已添加 ${tempSelectedProducts.value.length} 件商品`)
  // 自动更新价格为原价
  updatePriceToOriginal()
}

const removeProduct = (index) => {
  form.products.splice(index, 1)
  // 自动更新价格为原价
  updatePriceToOriginal()
}

// 自动更新价格为原价（商品总价）
const updatePriceToOriginal = () => {
  const originalPrice = calculateProductsTotal(form.products)
  form.price = originalPrice > 0 ? originalPrice : null
}

// 服务项目相关
const addServiceItem = () => {
  form.serviceItems.push({
    name: '',
    icon: '🔧',
    description: ''
  })
}

const removeServiceItem = (index) => {
  form.serviceItems.splice(index, 1)
}

// 标签相关
const handleTagsChange = () => {
  if (tagsInput.value.trim()) {
    form.tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t)
  } else {
    form.tags = []
  }
}

const removeTag = (index) => {
  form.tags.splice(index, 1)
  tagsInput.value = form.tags.join(', ')
}

const getPriceTagType = (price) => {
  if (!currentPriceRange.value || !price) return 'info'
  // 套餐价格和规范价格区间单位都是元，直接比较
  if (price < currentPriceRange.value.minPrice || price > currentPriceRange.value.maxPrice) {
    return 'warning'
  }
  return 'success'
}

const getStatusType = (status) => {
  const map = {
    'draft': 'info',
    'pending_audit': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    'draft': '草稿',
    'pending_audit': '待审核',
    'approved': '已上架',
    'rejected': '被拒绝'
  }
  return map[status] || status
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchPackages()
  fetchAvailableStandards()
})
</script>

<style scoped>
.store-packages {
  padding: 20px;
}

.service-items-container,
.products-container {
  width: 100%;
}

.service-item-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.product-selected-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
}

.tags-container {
  margin-top: 8px;
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.price-range-hint {
  margin-top: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.audit-info {
  font-size: 14px;
}

.package-detail h4 {
  margin-bottom: 10px;
  color: #303133;
}

.batch-import-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-section,
.result-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-header,
.upload-footer,
.result-actions {
  display: flex;
  gap: 12px;
}

.upload-footer,
.result-actions {
  justify-content: flex-end;
}

.result-stats {
  line-height: 1.8;
}

.error-list {
  text-align: left;
}

.error-item {
  padding: 4px 0;
  color: #f56c6c;
}

.upload-area {
  margin-top: 20px;
}
</style>
