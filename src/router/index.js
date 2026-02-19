import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layout/Index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'DataLine' }
      },
      // 平台运营菜单
      {
        path: 'fleets',
        name: 'Fleets',
        component: () => import('@/views/platform/Fleets.vue'),
        meta: { title: '车队管理', icon: 'OfficeBuilding', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'stores',
        name: 'Stores',
        component: () => import('@/views/platform/Stores.vue'),
        meta: { title: '门店管理', icon: 'Shop', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'platform-orders',
        name: 'PlatformOrders',
        component: () => import('@/views/platform/Orders.vue'),
        meta: { title: '订单监控', icon: 'Document', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/platform/Reports.vue'),
        meta: { title: '数据报表', icon: 'DataAnalysis', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/platform/Users.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/platform/Products.vue'),
        meta: { title: '商品管理', icon: 'Goods', roles: ['PLATFORM_OPERATOR'] }
      },
      // 门店管理菜单
      {
        path: 'store-orders',
        name: 'StoreOrders',
        component: () => import('@/views/store/Orders.vue'),
        meta: { title: '订单管理', icon: 'Document', roles: ['STORE_MANAGER', 'STORE_TECHNICIAN'] }
      },
      {
        path: 'store-products',
        name: 'StoreProducts',
        component: () => import('@/views/platform/Products.vue'),
        meta: { title: '商品管理', icon: 'Goods', roles: ['STORE_MANAGER', 'STORE_TECHNICIAN'] }
      },
      {
        path: 'store-technicians',
        name: 'StoreTechnicians',
        component: () => import('@/views/store/Technicians.vue'),
        meta: { title: '技师管理', icon: 'User', roles: ['STORE_MANAGER'] }
      },
      {
        path: 'store-statistics',
        name: 'StoreStatistics',
        component: () => import('@/views/store/Statistics.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis', roles: ['STORE_MANAGER'] }
      },
      {
        path: 'store-account',
        name: 'StoreAccount',
        component: () => import('@/views/fleet/Account.vue'),
        meta: { title: '账户管理', icon: 'Wallet', roles: ['STORE_MANAGER'] }
      },
      // 车队管理菜单
      {
        path: 'fleet-vehicles',
        name: 'FleetVehicles',
        component: () => import('@/views/fleet/Vehicles.vue'),
        meta: { title: '车辆管理', icon: 'Van', roles: ['FLEET_MANAGER'] }
      },
      {
        path: 'fleet-drivers',
        name: 'FleetDrivers',
        component: () => import('@/views/fleet/Drivers.vue'),
        meta: { title: '司机管理', icon: 'User', roles: ['FLEET_MANAGER'] }
      },
      {
        path: 'fleet-settings',
        name: 'FleetSettings',
        component: () => import('@/views/fleet/FleetSettings.vue'),
        meta: { title: '车队设置', icon: 'Setting', roles: ['FLEET_MANAGER'] }
      },
      {
        path: 'platform/maintenance-packages',
        name: 'PlatformMaintenancePackages',
        component: () => import('@/views/platform/MaintenancePackages.vue'),
        meta: { title: '保养套餐管理', icon: 'Box', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'order-center',
        name: 'OrderCenter',
        component: () => import('@/views/fleet/OrderCenter.vue'),
        meta: { title: '订单中心', icon: 'Document', roles: ['FLEET_MANAGER'] }
      },
      {
        path: 'fleet-orders',
        name: 'FleetOrders',
        component: () => import('@/views/fleet/Orders.vue'),
        meta: { title: '订单管理', icon: 'Document', roles: ['FLEET_MANAGER'] }
      },
      {
        path: 'fleet-account',
        name: 'FleetAccount',
        component: () => import('@/views/fleet/Account.vue'),
        meta: { title: '账户管理', icon: 'Wallet', roles: ['FLEET_MANAGER'] }
      },
      {
        path: 'fleet-maintenance-approval',
        name: 'FleetMaintenanceApproval',
        component: () => import('@/views/fleet/MaintenanceApproval.vue'),
        meta: { title: '保养申请审批', icon: 'Document', roles: ['FLEET_MANAGER'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  if (to.path !== '/login') {
    if (!token) {
      next('/login')
      return
    }

    // 检查角色权限
    if (to.meta.roles && !to.meta.roles.includes(userRole)) {
      next('/')
      return
    }
  }

  document.title = to.meta.title ? `${to.meta.title} - 万联驿站TMS` : '万联驿站TMS'
  next()
})

export default router
