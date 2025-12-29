<template>
  <div class="page-container">
    <!-- Inventory Search Card -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>库存查询 (Inventory Search)</span>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="查询类型">
          <el-radio-group v-model="searchType" @change="handleSearchTypeChange">
            <el-radio-button label="rawMaterial">原料</el-radio-button>
            <el-radio-button label="finishedGood">成品</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- Raw Material Filters -->
        <template v-if="searchType === 'rawMaterial'">
          <el-form-item label="物料筛选">
            <el-select
              v-model="filters.materialId"
              placeholder="全部物料"
              clearable
              filterable
              style="width: 250px"
              @change="handleSearch"
            >
              <el-option
                v-for="material in rawMaterials"
                :key="material.id"
                :label="`${material.name} (${material.code})`"
                :value="material.id"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- Finished Good Filters -->
        <template v-else>
          <el-form-item label="订单号">
            <el-input
              v-model="filters.orderNumber"
              placeholder="订单号"
              clearable
              style="width: 200px"
              @input="handleSearch"
            />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input
              v-model="filters.customerName"
              placeholder="客户名称"
              clearable
              style="width: 200px"
              @input="handleSearch"
            />
          </el-form-item>
          <el-form-item label="产品名称">
            <el-input
              v-model="filters.partName"
              placeholder="产品名称"
              clearable
              style="width: 200px"
              @input="handleSearch"
            />
          </el-form-item>
        </template>
      </el-form>

      <!-- Raw Material Table -->
      <el-table
        v-if="searchType === 'rawMaterial'"
        :data="inventoryData"
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="material.code" label="物料编码" width="150" />
        <el-table-column prop="material.name" label="物料名称" width="200" />
        <el-table-column prop="material.specification" label="规格型号" width="150" />
        <el-table-column label="批次号" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.batchNumber" type="info">{{ row.batchNumber }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" width="120">
          <template #default="{ row }">
            <el-tag :type="getStockTagType(row.quantity)">
              {{ row.quantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="material.unit" label="单位" width="80" />
        <el-table-column prop="location" label="存放位置" width="150" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewTransactionHistory(row.material.id)"
            >
              查看流水
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Finished Good Table -->
      <el-table
        v-else
        :data="inventoryData"
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="订单号" width="150">
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
        <el-table-column label="已出库" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.outboundQuantity || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStockTagType((row.inboundQuantity || 0) - (row.outboundQuantity || 0))">
              {{ (row.inboundQuantity || 0) - (row.outboundQuantity || 0) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="交货日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.order?.deliveryDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getFinishedGoodStatusType(row)">
              {{ getFinishedGoodStatusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="(page: number) => currentPage = page"
          @size-change="(size: number) => pageSize = size"
        />
      </div>
    </el-card>

    <!-- Transaction History Dialog -->
    <el-dialog
      v-model="historyDialogVisible"
      :title="`${selectedMaterialName} - 库存流水`"
      width="1200px"
      @close="handleHistoryDialogClose"
    >
      <el-form :inline="true" :model="historyFilters" class="filter-form">
        <el-form-item label="交易类型">
          <el-select
            v-model="historyFilters.type"
            placeholder="全部类型"
            clearable
            style="width: 200px"
            @change="loadTransactionHistory"
          >
            <el-option label="采购入库" value="PurchaseIn" />
            <el-option label="生产完工入库" value="ProductionIn" />
            <el-option label="委外回货入库" value="OutsourceIn" />
            <el-option label="客退入库" value="ReturnIn" />
            <el-option label="调整入库" value="AdjustmentIn" />
            <el-option label="生产领料" value="ProductionOut" />
            <el-option label="委外发料" value="OutsourceOut" />
            <el-option label="销售出库" value="SalesOut" />
            <el-option label="调整出库" value="AdjustmentOut" />
            <el-option label="报废" value="Scrap" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table
        :data="transactionData"
        border
        style="width: 100%"
        v-loading="transactionLoading"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="交易类型" width="130">
          <template #default="{ row }">
            <el-tag :type="getTransactionTagType(row.type)">
              {{ getTransactionTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量变化" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.quantity > 0 ? 'green' : 'red' }">
              {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.batchNumber" type="info" size="small">
              {{ row.batchNumber }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="referenceNumber" label="单据号" width="150">
          <template #default="{ row }">
            {{ row.referenceNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="关联项目" width="150">
          <template #default="{ row }">
            {{ row.project?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作员" width="100">
          <template #default="{ row }">
            {{ row.operator || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="150">
          <template #default="{ row }">
            {{ row.notes || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :current-page="transactionPage"
          :page-size="transactionLimit"
          :page-sizes="[10, 20, 50, 100]"
          :total="transactionTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="(page) => transactionPage = page"
          @size-change="(size) => transactionLimit = size"
        />
      </div>

      <template #footer>
        <el-button @click="historyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { warehouseApi } from '@/api/warehouse'
import { materialApi } from '@/api/material'
import { ordersApi } from '@/api/orders'

interface InventoryFilters {
  materialId?: number
  orderNumber?: string
  customerName?: string
  partName?: string
}

interface HistoryFilters {
  type?: string
}

const searchType = ref<'rawMaterial' | 'finishedGood'>('rawMaterial')
const filters = reactive<InventoryFilters>({})
const historyFilters = reactive<HistoryFilters>({})

const allData = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

const transactionData = ref<any[]>([])
const transactionLoading = ref(false)
const transactionPage = ref(1)
const transactionLimit = ref(10)
const transactionTotal = ref(0)

const rawMaterials = ref<any[]>([])
const historyDialogVisible = ref(false)
const selectedMaterialId = ref<number | null>(null)
const selectedMaterialName = ref('')

// Computed filtered data based on search type and filters
const filteredData = computed(() => {
  let items = allData.value

  if (searchType.value === 'rawMaterial') {
    if (filters.materialId) {
      items = items.filter((item) => item.materialId === filters.materialId)
    }
  } else {
    // Finished goods filters
    if (filters.orderNumber) {
      const query = filters.orderNumber.toLowerCase()
      items = items.filter((item) =>
        item.order?.orderNumber?.toLowerCase().includes(query)
      )
    }

    if (filters.customerName) {
      const query = filters.customerName.toLowerCase()
      items = items.filter((item) =>
        item.order?.customerName?.toLowerCase().includes(query)
      )
    }

    if (filters.partName) {
      const query = filters.partName.toLowerCase()
      items = items.filter((item) =>
        item.partName?.toLowerCase().includes(query)
      )
    }
  }

  return items
})

// Computed paginated data
const inventoryData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

onMounted(async () => {
  await loadRawMaterials()
  await handleSearch()
})

const loadRawMaterials = async () => {
  try {
    const response = await materialApi.getList({ page: 1, limit: 1000 })
    rawMaterials.value = response.data.filter((m: any) => m.type === 'RawMaterial')
  } catch (error) {
    ElMessage.error('加载物料列表失败')
  }
}

const handleSearchTypeChange = () => {
  // Clear filters when switching search type
  filters.materialId = undefined
  filters.orderNumber = undefined
  filters.customerName = undefined
  filters.partName = undefined
  currentPage.value = 1
  handleSearch()
}

const handleSearch = async () => {
  if (searchType.value === 'rawMaterial') {
    await loadRawMaterialInventory()
  } else {
    await loadFinishedGoodInventory()
  }
}

const loadRawMaterialInventory = async () => {
  try {
    loading.value = true
    const response = await warehouseApi.getInventory({
      page: 1,
      limit: 1000,
      materialId: filters.materialId,
    })

    allData.value = response.data
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载原料库存失败')
  } finally {
    loading.value = false
  }
}

const loadFinishedGoodInventory = async () => {
  try {
    loading.value = true
    const response = await ordersApi.getOrders({ page: 1, limit: 1000 })
    const allOrders = response.data || []

    const orderItems: any[] = []
    for (const order of allOrders) {
      if (order.orderItems && Array.isArray(order.orderItems)) {
        for (const item of order.orderItems) {
          // Only show items that have some inbound quantity
          if ((item.inboundQuantity || 0) > 0) {
            orderItems.push({
              ...item,
              order: order,
            })
          }
        }
      }
    }

    allData.value = orderItems
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载成品库存失败')
  } finally {
    loading.value = false
  }
}

const viewTransactionHistory = (materialId: number) => {
  selectedMaterialId.value = materialId
  const material = rawMaterials.value.find((m: any) => m.id === materialId)
  selectedMaterialName.value = material ? `${material.name} (${material.code})` : '未知物料'

  historyFilters.type = undefined
  transactionPage.value = 1
  historyDialogVisible.value = true

  loadTransactionHistory()
}

const loadTransactionHistory = async () => {
  if (!selectedMaterialId.value) return

  try {
    transactionLoading.value = true
    const response = await warehouseApi.getTransactions({
      page: transactionPage.value,
      limit: transactionLimit.value,
      materialId: selectedMaterialId.value,
      type: historyFilters.type,
    })

    transactionData.value = response.data
    transactionTotal.value = response.total
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载流水记录失败')
  } finally {
    transactionLoading.value = false
  }
}

// Watch for pagination changes
watch([transactionPage, transactionLimit], () => {
  if (selectedMaterialId.value) {
    loadTransactionHistory()
  }
})

const handleHistoryDialogClose = () => {
  selectedMaterialId.value = null
  selectedMaterialName.value = ''
  historyFilters.type = undefined
  transactionData.value = []
}

const getStockTagType = (quantity: number): string => {
  if (quantity <= 0) return 'danger'
  if (quantity < 10) return 'warning'
  return 'success'
}

const getFinishedGoodStatusType = (row: any): string => {
  const inbound = row.inboundQuantity || 0
  const outbound = row.outboundQuantity || 0
  const total = row.quantity

  if (inbound === 0) return 'warning'
  if (inbound >= total && outbound >= total) return 'success'
  if (outbound > 0) return 'primary'
  return 'info'
}

const getFinishedGoodStatusLabel = (row: any): string => {
  const inbound = row.inboundQuantity || 0
  const outbound = row.outboundQuantity || 0
  const total = row.quantity

  if (inbound === 0) return '待入库'
  if (inbound >= total && outbound >= total) return '已完成'
  if (outbound > 0) return '出库中'
  if (inbound >= total) return '待出库'
  return '入库中'
}

const getTransactionTagType = (type: string): string => {
  const inboundTypes = ['PurchaseIn', 'ProductionIn', 'OutsourceIn', 'ReturnIn', 'AdjustmentIn']
  return inboundTypes.includes(type) ? 'success' : 'danger'
}

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    PurchaseIn: '采购入库',
    ProductionIn: '生产完工入库',
    OutsourceIn: '委外回货入库',
    ReturnIn: '客退入库',
    AdjustmentIn: '调整入库',
    ProductionOut: '生产领料',
    OutsourceOut: '委外发料',
    SalesOut: '销售出库',
    AdjustmentOut: '调整出库',
    Scrap: '报废',
  }
  return labels[type] || type
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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

.filter-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
