<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside
      :width="isCollapse ? '64px' : '200px'"
      class="sidebar"
    >
      <div class="logo">
        <span v-if="!isCollapse">万联驿站2.0</span>
        <span v-else>TMS</span>
      </div>

      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        :unique-opened="true"
        router
      >
        <template
          v-for="route in menuRoutes"
          :key="route.path"
        >
          <el-menu-item
            v-if="!route.meta?.roles || route.meta.roles.includes(userRole)"
            :index="route.path"
          >
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>
              {{ route.meta?.title }}
            </template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon
            :size="20"
            class="collapse-icon"
            @click="isCollapse = !isCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>

        <div class="header-right">
          <!-- 角色标签 -->
          <el-tag
            :type="getRoleTagType(userRole)"
            class="role-tag"
          >
            {{ getRoleText(userRole) }}
          </el-tag>

          <!-- 用户信息 -->
          <el-dropdown>
            <span class="user-info">
              <el-avatar
                :size="32"
                :src="userInfo?.avatar"
              >
                {{ userInfo?.nickname?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userInfo?.nickname }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="passwordDialogVisible = true">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item
          label="原密码"
          prop="oldPassword"
        >
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item
          label="新密码"
          prop="newPassword"
        >
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（6-20位）"
            show-password
          />
        </el-form-item>
        <el-form-item
          label="确认密码"
          prop="confirmPassword"
        >
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="passwordSubmitting"
          @click="handleChangePassword"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const userRole = ref(localStorage.getItem('role') || '')

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordSubmitting = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码验证规则
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 修改密码
const handleChangePassword = async () => {
  try {
    await passwordFormRef.value.validate()

    passwordSubmitting.value = true

    const res = await request({
      url: '/user/change-password',
      method: 'post',
      data: {
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword
      }
    })

    if (res.success) {
      ElMessage.success('密码修改成功，请重新登录')
      passwordDialogVisible.value = false

      // 清空表单
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }

      // 延迟1秒后退出登录
      setTimeout(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('role')
        router.push('/login')
      }, 1000)
    } else {
      ElMessage.error(res.message || '密码修改失败')
    }
  } catch (error) {
    console.error('密码修改失败:', error)
    if (error !== 'cancel') { // 排除表单验证取消的情况
      ElMessage.error(error.response?.data?.message || error.message || '密码修改失败')
    }
  } finally {
    passwordSubmitting.value = false
  }
}

// 根据角色过滤菜单
const menuRoutes = computed(() => {
  const routes = router.options.routes.find(r => r.path === '/')?.children || []
  return routes.filter(r => {
    // 过滤掉隐藏的菜单
    if (r.meta?.hideInMenu) return false
    // 过滤角色权限
    if (!r.meta?.roles) return true
    return r.meta.roles.includes(userRole.value)
  })
})

// 获取角色文本
const getRoleText = (role) => {
  const roleMap = {
    'DRIVER': '司机',
    'FLEET_MANAGER': '车队管理员',
    'STORE_MANAGER': '门店管理员',
    'STORE_TECHNICIAN': '门店技师',
    'PLATFORM_OPERATOR': '平台运营'
  }
  return roleMap[role] || '未知角色'
}

// 获取角色标签类型
const getRoleTagType = (role) => {
  const typeMap = {
    'DRIVER': '',
    'FLEET_MANAGER': 'success',
    'STORE_MANAGER': 'success',
    'STORE_TECHNICIAN': 'warning',
    'PLATFORM_OPERATOR': 'danger'
  }
  return typeMap[role] || ''
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('role')
    router.push('/login')
  })
}
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  height: 100vh;
}

.sidebar {
  background: #304156;
  transition: width 0.3s;
  overflow-x: hidden;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    background: #2b3a4b;
  }

  .el-menu {
    border-right: none;
    background: #304156;

    .el-menu-item {
      color: #bfcbd9;

      &:hover {
        background: #263445;
        color: #fff;
      }

      &.is-active {
        background: #409eff !important;
        color: #fff !important;
      }
    }
  }
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;

    .collapse-icon {
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: #409eff;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .role-tag {
      font-weight: 500;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;

      .username {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

.main {
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
