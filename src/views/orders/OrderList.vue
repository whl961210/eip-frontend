<template>
  <div class="order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
          <el-button type="primary" @click="router.push('/orders/new')">
            <el-icon><Plus /></el-icon>
            新建订单
          </el-button>
        </div>
      </template>

      <!-- Search and Filter -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号">
          <el-input
            v-model="searchForm.orderNumber"
            placeholder="请输入订单号"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="客户">
          <el-select
            v-model="searchForm.customerId"
            placeholder="请选择客户"
            clearable
            filterable
            @clear="handleSearch"
          >
            <el-option
              v-for="customer in customers"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            @clear="handleSearch"
          >
            <el-option label="待处理" value="Pending" />
            <el-option label="进行中" value="InProgress" />
            <el-option label="已完成" value="Completed" />
            <el-option label="已取消" value="Cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Orders Table -->
      <el-table :data="orders" v-loading="loading" style="width: 100%">
        <el-table-column prop="orderNumber" label="订单号" width="150" />
        <el-table-column label="客户" width="150">
          <template #default="{ row }">
            {{ row.customer?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="订单日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.orderDate) }}
          </template>
        </el-table-column>
        <el-table-column label="交货日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.deliveryDate) }}
          </template>
        </el-table-column>
        <el-table-column label="订单金额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ formatAmount(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="订单项" width="80" align="center">
          <template #default="{ row }">
            {{ row.orderItems?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            {{ row.notes || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">查看</el-button>
            <el-dropdown @command="(cmd: string) => handleCommand(cmd, row)" style="margin-left: 8px">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="changeStatus"
                    :disabled="row.status === 'Completed' || row.status === 'Cancelled'"
                  >
                    修改状态
                  </el-dropdown-item>
                  <el-dropdown-item command="createProject" :disabled="row.status === 'Cancelled'">
                    创建项目
                  </el-dropdown-item>
                  <el-dropdown-item command="cancel" :disabled="row.status !== 'Pending'" divided>
                    取消订单
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchOrders"
        @current-change="fetchOrders"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- Order Detail Dialog -->
    <el-dialog v-model="showDetailDialog" :title="isEditing ? '编辑订单' : '订单详情'" width="1000px" v-loading="inboundLoading" element-loading-text="正在处理入库操作，请稍候...">
      <div v-if="selectedOrder">
        <div style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 8px">
          <el-button v-if="!isEditing" type="primary" @click="startEdit">编辑订单</el-button>
          <el-button
            v-if="!isEditing && selectedItems.length > 0"
            type="success"
            @click="handleMoveToInbound"
            :loading="inboundLoading"
            :disabled="inboundLoading"
          >
            移至入库 ({{ selectedItems.length }})
          </el-button>
        </div>

        <el-form v-if="isEditing" :model="editForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="订单号">
                <el-input v-model="editForm.orderNumber" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户">
                <el-select v-model="editForm.customerId" filterable style="width: 100%">
                  <el-option
                    v-for="customer in customers"
                    :key="customer.id"
                    :label="customer.name"
                    :value="customer.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="订单日期">
                <el-date-picker
                  v-model="editForm.orderDate"
                  type="date"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="交货日期">
                <el-date-picker
                  v-model="editForm.deliveryDate"
                  type="date"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注">
            <el-input v-model="editForm.notes" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>

        <el-descriptions v-else :column="2" border>
          <el-descriptions-item label="订单号">
            {{ selectedOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="客户">
            {{ selectedOrder.customer?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="订单日期">
            {{ formatDate(selectedOrder.orderDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="交货日期">
            {{ formatDate(selectedOrder.deliveryDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedOrder.status)">
              {{ getStatusLabel(selectedOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            ¥{{ formatAmount(selectedOrder.totalAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ selectedOrder.notes || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">
          订单明细
          <span v-if="!isEditing" style="font-size: 12px; color: #909399; margin-left: 8px">
            (选择项目后点击"移至入库"按钮)
          </span>
        </el-divider>

        <el-table
          :data="isEditing ? editForm.orderItems : selectedOrder.orderItems"
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column v-if="!isEditing" type="selection" width="55" :selectable="checkSelectable" />
          <el-table-column label="序号" type="index" width="60" align="center" />

          <el-table-column label="零件名称" min-width="120">
            <template #default="{ row, $index }">
              <el-input
                v-if="isEditing"
                v-model="editForm.orderItems[$index].partName"
                size="small"
              />
              <span v-else>{{ row.partName }}</span>
            </template>
          </el-table-column>

          <el-table-column label="图号/规格" min-width="120">
            <template #default="{ row, $index }">
              <el-input
                v-if="isEditing"
                v-model="editForm.orderItems[$index].partSpec"
                size="small"
              />
              <span v-else>{{ row.partSpec }}</span>
            </template>
          </el-table-column>

          <el-table-column label="数量" width="100" align="center">
            <template #default="{ row, $index }">
              <el-input-number
                v-if="isEditing"
                v-model="editForm.orderItems[$index].quantity"
                :min="1"
                size="small"
                controls-position="right"
                style="width: 100%"
                @change="updateItemTotal($index)"
              />
              <span v-else>{{ row.quantity }}</span>
            </template>
          </el-table-column>

          <el-table-column v-if="!isEditing" label="入库状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.inboundQuantity >= row.quantity" type="success" size="small">已入库</el-tag>
              <el-tag
                v-else-if="(row.inboundQuantity || 0) > 0"
                type="warning"
                size="small"
              >
                部分入库 ({{ row.inboundQuantity || 0 }}/{{ row.quantity }})
              </el-tag>
              <el-tag v-else type="info" size="small">未入库</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="单价" width="120" align="right">
            <template #default="{ row, $index }">
              <el-input-number
                v-if="isEditing"
                v-model="editForm.orderItems[$index].unitPrice"
                :min="0"
                :precision="2"
                size="small"
                controls-position="right"
                style="width: 100%"
                @change="updateItemTotal($index)"
              />
              <span v-else>¥{{ formatAmount(row.unitPrice) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="总价" width="120" align="right">
            <template #default="{ row, $index }">
              <span v-if="isEditing">
                ¥{{ formatAmount(editForm.orderItems[$index].quantity * editForm.orderItems[$index].unitPrice) }}
              </span>
              <span v-else>¥{{ formatAmount(row.totalPrice) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="备注" min-width="120">
            <template #default="{ row, $index }">
              <el-input
                v-if="isEditing"
                v-model="editForm.orderItems[$index].notes"
                size="small"
              />
              <span v-else>{{ row.notes }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button v-if="isEditing" @click="cancelEdit">取消</el-button>
        <el-button v-if="isEditing" type="primary" @click="saveEdit" :loading="updating">
          保存
        </el-button>
        <el-button v-if="!isEditing" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Change Status Dialog -->
    <el-dialog v-model="showStatusDialog" title="修改订单状态" width="400px">
      <el-form :model="statusForm" label-width="80px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(selectedOrder?.status || '')">
            {{ getStatusLabel(selectedOrder?.status || '') }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新状态">
          <el-select v-model="statusForm.status" placeholder="请选择状态">
            <el-option label="待处理" value="Pending" />
            <el-option label="进行中" value="InProgress" />
            <el-option label="已完成" value="Completed" />
            <el-option label="已取消" value="Cancelled" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmStatusChange" :loading="updating">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi, baseDataApi, warehouseApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const inboundLoading = ref(false)
const updating = ref(false)
const showDetailDialog = ref(false)
const showStatusDialog = ref(false)
const isEditing = ref(false)

const orders = ref<any[]>([])
const customers = ref<any[]>([])
const selectedOrder = ref<any>(null)
const selectedItems = ref<any[]>([])

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchForm = reactive({
  orderNumber: '',
  customerId: null as number | null,
  status: '',
})

const editForm = reactive({
  orderNumber: '',
  customerId: null as number | null,
  orderDate: '',
  deliveryDate: '',
  notes: '',
  orderItems: [] as any[],
})

const statusForm = reactive({
  status: '',
})

const formatDate = (date: any) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatAmount = (amount: any) => {
  if (!amount) return '0.00'
  return parseFloat(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, any> = {
    Pending: 'warning',
    InProgress: 'primary',
    Completed: 'success',
    Cancelled: 'danger',
  }
  return statusMap[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    Pending: '待处理',
    InProgress: '进行中',
    Completed: '已完成',
    Cancelled: '已取消',
  }
  return statusMap[status] || status
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    }

    if (searchForm.orderNumber) {
      params.orderNumber = searchForm.orderNumber
    }
    if (searchForm.customerId) {
      params.customerId = searchForm.customerId
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }

    const response = await ordersApi.getOrders(params)
    orders.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCustomers = async () => {
  try {
    const response = await baseDataApi.getCustomers({ page: 1, limit: 1000 })
    customers.value = response.data
  } catch (error) {
    console.error('Failed to fetch customers:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchOrders()
}

const handleReset = () => {
  searchForm.orderNumber = ''
  searchForm.customerId = null
  searchForm.status = ''
  currentPage.value = 1
  fetchOrders()
}

const viewOrder = async (order: any) => {
  try {
    const response = await ordersApi.getOrder(order.id)
    selectedOrder.value = response

    // Populate edit form
    editForm.orderNumber = response.orderNumber
    editForm.customerId = response.customerId
    editForm.orderDate = response.orderDate
    editForm.deliveryDate = response.deliveryDate
    editForm.notes = response.notes || ''

    // Reset editing state and selected items
    isEditing.value = false
    selectedItems.value = []

    showDetailDialog.value = true
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

const handleCommand = (command: string, order: any) => {
  selectedOrder.value = order

  switch (command) {
    case 'changeStatus':
      statusForm.status = order.status
      showStatusDialog.value = true
      break
    case 'createProject':
      createProject(order)
      break
    case 'cancel':
      cancelOrder(order)
      break
  }
}

const confirmStatusChange = async () => {
  if (!selectedOrder.value || !statusForm.status) {
    ElMessage.warning('请选择状态')
    return
  }

  updating.value = true
  try {
    await ordersApi.updateOrderStatus(selectedOrder.value.id, statusForm.status)
    ElMessage.success('订单状态更新成功')
    showStatusDialog.value = false
    fetchOrders()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '状态更新失败')
  } finally {
    updating.value = false
  }
}

const createProject = async (order: any) => {
  try {
    await ElMessageBox.confirm(
      `确定为订单 ${order.orderNumber} 创建项目吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    )

    // Project will be automatically created by backend
    ElMessage.info('项目创建功能需要在后端实现')
  } catch (error) {
    // User cancelled
  }
}

const cancelOrder = async (order: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消订单 ${order.orderNumber} 吗？此操作不可撤销。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await ordersApi.updateOrderStatus(order.id, 'Cancelled')
    ElMessage.success('订单已取消')
    fetchOrders()
  } catch (error) {
    // User cancelled or error occurred
  }
}

const handleSelectionChange = (selection: any[]) => {
  selectedItems.value = selection
}

const checkSelectable = (row: any) => {
  // Only allow selection if item is not fully inbound yet
  return (row.inboundQuantity || 0) < row.quantity
}

const handleMoveToInbound = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要入库的项目')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将 ${selectedItems.value.length} 个项目标记为入库吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    )

    inboundLoading.value = true
    ElMessage.info({
      message: `正在处理 ${selectedItems.value.length} 个项目，请稍候...`,
      duration: 0,
      showClose: true
    })

    // Mark items as inbound
    await warehouseApi.markOrderItemsInbound({
      orderItemIds: selectedItems.value.map(item => item.id)
    })

    ElMessage.closeAll()
    ElMessage.success(`已成功将 ${selectedItems.value.length} 个项目标记为入库`)
    selectedItems.value = []

    // Refresh the order
    const response = await ordersApi.getOrder(selectedOrder.value.id)
    selectedOrder.value = response

    // Ask if user wants to go to Inbound page
    try {
      await ElMessageBox.confirm(
        '是否现在前往入库管理页面查看？',
        '提示',
        {
          confirmButtonText: '前往',
          cancelButtonText: '稍后',
          type: 'success',
        }
      )
      router.push('/warehouse/inbound')
    } catch {
      // User clicked cancel, do nothing
    }
  } catch (error: any) {
    ElMessage.closeAll()
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  } finally {
    inboundLoading.value = false
  }
}

const startEdit = () => {
  if (!selectedOrder.value) return

  // Copy order data to edit form
  editForm.orderNumber = selectedOrder.value.orderNumber
  editForm.customerId = selectedOrder.value.customerId
  editForm.orderDate = selectedOrder.value.orderDate?.split('T')[0] || ''
  editForm.deliveryDate = selectedOrder.value.deliveryDate?.split('T')[0] || ''
  editForm.notes = selectedOrder.value.notes || ''

  // Deep copy order items to allow editing
  editForm.orderItems = selectedOrder.value.orderItems.map((item: any) => ({
    id: item.id,
    partName: item.partName,
    partSpec: item.partSpec,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    notes: item.notes || '',
    isOutbound: item.isOutbound,
    outboundQuantity: item.outboundQuantity,
  }))

  isEditing.value = true
}

const updateItemTotal = (index: number) => {
  // Recalculate total price when quantity or unit price changes
  const item = editForm.orderItems[index]
  item.totalPrice = item.quantity * item.unitPrice
}

const cancelEdit = () => {
  isEditing.value = false
}

const saveEdit = async () => {
  if (!selectedOrder.value) return

  updating.value = true
  try {
    const updateData = {
      customerId: editForm.customerId,
      orderDate: editForm.orderDate,
      deliveryDate: editForm.deliveryDate,
      notes: editForm.notes,
      orderItems: editForm.orderItems,
    }

    await ordersApi.updateOrder(selectedOrder.value.id, updateData)
    ElMessage.success('订单更新成功')
    isEditing.value = false

    // Refresh the order details
    const response = await ordersApi.getOrder(selectedOrder.value.id)
    selectedOrder.value = response
    fetchOrders()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '订单更新失败')
  } finally {
    updating.value = false
  }
}

onMounted(() => {
  fetchOrders()
  fetchCustomers()
})
</script>

<style scoped>
.order-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

:deep(.el-descriptions) {
  margin-bottom: 20px;
}
</style>
