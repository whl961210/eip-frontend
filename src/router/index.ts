import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
      },
      // Base Data Routes
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/views/base-data/CustomerList.vue'),
      },
      {
        path: 'suppliers',
        name: 'Suppliers',
        component: () => import('@/views/base-data/SupplierList.vue'),
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/base-data/MaterialList.vue'),
      },
      // Orders Routes
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
      },
      {
        path: 'orders/new',
        name: 'NewOrder',
        component: () => import('@/views/orders/OrderForm.vue'),
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
      },
      // Projects Routes
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/projects/ProjectList.vue'),
      },
      {
        path: 'projects/:id',
        name: 'ProjectDetail',
        component: () => import('@/views/projects/ProjectDetail.vue'),
      },
      // Production Routes
      {
        path: 'production/schedule',
        name: 'ProductionSchedule',
        component: () => import('@/views/production/ProductionSchedule.vue'),
      },
      {
        path: 'production/tasks',
        name: 'ProductionTasks',
        component: () => import('@/views/production/ProductionTasks.vue'),
      },
      {
        path: 'production/report',
        name: 'WorkReport',
        component: () => import('@/views/production/WorkReport.vue'),
      },
      // Outsource Routes
      {
        path: 'outsource/orders',
        name: 'OutsourceOrders',
        component: () => import('@/views/outsource/OutsourceList.vue'),
      },
      // Quality Routes
      {
        path: 'quality/inspections',
        name: 'QualityInspections',
        component: () => import('@/views/quality/InspectionList.vue'),
      },
      // Warehouse Routes
      {
        path: 'warehouse/raw-materials',
        name: 'RawMaterials',
        component: () => import('@/views/warehouse/RawMaterials.vue'),
      },
      {
        path: 'warehouse/inventory',
        name: 'Inventory',
        component: () => import('@/views/warehouse/InventoryList.vue'),
      },
      {
        path: 'warehouse/inbound',
        name: 'Inbound',
        component: () => import('@/views/warehouse/Inbound.vue'),
      },
      {
        path: 'warehouse/outbound',
        name: 'Outbound',
        component: () => import('@/views/warehouse/Outbound.vue'),
      },
      {
        path: 'warehouse/outbound-history',
        name: 'OutboundHistory',
        component: () => import('@/views/warehouse/OutboundHistory.vue'),
      },
      // Reports Routes
      {
        path: 'reports/traceability',
        name: 'Traceability',
        component: () => import('@/views/reports/Traceability.vue'),
      },
      {
        path: 'reports/order-status',
        name: 'OrderStatus',
        component: () => import('@/views/reports/OrderStatus.vue'),
      },
      {
        path: 'reports/monthly-sales',
        name: 'MonthlySales',
        component: () => import('@/views/reports/MonthlySales.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
