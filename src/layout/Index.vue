<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">万联驿站TMS</span>
        <span v-else>TMS</span>
      </div>

      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        :unique-opened="true"
        router
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item
            v-if="!route.meta?.roles || route.meta.roles.includes(userRole)"
            :index="route.path"
          >
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>{{ route.meta?.title }}</template>
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
          <el-tag :type="getRoleTagType(userRole)" class="role-tag">
            {{ getRoleText(userRole) }}
          </el-tag>

          <!-- 用户信息 -->
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" :src="userInfo?.avatar">
                {{ userInfo?.nickname?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userInfo?.nickname }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
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
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const userRole = ref(localStorage.getItem('role') || '')

// 根据角色过滤菜单
const menuRoutes = computed(() => {
  const routes = router.options.routes.find(r => r.path === '/')?.children || []
  return routes.filter(r => {
    if (!r.meta?.roles) return true
    return r.meta.roles.includes(userRole.value)
  })
})

// 获取角色文本
const getRoleText = (role) => {
  const roleMap = {
    'DRIVER': '司机',
    'FLEET_MANAGER': '车队管理员',
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
