<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>原料库存 (Raw Materials Inventory)</span>
          <el-button type="primary" @click="loadInventory">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="物料筛选">
          <el-select
            v-model="filters.materialId"
            placeholder="全部原材料"
            clearable
            filterable
            style="width: 250px"
            @change="loadInventory"
          >
            <el-option
              v-for="material in rawMaterials"
              :key="material.id"
              :label="`${material.name} (${material.code || material.id})`"
              :value="material.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table
        :data="inventoryData"
        border
        style="width: 100%"
        v-loading="inventoryLoading"
      >
        <el-table-column prop="material.code" label="物料编码" width="120" />
        <el-table-column prop="material.name" label="物料名称" width="180" />
        <el-table-column prop="material.specification" label="规格型号" width="150" />
        <el-table-column prop="material.category" label="分类" width="120" />
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

      <div class="pagination-container">
        <el-pagination
          :current-page="inventoryPage"
          :page-size="inventoryLimit"
          :page-sizes="[10, 20, 50, 100]"
          :total="inventoryTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="(page) => inventoryPage = page"
          @size-change="(size) => inventoryLimit = size"
        />
      </div>
    </el-card>

    <!-- Transaction History Dialog -->
    <el-dialog
      v-model="historyDialogVisible"
      :title="`${selectedMaterialName} - 原料流水`"
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
            <el-option label="生产领料" value="ProductionOut" />
            <el-option label="委外发料" value="OutsourceOut" />
            <el-option label="客退入库" value="ReturnIn" />
            <el-option label="调整入库" value="AdjustmentIn" />
            <el-option label="调整出库" value="AdjustmentOut" />
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
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { warehouseApi } from '@/api/warehouse'
import { materialApi } from '@/api/material'

interface InventoryFilters {
  materialId?: number
}

interface HistoryFilters {
  type?: string
}

const filters = reactive<InventoryFilters>({})
const historyFilters = reactive<HistoryFilters>({})

const inventoryData = ref<any[]>([])
const inventoryLoading = ref(false)
const inventoryPage = ref(1)
const inventoryLimit = ref(10)
const inventoryTotal = ref(0)

const transactionData = ref<any[]>([])
const transactionLoading = ref(false)
const transactionPage = ref(1)
const transactionLimit = ref(10)
const transactionTotal = ref(0)

const rawMaterials = ref<any[]>([])
const historyDialogVisible = ref(false)
const selectedMaterialId = ref<number | null>(null)
const selectedMaterialName = ref('')

onMounted(async () => {
  await loadRawMaterials()
  await loadInventory()
})

const loadRawMaterials = async () => {
  try {
    const response = await materialApi.getList({
      page: 1,
      limit: 1000,
      type: 'RawMaterial'
    })
    rawMaterials.value = response.data
  } catch (error) {
    ElMessage.error('加载原材料列表失败')
  }
}

const loadInventory = async () => {
  try {
    inventoryLoading.value = true

    // If a specific material is selected, filter by it
    // Otherwise, we need to filter by material type on backend or client side
    const response = await warehouseApi.getInventory({
      page: inventoryPage.value,
      limit: inventoryLimit.value,
      materialId: filters.materialId,
    })

    // Filter to only show raw materials
    if (!filters.materialId) {
      const rawMaterialIds = rawMaterials.value.map(m => m.id)
      inventoryData.value = response.data.filter((inv: any) =>
        rawMaterialIds.includes(inv.material?.id)
      )
      inventoryTotal.value = inventoryData.value.length
    } else {
      inventoryData.value = response.data
      inventoryTotal.value = response.total
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载库存数据失败')
  } finally {
    inventoryLoading.value = false
  }
}

const viewTransactionHistory = (materialId: number) => {
  selectedMaterialId.value = materialId
  const material = rawMaterials.value.find((m) => m.id === materialId)
  selectedMaterialName.value = material ? `${material.name} (${material.code || material.id})` : '未知物料'

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
watch([inventoryPage, inventoryLimit], () => {
  loadInventory()
})

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

const getTransactionTagType = (type: string): string => {
  const inboundTypes = ['PurchaseIn', 'ReturnIn', 'AdjustmentIn']
  return inboundTypes.includes(type) ? 'success' : 'danger'
}

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    PurchaseIn: '采购入库',
    ProductionOut: '生产领料',
    OutsourceOut: '委外发料',
    ReturnIn: '客退入库',
    AdjustmentIn: '调整入库',
    AdjustmentOut: '调整出库',
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
