<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>出库管理</span>
        </div>
      </template>

      <div class="info-banner">
        <el-icon><InfoFilled /></el-icon>
        <span>选择需要出库发货的订单项目</span>
      </div>

      <el-table
        :data="pendingOrders"
        border
        style="width: 100%; margin-top: 20px"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="订单号" width="150">
          <template #default="{ row }">
            {{ row.order?.orderNumber || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="客户" width="180">
          <template #default="{ row }">
            {{ row.order?.customer?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="partName" label="产品名称" width="180" />
        <el-table-column prop="partSpec" label="产品规格" width="150" />
        <el-table-column label="订单数量" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.quantity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已入库" width="100">
          <template #default="{ row }">
            <el-tag type="success">{{ row.inboundQuantity || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已出库" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.outboundQuantity || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="待出库" width="100">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.quantity - (row.outboundQuantity || 0) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="本次出库" width="120">
          <template #default="{ row }">
            <el-input-number
              v-model="row.customOutboundQty"
              :min="0"
              :max="Math.min((row.inboundQuantity || 0) - (row.outboundQuantity || 0), row.quantity - (row.outboundQuantity || 0))"
              :precision="0"
              size="small"
              style="width: 100%"
              @change="validateQuantity(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="交货日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.order?.deliveryDate) }}
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedItems.length > 0" style="margin-top: 20px">
        <el-form :model="formData" :inline="true">
          <el-form-item label="操作员" required>
            <el-input v-model="formData.operator" placeholder="请输入操作员姓名" style="width: 200px" />
          </el-form-item>
          <el-form-item label="单据号">
            <el-input v-model="formData.referenceNumber" placeholder="选填" style="width: 200px" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="formData.notes" placeholder="选填" style="width: 300px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="submitting" size="large">
              提交出库 ({{ selectedItems.length }})
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { ordersApi } from '@/api/orders'
import { warehouseApi } from '@/api/warehouse'

const loading = ref(false)
const submitting = ref(false)
const pendingOrders = ref<any[]>([])
const selectedItems = ref<any[]>([])
const formData = reactive({
  operator: '',
  referenceNumber: '',
  notes: ''
})

onMounted(async () => {
  await loadPendingOrders()
})

const loadPendingOrders = async () => {
  try {
    loading.value = true
    // Fetch all orders with their items
    const response = await ordersApi.getOrders({ page: 1, limit: 1000 })
    const allOrders = response.data || []

    // Extract order items that are not fully shipped
    pendingOrders.value = []
    for (const order of allOrders) {
      if (order.orderItems && Array.isArray(order.orderItems)) {
        for (const item of order.orderItems) {
          const remaining = item.quantity - (item.outboundQuantity || 0)
          const availableInWarehouse = (item.inboundQuantity || 0) - (item.outboundQuantity || 0)
          if (remaining > 0 && availableInWarehouse > 0) {
            pendingOrders.value.push({
              ...item,
              order: order,
              customOutboundQty: Math.min(availableInWarehouse, remaining)
            })
          }
        }
      }
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载待出库订单失败')
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection: any[]) => {
  selectedItems.value = selection
}

const validateQuantity = (row: any) => {
  const availableInWarehouse = (row.inboundQuantity || 0) - (row.outboundQuantity || 0)
  const remaining = row.quantity - (row.outboundQuantity || 0)
  const maxAllowed = Math.min(availableInWarehouse, remaining)

  if (row.customOutboundQty > maxAllowed) {
    row.customOutboundQty = maxAllowed
    ElMessage.warning(`最多只能出库 ${maxAllowed} 件`)
  }
}

const handleSubmit = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要出库的项目')
    return
  }

  if (!formData.operator) {
    ElMessage.warning('请输入操作员姓名')
    return
  }

  // Validate that all selected items have valid quantities
  for (const item of selectedItems.value) {
    if (!item.customOutboundQty || item.customOutboundQty <= 0) {
      ElMessage.warning(`请为 ${item.partName} 输入有效的出库数量`)
      return
    }
  }

  const totalQty = selectedItems.value.reduce((sum, item) => sum + item.customOutboundQty, 0)

  try {
    await ElMessageBox.confirm(
      `确定要出库 ${selectedItems.value.length} 个项目，共 ${totalQty} 件吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    submitting.value = true

    // Mark order items as outbound using the simplified API with custom quantities
    await warehouseApi.markOrderItemsOutbound({
      orderItemIds: selectedItems.value.map(item => item.id),
      quantities: selectedItems.value.map(item => item.customOutboundQty),
      operator: formData.operator,
      referenceNumber: formData.referenceNumber,
      notes: formData.notes,
    })

    ElMessage.success('出库成功')

    // Clear selection and form
    selectedItems.value = []
    formData.operator = ''
    formData.referenceNumber = ''
    formData.notes = ''

    // Reload data
    await loadPendingOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '出库失败')
    }
  } finally {
    submitting.value = false
  }
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

.info-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  color: #0050b3;
  margin-bottom: 10px;
}
</style>
