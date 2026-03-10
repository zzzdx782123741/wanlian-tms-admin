import { createRouter, createWebHistory } from 'vue-router'
import LayoutIndex from '@/layout/Index.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: LayoutIndex,
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
        path: 'fleet-register',
        name: 'FleetRegister',
        component: () => import('@/views/platform/FleetRegister.vue'),
        meta: { title: '车队注册', icon: 'OfficeBuilding', roles: ['PLATFORM_OPERATOR'], hideInMenu: true }
      },
      {
        path: 'stores',
        name: 'Stores',
        component: () => import('@/views/platform/Stores.vue'),
        meta: { title: '门店管理', icon: 'Shop', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'store-register',
        name: 'StoreRegister',
        component: () => import('@/views/platform/StoreRegister.vue'),
        meta: { title: '门店注册', icon: 'Shop', roles: ['PLATFORM_OPERATOR'], hideInMenu: true }
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
        path: 'recharge-audit',
        name: 'RechargeAudit',
        component: () => import('@/views/platform/RechargeAudit.vue'),
        meta: { title: '充值审核', icon: 'Select', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'agent-recharge',
        name: 'AgentRecharge',
        component: () => import('@/views/platform/AgentRecharge.vue'),
        meta: { title: '代客充值', icon: 'Money', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'settlement-management',
        name: 'SettlementManagement',
        component: () => import('@/views/platform/SettlementManagement.vue'),
        meta: { title: '结算管理', icon: 'Money', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'commission-config',
        name: 'CommissionConfig',
        component: () => import('@/views/platform/CommissionConfig.vue'),
        meta: { title: '佣金配置', icon: 'Setting', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'commission-bills',
        name: 'CommissionBills',
        component: () => import('@/views/platform/CommissionBills.vue'),
        meta: { title: '佣金账单', icon: 'Ticket', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'commission-statistics',
        name: 'CommissionStatistics',
        component: () => import('@/views/platform/CommissionStatistics.vue'),
        meta: { title: '佣金统计', icon: 'DataAnalysis', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'finance-reports',
        name: 'FinanceReports',
        component: () => import('@/views/platform/FinanceReports.vue'),
        meta: { title: '财务报表', icon: 'DataAnalysis', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/platform/Products.vue'),
        meta: { title: '商品管理', icon: 'Goods', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'bank-accounts',
        name: 'BankAccounts',
        component: () => import('@/views/platform/BankAccounts.vue'),
        meta: { title: '收款账户管理', icon: 'Wallet', roles: ['PLATFORM_OPERATOR'] }
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
        path: 'store-settings',
        name: 'StoreSettings',
        component: () => import('@/views/store/Settings.vue'),
        meta: { title: '门店设置', icon: 'Setting', roles: ['STORE_MANAGER'] }
      },
      {
        path: 'store-account',
        name: 'StoreAccount',
        component: () => import('@/views/store/Account.vue'),
        meta: { title: '账户管理', icon: 'Wallet', roles: ['STORE_MANAGER'] }
      },
      {
        path: 'store-withdrawal',
        name: 'StoreWithdrawal',
        component: () => import('@/views/store/Withdrawal.vue'),
        meta: { title: '提现管理', icon: 'Wallet', roles: ['STORE_MANAGER'] }
      },
      {
        path: 'store-packages',
        name: 'StorePackages',
        component: () => import('@/views/store/StorePackages.vue'),
        meta: { title: '套餐管理', icon: 'Box', roles: ['STORE_MANAGER'] }
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
        path: 'maintenance-packages',
        name: 'PlatformMaintenancePackages',
        component: () => import('@/views/platform/MaintenancePackages.vue'),
        meta: { title: '保养套餐管理', icon: 'Box', roles: ['PLATFORM_OPERATOR'], hideInMenu: true }
      },
      {
        path: 'package-standards',
        name: 'PackageStandards',
        component: () => import('@/views/platform/PackageStandards.vue'),
        meta: { title: '套餐类型规范配置', icon: 'DataBoard', roles: ['PLATFORM_OPERATOR'] }
      },
      {
        path: 'store-package-audit',
        name: 'StorePackageAudit',
        component: () => import('@/views/platform/StorePackageAudit.vue'),
        meta: { title: '门店套餐审核', icon: 'Select', roles: ['PLATFORM_OPERATOR'] }
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
        path: 'fleet-recharge',
        name: 'FleetRecharge',
        component: () => import('@/views/fleet/Recharge.vue'),
        meta: { title: '充值申请', icon: 'Money', roles: ['FLEET_MANAGER'] }
      },
      {
        path: 'fleet-maintenance-packages',
        name: 'FleetMaintenancePackages',
        component: () => import('@/views/fleet/MaintenancePackages.vue'),
        meta: { title: '保养套餐查看', icon: 'Box', roles: ['FLEET_MANAGER'], hideInMenu: true }
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

  // 打印调试信息
  console.log('路由守卫:', {
    to: to.path,
    userRole,
    requiredRoles: to.meta?.roles,
    hasToken: !!token
  })

  if (to.path !== '/login') {
    if (!token) {
      next('/login')
      return
    }

    // 检查角色权限
    if (to.meta.roles && to.meta.roles.length > 0) {
      if (!userRole) {
        console.error('用户角色为空，重定向到登录页')
        next('/login')
        return
      }

      if (!to.meta.roles.includes(userRole)) {
        console.warn('角色权限不匹配:', { userRole, required: to.meta.roles })
        // 重定向到首页而不是next('/')，避免循环
        next('/dashboard')
        return
      }
    }
  }

  document.title = to.meta.title ? `${to.meta.title} - 万联驿站2.0` : '万联驿站2.0'
  next()
})

export default router
