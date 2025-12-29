<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orders">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOrders }}</div>
              <div class="stat-label">订单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon projects">
              <el-icon><FolderOpened /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeProjects }}</div>
              <div class="stat-label">进行中项目</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon production">
              <el-icon><SetUp /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.productionTasks }}</div>
              <div class="stat-label">生产任务</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon quality">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingInspections }}</div>
              <div class="stat-label">待检验</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" size="small" @click="router.push('/orders')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="recentOrders" style="width: 100%" v-loading="loading">
            <el-table-column prop="orderNumber" label="订单号" width="150" />
            <el-table-column prop="customer.name" label="客户" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>进行中的生产任务</span>
              <el-button type="primary" size="small" @click="router.push('/production/tasks')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="activeTasks" style="width: 100%" v-loading="loading">
            <el-table-column prop="stepName" label="任务" />
            <el-table-column prop="project.projectNumber" label="项目" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="router.push('/orders/new')">
              <el-icon><Plus /></el-icon>
              新建订单
            </el-button>
            <el-button type="success" @click="router.push('/production/schedule')">
              <el-icon><Calendar /></el-icon>
              排产计划
            </el-button>
            <el-button type="warning" @click="router.push('/production/report')">
              <el-icon><Edit /></el-icon>
              工作报工
            </el-button>
            <el-button type="info" @click="router.push('/reports/traceability')">
              <el-icon><Search /></el-icon>
              追溯查询
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore, useProductionStore } from '@/stores'
import {
  Document,
  FolderOpened,
  SetUp,
  Check,
  Plus,
  Calendar,
  Edit,
  Search,
} from '@element-plus/icons-vue'

const router = useRouter()
const ordersStore = useOrdersStore()
const productionStore = useProductionStore()

const loading = ref(false)
const recentOrders = ref([])
const activeTasks = ref([])

const stats = ref({
  totalOrders: 0,
  activeProjects: 0,
  productionTasks: 0,
  pendingInspections: 0,
})

const getStatusType = (status: string) => {
  const statusMap: Record<string, any> = {
    Pending: 'warning',
    InProgress: 'primary',
    Completed: 'success',
    Cancelled: 'danger',
  }
  return statusMap[status] || 'info'
}

const fetchDashboardData = async () => {
  loading.value = true
  try {
    // Fetch recent orders
    const ordersData = await ordersStore.fetchOrders({ page: 1, limit: 5 })
    if (ordersData) {
      recentOrders.value = ordersData.data
      stats.value.totalOrders = ordersData.total
    }

    // Fetch active projects
    const projectsData = await ordersStore.fetchProjects({ status: 'InProgress' })
    if (projectsData) {
      stats.value.activeProjects = projectsData.total
    }

    // Fetch production tasks
    const tasksData = await productionStore.fetchProductionTasks({
      status: 'InProgress',
      page: 1,
      limit: 5,
    })
    if (tasksData) {
      activeTasks.value = tasksData.data
      stats.value.productionTasks = tasksData.total
    }

    // TODO: Fetch pending inspections count
    stats.value.pendingInspections = 0
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: white;
}

.stat-icon.orders {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.projects {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.production {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.quality {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
