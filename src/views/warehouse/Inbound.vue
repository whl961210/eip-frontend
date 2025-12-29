<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>入库管理 (Inbound Management)</span>
          <el-button type="primary" @click="loadPendingOrderItems">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div class="stats-container">
        <el-statistic title="待入库订单项" :value="pendingOrderItems.length" suffix="项" />
        <el-statistic
          title="待出库订单项"
          :value="pendingOrderItems.filter(item => (item.inboundQuantity || 0) > 0).length"
          suffix="项"
        />
      </div>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="订单筛选">
          <el-input
            v-model="filters.orderNumber"
            placeholder="订单号"
            clearable
            style="width: 200px"
            @input="applyFilters"
          />
        </el-form-item>
        <el-form-item label="客户筛选">
          <el-input
            v-model="filters.customerName"
            placeholder="客户名称"
            clearable
            style="width: 200px"
            @input="applyFilters"
          />
        </el-form-item>
        <el-form-item label="产品筛选">
          <el-input
            v-model="filters.partName"
            placeholder="产品名称"
            clearable
            style="width: 200px"
            @input="applyFilters"
          />
        </el-form-item>
      </el-form>

      <el-table
        :data="filteredOrderItems"
        border
        style="width: 100%; margin-top: 20px"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="订单号" width="150" fixed="left">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.order?.orderNumber || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="客户名称" width="180">
          <template #default="{ row }">
            {{ row.order?.customerName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="partName" label="产品名称" width="200" />
        <el-table-column prop="partSpec" label="产品规格" width="150" />
        <el-table-column label="订单数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.quantity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已入库" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.inboundQuantity || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="待入库" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.quantity - (row.inboundQuantity || 0) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已出库" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.outboundQuantity || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="待出库" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="(row.inboundQuantity || 0) - (row.outboundQuantity || 0) > 0 ? 'warning' : 'info'"
            >
              {{ Math.max(0, (row.inboundQuantity || 0) - (row.outboundQuantity || 0)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="交货日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'date-urgent': isDateUrgent(row.order?.deliveryDate) }">
              {{ formatDate(row.order?.deliveryDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)">
              {{ getStatusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="action-bar" v-if="selectedItems.length > 0">
        <div class="selected-info">
          <span>已选择 <strong>{{ selectedItems.length }}</strong> 项</span>
        </div>
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="handleMoveToOutbound">
            <el-icon><Right /></el-icon>
            移至出库 ({{ selectedItems.length }})
          </el-button>
        </div>
      </div>

      <div class="pagination-container">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredOrderItems.length"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="(page: number) => currentPage = page"
          @size-change="(size: number) => pageSize = size"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Right } from '@element-plus/icons-vue'
import { ordersApi } from '@/api/orders'

interface Filters {
  orderNumber?: string
  customerName?: string
  partName?: string
}

const router = useRouter()
const loading = ref(false)
const pendingOrderItems = ref<any[]>([])
const selectedItems = ref<any[]>([])
const filters = reactive<Filters>({})
const currentPage = ref(1)
const pageSize = ref(20)

const filteredOrderItems = computed(() => {
  let items = pendingOrderItems.value

  if (filters.orderNumber) {
    const query = filters.orderNumber.toLowerCase()
    items = items.filter(item =>
      item.order?.orderNumber?.toLowerCase().includes(query)
    )
  }

  if (filters.customerName) {
    const query = filters.customerName.toLowerCase()
    items = items.filter(item =>
      item.order?.customerName?.toLowerCase().includes(query)
    )
  }

  if (filters.partName) {
    const query = filters.partName.toLowerCase()
    items = items.filter(item =>
      item.partName?.toLowerCase().includes(query)
    )
  }

  return items
})

onMounted(async () => {
  await loadPendingOrderItems()
})

const loadPendingOrderItems = async () => {
  try {
    loading.value = true
    const response = await ordersApi.getOrders({ page: 1, limit: 1000 })
    const allOrders = response.data || []

    pendingOrderItems.value = []
    for (const order of allOrders) {
      if (order.orderItems && Array.isArray(order.orderItems)) {
        for (const item of order.orderItems) {
          const remaining = item.quantity - (item.inboundQuantity || 0)
          if (remaining > 0 || (item.inboundQuantity || 0) > (item.outboundQuantity || 0)) {
            pendingOrderItems.value.push({
              ...item,
              order: order
            })
          }
        }
      }
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载订单项目失败')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
}

const handleSelectionChange = (selection: any[]) => {
  selectedItems.value = selection
}

const handleMoveToOutbound = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要移至出库的项目')
    return
  }

  // Check if selected items have inbound quantity
  const notInboundItems = selectedItems.value.filter(
    item => (item.inboundQuantity || 0) === 0
  )

  if (notInboundItems.length > 0) {
    ElMessage.warning('请选择已入库的项目才能移至出库')
    return
  }

  try {
    await ElMessageBox.confirm(
      `您选择了 ${selectedItems.value.length} 个项目。这些项目将在出库管理页面显示，是否现在前往出库管理页面？`,
      '提示',
      {
        confirmButtonText: '前往出库',
        cancelButtonText: '稍后处理',
        type: 'info',
      }
    )

    router.push('/warehouse/outbound')
  } catch (error: any) {
    if (error === 'cancel') {
      ElMessage.info('您可以稍后在出库管理页面处理这些项目')
    }
  }
}

const getStatusType = (row: any): string => {
  const inbound = row.inboundQuantity || 0
  const outbound = row.outboundQuantity || 0
  const total = row.quantity

  if (inbound === 0) return 'warning'
  if (inbound >= total && outbound >= total) return 'success'
  if (outbound > 0) return 'primary'
  return 'info'
}

const getStatusLabel = (row: any): string => {
  const inbound = row.inboundQuantity || 0
  const outbound = row.outboundQuantity || 0
  const total = row.quantity

  if (inbound === 0) return '待入库'
  if (inbound >= total && outbound >= total) return '已完成'
  if (outbound > 0) return '出库中'
  if (inbound >= total) return '待出库'
  return '入库中'
}

const isDateUrgent = (dateString: string): boolean => {
  if (!dateString) return false
  const deliveryDate = new Date(dateString)
  const today = new Date()
  const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilDelivery <= 7 && daysUntilDelivery >= 0
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-container {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.filter-form {
  margin-bottom: 20px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background: #ecf5ff;
  border-radius: 4px;
  border: 1px solid #d9ecff;
}

.selected-info {
  font-size: 14px;
  color: #606266;
}

.selected-info strong {
  color: #409eff;
  font-size: 18px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.date-urgent {
  color: #f56c6c;
  font-weight: bold;
}
</style>
