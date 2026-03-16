<template>
  <div class="fleet-maintenance-packages">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header
        content="保养套餐查看"
        @back="goBack"
      />
      <el-alert
        title="温馨提示"
        type="info"
        :closable="false"
        style="margin-top: 20px"
      >
        此页面展示所有可用的保养套餐。如需新增或修改套餐，请联系平台运营人员。
      </el-alert>
    </div>

    <!-- 筛选条件 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select
            v-model="filters.vehicleGroup"
            placeholder="车型分组"
            clearable
            style="width: 100%"
            @change="fetchPackages"
          >
            <el-option
              v-for="option in packageVehicleGroupOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="filters.tier"
            placeholder="套餐档位"
            clearable
            style="width: 100%"
            @change="fetchPackages"
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
        <el-col :span="6">
          <el-select
            v-model="filters.enabled"
            placeholder="状态"
            clearable
            style="width: 100%"
            @change="fetchPackages"
          >
            <el-option
              label="已启用"
              :value="true"
            />
            <el-option
              label="已停用"
              :value="false"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索套餐名称或编码"
            clearable
            @clear="fetchPackages"
            @keyup.enter="fetchPackages"
          >
            <template #append>
              <el-button
                :icon="Search"
                @click="fetchPackages"
              />
            </template>
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <!-- 套餐列表（卡片视图） -->
    <div
      v-loading="loading"
      class="packages-grid"
    >
      <el-empty
        v-if="!loading && packages.length === 0"
        description="暂无保养套餐"
        :image-size="150"
      />

      <el-row
        v-else
        :gutter="20"
      >
        <el-col
          v-for="pkg in packages"
          :key="pkg._id"
          :span="8"
          style="margin-bottom: 20px"
        >
          <el-card
            :body-style="{ padding: '0px' }"
            class="package-card"
          >
            <!-- 套餐头部 -->
            <div class="package-header">
              <div class="package-title">
                <h3>{{ pkg.name }}</h3>
                <div class="package-badges">
                  <el-tag
                    v-if="pkg.isFeatured"
                    type="danger"
                    size="small"
                    effect="dark"
                  >
                    热门
                  </el-tag>
                  <el-tag
                    v-if="!pkg.enabled"
                    type="info"
                    size="small"
                  >
                    已停用
                  </el-tag>
                </div>
              </div>
              <div class="package-price">
                <span class="current-price">¥{{ pkg.price }}</span>
                <span
                  v-if="pkg.originalPrice && pkg.originalPrice > pkg.price"
                  class="original-price"
                >
                  ¥{{ pkg.originalPrice }}
                </span>
                <!-- 区域价格标识 -->
                <el-tag
                  v-if="pkg.isRegional"
                  type="warning"
                  size="small"
                  effect="dark"
                  style="margin-left: 8px"
                >
                  {{ pkg.region }}
                </el-tag>
              </div>
            </div>

            <!-- 套餐信息 -->
            <div class="package-info">
              <el-descriptions
                :column="2"
                size="small"
                border
              >
                <el-descriptions-item label="套餐编码">
                  {{ pkg.code }}
                </el-descriptions-item>
                <el-descriptions-item label="套餐档位">
                  <el-tag
                    :type="getTierType(pkg.tier)"
                    size="small"
                  >
                    {{ pkg.tier }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="车型分组">
                  <el-tag
                    :type="getVehicleGroupType(pkg.vehicleGroup)"
                    size="small"
                  >
                    {{ getVehicleGroupLabel(pkg.vehicleGroup) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="预估时长">
                  {{ pkg.estimatedDuration }} 小时
                </el-descriptions-item>
                <el-descriptions-item
                  label="里程范围"
                  :span="2"
                >
                  {{ pkg.mileageRange?.min || 0 }}-{{ pkg.mileageRange?.max || 999999 }} km
                </el-descriptions-item>
              </el-descriptions>

              <!-- 服务项目列表 -->
              <div
                v-if="pkg.serviceItems && pkg.serviceItems.length > 0"
                class="service-items"
              >
                <div class="service-items-title">
                  服务项目：
                </div>
                <div class="service-items-list">
                  <div
                    v-for="(item, index) in pkg.serviceItems"
                    :key="index"
                    class="service-item"
                  >
                    <span
                      v-if="item.icon"
                      class="service-icon"
                    >{{ item.icon }}</span>
                    <span class="service-name">{{ item.name }}</span>
                    <span
                      v-if="item.description"
                      class="service-desc"
                    >{{ item.description }}</span>
                  </div>
                </div>
              </div>

              <!-- 商品数量 -->
              <div class="products-count">
                <el-text
                  type="info"
                  size="small"
                >
                  包含 {{ pkg.products?.length || 0 }} 种商品
                </el-text>
              </div>

              <!-- 套餐描述 -->
              <div
                v-if="pkg.description"
                class="package-description"
              >
                <el-text
                  type="info"
                  size="small"
                >
                  {{ pkg.description }}
                </el-text>
              </div>
            </div>

            <!-- 套餐底部 -->
            <div class="package-footer">
              <el-button
                type="primary"
                link
                @click="handleViewDetail(pkg)"
              >
                查看详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="total > 0"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.limit"
      :total="total"
      :page-sizes="[9, 18, 36, 72]"
      layout="total, sizes, prev, pager, next"
      style="margin-top: 20px; text-align: right"
      @size-change="fetchPackages"
      @current-change="fetchPackages"
    />

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="套餐详情"
      width="800px"
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
          <el-descriptions-item label="套餐档位">
            <el-tag :type="getTierType(currentPackage.tier)">
              {{ currentPackage.tier }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="车型分组">
            <el-tag :type="getVehicleGroupType(currentPackage.vehicleGroup)">
              {{ getVehicleGroupLabel(currentPackage.vehicleGroup) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="套餐价格">
            <span style="color: #f56c6c; font-size: 18px; font-weight: bold;">
              ¥{{ currentPackage.price }}
            </span>
            <span
              v-if="currentPackage.originalPrice && currentPackage.originalPrice > currentPackage.price"
              style="margin-left: 12px; color: #909399; text-decoration: line-through;"
            >
              ¥{{ currentPackage.originalPrice }}
            </span>
            <!-- 区域价格标识 -->
            <el-tag
              v-if="currentPackage.isRegional"
              type="warning"
              style="margin-left: 8px"
            >
              {{ currentPackage.region }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预估时长">
            {{ currentPackage.estimatedDuration }} 小时
          </el-descriptions-item>
          <el-descriptions-item
            label="里程范围"
            :span="2"
          >
            {{ currentPackage.mileageRange?.min || 0 }}-{{ currentPackage.mileageRange?.max || 999999 }} km
          </el-descriptions-item>
          <el-descriptions-item
            label="套餐描述"
            :span="2"
          >
            {{ currentPackage.description || '-' }}
          </el-descriptions-item>
          <el-descriptions-item
            label="状态"
            :span="2"
          >
            <el-tag
              v-if="currentPackage.enabled"
              type="success"
            >
              已启用
            </el-tag>
            <el-tag
              v-else
              type="info"
            >
              已停用
            </el-tag>
            <el-tag
              v-if="currentPackage.isFeatured"
              type="danger"
              style="margin-left: 8px"
            >
              热门
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 服务项目 -->
        <div
          v-if="currentPackage.serviceItems && currentPackage.serviceItems.length > 0"
          style="margin-top: 20px"
        >
          <h4>服务项目</h4>
          <el-table
            :data="currentPackage.serviceItems"
            size="small"
          >
            <el-table-column
              prop="icon"
              label="图标"
              width="60"
            />
            <el-table-column
              prop="name"
              label="服务名称"
            />
            <el-table-column
              prop="description"
              label="描述"
            />
          </el-table>
        </div>

        <!-- 商品清单 -->
        <div
          v-if="currentPackage.products && currentPackage.products.length > 0"
          style="margin-top: 20px"
        >
          <h4>商品清单</h4>
          <el-table
            :data="currentPackage.products"
            size="small"
          >
            <el-table-column
              prop="productName"
              label="商品名称"
            />
            <el-table-column
              prop="price"
              label="单价"
              width="100"
            >
              <template #default="{ row }">
                ¥{{ row.price }}
              </template>
            </el-table-column>
            <el-table-column
              prop="quantity"
              label="数量"
              width="80"
            />
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button
          type="primary"
          @click="detailDialogVisible = false"
        >
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getPackages } from '@/api/maintenance'
import {
  PACKAGE_VEHICLE_GROUP_OPTIONS,
  getVehicleGroupLabel as formatVehicleGroupLabel,
  getVehicleGroupTagType
} from '@/utils/vehicleGroups'

const router = useRouter()
const packageVehicleGroupOptions = PACKAGE_VEHICLE_GROUP_OPTIONS
const loading = ref(false)
const packages = ref([])
const total = ref(0)
const detailDialogVisible = ref(false)
const currentPackage = ref(null)

const pagination = ref({
  page: 1,
  limit: 9
})

const filters = ref({
  vehicleGroup: '',
  tier: '',
  enabled: true,
  keyword: ''
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取套餐列表
const fetchPackages = async () => {
  loading.value = true
  try {
    // 获取车队信息以获取省市
    const user = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const fleetInfo = user.fleetInfo || {}

    const res = await getPackages({
      page: pagination.value.page,
      limit: pagination.value.limit,
      vehicleGroup: filters.value.vehicleGroup || undefined,
      tier: filters.value.tier || undefined,
      enabled: filters.value.enabled,
      keyword: filters.value.keyword || undefined,
      // 传递车队所在省市，获取区域价格
      province: fleetInfo.province || undefined,
      city: fleetInfo.city || undefined
    })
    packages.value = res.data.packages || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取套餐列表失败:', error)
    ElMessage.error('获取套餐列表失败')
  } finally {
    loading.value = false
  }
}

// 查看详情
const handleViewDetail = async (pkg) => {
  try {
    // 获取套餐详情（包含商品信息）
    const { getPackages } = await import('@/api/maintenance')
    const res = await getPackages({ id: pkg._id })
    currentPackage.value = res.data.package || pkg
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取套餐详情失败:', error)
    currentPackage.value = pkg
    detailDialogVisible.value = true
  }
}

// 获取车型分组类型
const getVehicleGroupType = (type) => {
  return getVehicleGroupTagType(type)
}

// 获取车型分组标签
const getVehicleGroupLabel = (type) => {
  return formatVehicleGroupLabel(type)
}

// 获取档位类型
const getTierType = (tier) => {
  const typeMap = {
    '实惠': 'info',
    '标准': 'primary',
    '优质': 'success',
    '尊享': 'warning'
  }
  return typeMap[tier] || 'info'
}

onMounted(() => {
  fetchPackages()
})
</script>

<style scoped lang="scss">
.fleet-maintenance-packages {
  .page-header {
    margin-bottom: 20px;
  }

  .packages-grid {
    min-height: 400px;

    .package-card {
      transition: all 0.3s;
      height: 100%;
      display: flex;
      flex-direction: column;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }

      .package-header {
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        .package-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          }

          .package-badges {
            display: flex;
            gap: 6px;
          }
        }

        .package-price {
          .current-price {
            font-size: 28px;
            font-weight: bold;
          }

          .original-price {
            font-size: 16px;
            margin-left: 8px;
            text-decoration: line-through;
            opacity: 0.8;
          }
        }
      }

      .package-info {
        padding: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;

        .service-items {
          margin-top: 16px;

          .service-items-title {
            font-weight: 500;
            margin-bottom: 8px;
            color: #303133;
          }

          .service-items-list {
            background: #f5f7fa;
            padding: 12px;
            border-radius: 4px;

            .service-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 6px 0;

              &:not(:last-child) {
                border-bottom: 1px solid #e4e7ed;
              }

              .service-icon {
                font-size: 16px;
              }

              .service-name {
                font-weight: 500;
                color: #303133;
              }

              .service-desc {
                font-size: 12px;
                color: #909399;
                margin-left: auto;
              }
            }
          }
        }

        .products-count {
          margin-top: 12px;
          text-align: center;
        }

        .package-description {
          margin-top: 12px;
          padding: 8px;
          background: #f5f7fa;
          border-radius: 4px;
          line-height: 1.6;
        }
      }

      .package-footer {
        padding: 12px 16px;
        border-top: 1px solid #e4e7ed;
        text-align: center;
      }
    }
  }

  .package-detail {
    h4 {
      margin: 20px 0 12px;
      color: #303133;
      font-weight: 600;
    }
  }
}
</style>
