<template>
  <el-container class="main-layout">
    <el-aside width="250px" class="sidebar">
      <div class="logo">
        <h2>工厂ERP</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>仪表板</span>
        </el-menu-item>

        <el-sub-menu index="base-data">
          <template #title>
            <el-icon><Management /></el-icon>
            <span>基础数据</span>
          </template>
          <el-menu-item index="/customers">客户管理</el-menu-item>
          <el-menu-item index="/suppliers">供应商管理</el-menu-item>
          <el-menu-item index="/materials">物料管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="orders">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>订单与项目</span>
          </template>
          <el-menu-item index="/orders">订单管理</el-menu-item>
          <el-menu-item index="/projects">项目管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="production">
          <template #title>
            <el-icon><SetUp /></el-icon>
            <span>生产管理</span>
          </template>
          <el-menu-item index="/production/schedule">排产计划</el-menu-item>
          <el-menu-item index="/production/tasks">生产任务</el-menu-item>
          <el-menu-item index="/production/report">工作报工</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/outsource/orders">
          <el-icon><Van /></el-icon>
          <span>委外管理</span>
        </el-menu-item>

        <el-menu-item index="/quality/inspections">
          <el-icon><Check /></el-icon>
          <span>质量管理</span>
        </el-menu-item>

        <el-sub-menu index="warehouse">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>仓库管理</span>
          </template>
          <el-menu-item index="/warehouse/raw-materials">原料管理</el-menu-item>
          <el-menu-item index="/warehouse/inventory">库存查询</el-menu-item>
          <el-menu-item index="/warehouse/inbound">入库管理</el-menu-item>
          <el-menu-item index="/warehouse/outbound">出库管理</el-menu-item>
          <el-menu-item index="/warehouse/outbound-history">出库记录</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="reports">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>报表中心</span>
          </template>
          <el-menu-item index="/reports/traceability">追溯报表</el-menu-item>
          <el-menu-item index="/reports/order-status">订单状态</el-menu-item>
          <el-menu-item index="/reports/monthly-sales">月度销售</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h3>{{ pageTitle }}</h3>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ authStore.user?.username || 'User' }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores'
import {
  HomeFilled,
  Management,
  Document,
  SetUp,
  Van,
  Check,
  Box,
  DataAnalysis,
  User,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  return (route.meta.title as string) || route.name || 'Dashboard'
})

const handleCommand = (command: string) => {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    // Navigate to profile page if implemented
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4a;
  color: white;
}

.logo h2 {
  margin: 0;
  font-size: 20px;
}

.sidebar-menu {
  border-right: none;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.user-info:hover {
  color: #409eff;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
