<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>出库记录 (Outbound History)</span>
          <el-button type="primary" @click="loadOutboundHistory">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div class="stats-container">
        <el-statistic title="总出库记录" :value="totalRecords" suffix="条" />
        <el-statistic title="总出库数量" :value="totalQuantity" suffix="件" />
      </div>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="订单号">
          <el-input
            v-model="filters.orderNumber"
            placeholder="订单号"
            clearable
            style="width: 200px"
            @input="applyFilters"
          />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input
            v-model="filters.customerName"
            placeholder="客户名称"
            clearable
            style="width: 200px"
            @input="applyFilters"
          />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input
            v-model="filters.partName"
            placeholder="产品名称"
            clearable
            style="width: 200px"
            @input="applyFilters"
          />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            @change="applyFilters"
          />
        </el-form-item>
      </el-form>

      <el-table
        :data="paginatedData"
        border
        style="width: 100%"
        v-loading="loading"
      >
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
        <el-table-column label="已出库数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.outboundQuantity || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="出库比例" width="100" align="center">
          <template #default="{ row }">
            {{ getOutboundPercentage(row) }}%
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
            <el-tag :type="getStatusType(row)">
              {{ getStatusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewTransactionHistory(row)"
            >
              查看流水
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="openDeliveryNote(row)"
              style="margin-left: 8px"
            >
              打印送货单
            </el-button>
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
      :title="`${selectedItemName} - 出库流水详情`"
      width="1200px"
    >
      <el-table
        :data="transactionData"
        border
        style="width: 100%"
        v-loading="transactionLoading"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="操作类型" width="130">
          <template #default="{ row }">
            <el-tag :type="getTransactionTagType(row.type)">
              {{ getTransactionTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="出库数量" width="120" align="center">
          <template #default="{ row }">
            <span style="color: red; font-weight: bold">
              {{ Math.abs(row.quantity) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="referenceNumber" label="单据号" width="150">
          <template #default="{ row }">
            {{ row.referenceNumber || '-' }}
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
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="historyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Delivery Note Dialog -->
    <el-dialog
      v-model="deliveryNoteVisible"
      title="送货单"
      width="900px"
      :close-on-click-modal="false"
    >
      <div id="delivery-note-print" class="delivery-note">
        <div class="dn-header">
          <span class="dn-star">★</span>
          <span class="dn-seb">SEB</span>
          <h2 class="dn-title">采购产品送检（送货）单</h2>
          <div class="dn-header-right">
            <el-input
              v-model="deliveryForm.noSurfaceTreatment"
              placeholder="此产品不需做表面处理"
              style="width: 200px"
              size="small"
            />
          </div>
        </div>

        <div class="dn-subheader">
          <div class="dn-attachment">
            <span>*附件:</span>
            <el-input
              v-model="deliveryForm.attachment"
              placeholder="无需"
              style="width: 120px"
              size="small"
            />
          </div>
          <span class="dn-warehouse-check">*仓库接收</span>
        </div>

        <div class="dn-date-number">
          <div class="dn-date">
            <span class="dn-label">日期:</span>
            <el-date-picker
              v-model="deliveryForm.date"
              type="date"
              format="YYYY 年 MM 月 DD 日"
              value-format="YYYY-MM-DD"
              style="width: 200px"
            />
          </div>
          <div class="dn-number">
            <span class="dn-label">编号:</span>
            <el-input v-model="deliveryForm.documentNumber" style="width: 150px" />
            <el-button type="danger" size="small" icon="Close" circle style="margin-left: 10px" />
          </div>
        </div>

        <table class="dn-table">
          <colgroup>
            <col style="width: 80px" />
            <col style="width: 100px" />
            <col style="width: 55px" />
            <col style="width: 100px" />
            <col style="width: 55px" />
            <col style="width: 45px" />
            <col style="width: 60px" />
            <col style="width: 30px" />
          </colgroup>
          <tbody>
            <!-- Row 1: Supplier and Project Code -->
            <tr>
              <td class="dn-field-label">供货单位</td>
              <td class="dn-field-value">
                <el-input v-model="deliveryForm.supplier" />
              </td>
              <td class="dn-field-label" style="background-color: white;"><span style="color: #FF0000;">*</span>项目代号</td>
              <td class="dn-field-value" colspan="5">
                <el-input v-model="deliveryForm.projectCode" />
              </td>
            </tr>
            <!-- Row 2: Part Number and Part Name -->
            <tr>
              <td class="dn-field-label">件&nbsp;&nbsp;号</td>
              <td class="dn-field-value">
                <el-input v-model="deliveryForm.partNumber" />
              </td>
              <td class="dn-field-label" style="background-color: white;"><span style="color: #FF0000;">*</span>名称/规格</td>
              <td class="dn-field-value" colspan="4">
                <el-input v-model="deliveryForm.partName" />
              </td>
              <td class="dn-dash">—</td>
            </tr>
            <!-- Row 3: Price, Units, Warehouse -->
            <tr>
              <td class="dn-field-label" rowspan="2" style="background-color: white;"><span style="color: #FF0000;">*</span>单价</td>
              <td class="dn-field-value" rowspan="2">
                <el-input v-model="deliveryForm.unitPrice" size="small" />
              </td>
              <td class="dn-field-label">单位</td>
              <td class="dn-field-value">
                <el-input v-model="deliveryForm.unit" style="width: 50px" size="small" />
              </td>
              <td class="dn-field-label">仓库</td>
              <td class="dn-field-label">单位</td>
              <td class="dn-field-value">
                <el-input v-model="deliveryForm.warehouseUnit" style="width: 50px" size="small" />
              </td>
              <td class="dn-inspection-label" rowspan="2">检验留存</td>
            </tr>
            <!-- Row 4: Quantity and Received -->
            <tr>
              <td class="dn-field-label" style="background-color: white;"><span style="color: #FF0000;">*</span>数量</td>
              <td class="dn-field-value">
                <el-input-number v-model="deliveryForm.quantity" style="width: 55px" controls-position="right" size="small" />
              </td>
              <td class="dn-field-label">实收</td>
              <td class="dn-field-label">数量</td>
              <td class="dn-field-value">
                <el-input-number v-model="deliveryForm.receivedQuantity" style="width: 55px" controls-position="right" size="small" />
              </td>
            </tr>
            <!-- Row 6: Inspection Basis and Method -->
            <tr>
              <td class="dn-field-label">检验依据</td>
              <td class="dn-field-value" colspan="2">
                <el-input v-model="deliveryForm.inspectionBasis" size="small" />
              </td>
              <td class="dn-field-label">检验方式</td>
              <td class="dn-field-value" colspan="4">
                <el-checkbox-group v-model="deliveryForm.inspectionMethod" size="small">
                  <el-checkbox label="逐证">逐证</el-checkbox>
                  <el-checkbox label="抽检">抽检</el-checkbox>
                  <el-checkbox label="全检">全检</el-checkbox>
                </el-checkbox-group>
              </td>
            </tr>
            <!-- Row 7: Inspection Results -->
            <tr>
              <td class="dn-field-label">检验结果</td>
              <td class="dn-field-value" colspan="2" style="text-align: center;">
                <div style="font-weight: bold; padding-bottom: 2px; border-bottom: 1px solid #000;">合格数</div>
                <div style="padding-top: 2px;">
                  <el-input-number v-model="deliveryForm.qualifiedQuantity" style="width: 55px" controls-position="right" size="small" />
                </div>
              </td>
              <td class="dn-field-value" colspan="2" style="text-align: center;">
                <div style="font-weight: bold; padding-bottom: 2px; border-bottom: 1px solid #000;">不合格数</div>
                <div style="padding-top: 2px;">
                  <el-input-number v-model="deliveryForm.unqualifiedQuantity" style="width: 55px" controls-position="right" size="small" />
                </div>
              </td>
              <td class="dn-field-label">检验部门<br/>意见:</td>
              <td class="dn-field-value" colspan="2">
                <el-input v-model="deliveryForm.inspectionComment" size="small" />
              </td>
            </tr>
            <!-- Row 8: Signatures -->
            <tr>
              <td class="dn-signature-label" rowspan="2" style="background-color: white;"><span style="color: #FF0000;">*</span>采购</td>
              <td class="dn-signature-value">
                <el-input v-model="deliveryForm.procurementSignature" style="width: 100px" size="small" />
              </td>
              <td class="dn-signature-label">检验</td>
              <td class="dn-signature-value">
                <el-input v-model="deliveryForm.inspectionSignature" style="width: 60px" size="small" />
              </td>
              <td class="dn-signature-label">仓库</td>
              <td class="dn-signature-value" colspan="3">
                <el-input v-model="deliveryForm.warehouseSignature" style="width: 60px" size="small" />
              </td>
            </tr>
            <!-- Row 9: Dates -->
            <tr>
              <td class="dn-date-field">
                <el-date-picker
                  v-model="deliveryForm.procurementDate"
                  type="date"
                  format="YYYY 年 MM 月 DD 日"
                  value-format="YYYY-MM-DD"
                  style="width: 160px"
                  size="small"
                />
              </td>
              <td class="dn-signature-label">签署</td>
              <td class="dn-date-field">
                <el-date-picker
                  v-model="deliveryForm.inspectionDate"
                  type="date"
                  format="YYYY 年 MM 月 DD 日"
                  value-format="YYYY-MM-DD"
                  style="width: 120px"
                  size="small"
                />
              </td>
              <td class="dn-signature-label">签署</td>
              <td class="dn-date-field" colspan="3">
                <el-date-picker
                  v-model="deliveryForm.warehouseDate"
                  type="date"
                  format="YYYY 年 MM 月 DD 日"
                  value-format="YYYY-MM-DD"
                  style="width: 120px"
                  size="small"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div class="dn-footer">
          说明：一、检验留存（白色），二、仓库留存（浅红），三、采购留存（蓝色），四、供货留存（黄色）
        </div>
      </div>

      <template #footer>
        <el-button @click="deliveryNoteVisible = false">取消</el-button>
        <el-button type="primary" @click="printDeliveryNote">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { ordersApi } from '@/api/orders'
import { warehouseApi } from '@/api/warehouse'

interface Filters {
  orderNumber?: string
  customerName?: string
  partName?: string
}

const loading = ref(false)
const allData = ref<any[]>([])
const filters = reactive<Filters>({})
const dateRange = ref<[Date, Date] | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)

const transactionData = ref<any[]>([])
const transactionLoading = ref(false)
const historyDialogVisible = ref(false)
const selectedItemName = ref('')

const deliveryNoteVisible = ref(false)
const deliveryForm = reactive({
  noSurfaceTreatment: '',
  attachment: '',
  date: new Date().toISOString().split('T')[0],
  documentNumber: '',
  supplier: '',
  projectCode: '',
  partNumber: '',
  partName: '',
  unitPrice: '',
  unit: '件',
  quantity: 0,
  warehouseUnit: '件',
  receivedQuantity: 0,
  inspectionBasis: '',
  inspectionMethod: ['抽检'],
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
  inspectionComment: '',
  procurementSignature: '',
  procurementDate: new Date().toISOString().split('T')[0],
  inspectionSignature: '',
  inspectionDate: new Date().toISOString().split('T')[0],
  warehouseSignature: '',
  warehouseDate: new Date().toISOString().split('T')[0],
})

const filteredData = computed(() => {
  let items = allData.value

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
    items = items.filter((item) => item.partName?.toLowerCase().includes(query))
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value
    items = items.filter((item) => {
      if (!item.order?.deliveryDate) return false
      const deliveryDate = new Date(item.order.deliveryDate)
      return deliveryDate >= startDate && deliveryDate <= endDate
    })
  }

  return items
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const totalRecords = computed(() => filteredData.value.length)

const totalQuantity = computed(() => {
  return filteredData.value.reduce((sum, item) => {
    return sum + (item.outboundQuantity || 0)
  }, 0)
})

onMounted(async () => {
  await loadOutboundHistory()
})

const loadOutboundHistory = async () => {
  try {
    loading.value = true
    const response = await ordersApi.getOrders({ page: 1, limit: 1000 })
    const allOrders = response.data || []

    const outboundItems: any[] = []
    for (const order of allOrders) {
      if (order.orderItems && Array.isArray(order.orderItems)) {
        for (const item of order.orderItems) {
          // Only show items that have been outbound
          if ((item.outboundQuantity || 0) > 0) {
            outboundItems.push({
              ...item,
              order: order,
            })
          }
        }
      }
    }

    allData.value = outboundItems
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载出库记录失败')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
}

const getOutboundPercentage = (row: any): string => {
  if (!row.quantity || row.quantity === 0) return '0'
  const percentage = ((row.outboundQuantity || 0) / row.quantity) * 100
  return percentage.toFixed(1)
}

const getStatusType = (row: any): string => {
  const outbound = row.outboundQuantity || 0
  const total = row.quantity

  if (row.isOutbound || outbound >= total) return 'success'
  if (outbound > 0) return 'warning'
  return 'info'
}

const getStatusLabel = (row: any): string => {
  const outbound = row.outboundQuantity || 0
  const total = row.quantity

  if (row.isOutbound || outbound >= total) return '已完成'
  if (outbound > 0) return '部分出库'
  return '未出库'
}

const viewTransactionHistory = async (row: any) => {
  selectedItemName.value = `${row.partName} (${row.order?.orderNumber})`
  historyDialogVisible.value = true

  try {
    transactionLoading.value = true
    const response = await warehouseApi.getTransactions({
      page: 1,
      limit: 100,
      orderItemId: row.id,
      type: 'SalesOut',
    })

    transactionData.value = response.data
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载流水记录失败')
  } finally {
    transactionLoading.value = false
  }
}

const openDeliveryNote = (row: any) => {
  // Generate document number based on date and order
  const today = new Date()
  const isoDate = today.toISOString().split('T')[0] || '' // Get date part (YYYY-MM-DD)
  const dateStr = isoDate.replace(/-/g, '').slice(2) // Remove dashes and get YYMMDD
  const docNumber = `${dateStr}-${row.id.toString().padStart(4, '0')}`

  // Pre-populate form with data
  Object.assign(deliveryForm, {
    date: today.toISOString().split('T')[0],
    documentNumber: docNumber,
    supplier: row.order?.customerName || '',
    projectCode: row.order?.orderNumber || '',
    partNumber: row.partSpec || '',
    partName: row.partName || '',
    unitPrice: '',
    unit: row.unit || '件',
    quantity: row.outboundQuantity || 0,
    warehouseUnit: row.unit || '件',
    receivedQuantity: row.outboundQuantity || 0,
    inspectionBasis: '',
    inspectionMethod: ['抽检'],
    qualifiedQuantity: 0,
    unqualifiedQuantity: row.outboundQuantity || 0,
    inspectionComment: '',
    procurementSignature: '',
    procurementDate: today.toISOString().split('T')[0],
    inspectionSignature: '',
    inspectionDate: today.toISOString().split('T')[0],
    warehouseSignature: '',
    warehouseDate: today.toISOString().split('T')[0],
  })

  deliveryNoteVisible.value = true
}

const printDeliveryNote = () => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  // Format dates
  const formatPrintDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()} 年 ${(date.getMonth() + 1).toString().padStart(2, '0')} 月 ${date.getDate().toString().padStart(2, '0')} 日`
  }

  const checkboxSymbol = (checked: boolean) => checked ? '☑' : '☐'

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>送货单</title>
        <style>
          @page {
            size: A4;
            margin: 8mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: "SimSun", "Microsoft YaHei", "SimHei", Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            padding: 5px;
          }
          .delivery-note {
            width: 100%;
            border: none;
            padding: 6px;
          }
          .dn-top-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 1px;
          }
          .dn-top-left {
            display: flex;
            align-items: center;
          }
          .dn-star {
            color: #FF0000;
            font-size: 12px;
            margin-right: 2px;
          }
          .dn-seb {
            color: #000;
            font-size: 11px;
            font-weight: bold;
          }
          .dn-top-right {
            font-size: 9px;
          }
          .dn-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 2px;
            margin-top: 1px;
          }
          .dn-meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
            font-size: 9px;
          }
          .dn-meta-left {
            color: #0000FF;
            font-weight: normal;
          }
          .dn-meta-right {
            color: #FF0000;
            font-weight: normal;
          }
          .dn-date-number {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2px;
            margin-top: 2px;
            font-size: 10px;
            padding: 0;
            max-width: 100%;
          }
          .dn-date {
            display: flex;
            align-items: center;
            margin-left: 2px;
          }
          .dn-date span:first-child,
          .dn-number span:first-child {
            font-weight: bold;
            margin-right: 3px;
          }
          .dn-number {
            display: flex;
            align-items: center;
            margin-right: 2px;
          }
          .dn-close-btn {
            color: #FF0000;
            font-size: 11px;
            margin-left: 3px;
            font-weight: bold;
          }
          .dn-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 3px;
            table-layout: fixed;
          }
          .dn-table td {
            border: 1px solid #000;
            padding: 1px 2px;
            font-size: 10px;
            vertical-align: middle;
            word-wrap: break-word;
            height: 22px;
          }
          .dn-field-label {
            font-weight: bold;
            text-align: center;
            background-color: #f5f5f5;
            color: #0000FF;
            min-width: 70px;
          }
          .dn-field-value {
            padding: 1px 2px;
            min-height: 18px;
          }
          .dn-sub-label {
            font-weight: bold;
            text-align: center;
            color: #FF0000;
            padding: 1px;
            font-size: 9px;
            width: 45px;
          }
          .dn-sub-value {
            text-align: center;
            padding: 1px;
            font-weight: bold;
          }
          .dn-price-cell {
            min-width: 95px;
          }
          .dn-inspection-label {
            text-align: center;
            font-weight: bold;
            background-color: #f5f5f5;
            padding: 0px;
            font-size: 9px;
            line-height: 1.2;
          }
          .dn-signature-label {
            font-weight: bold;
            text-align: center;
            color: #0000FF;
            padding: 1px;
            width: 45px;
          }
          .dn-signature-value {
            padding: 1px 2px;
            text-align: center;
            min-height: 22px;
          }
          .dn-date-cell {
            padding: 1px 2px;
            text-align: center;
          }
          .dn-dash {
            text-align: center;
            padding: 2px;
            font-size: 14px;
          }
          .dn-vertical-date {
            writing-mode: vertical-rl;
            text-align: center;
            padding: 2px 1px;
            font-size: 9px;
            line-height: 1.3;
          }
          .dn-footer {
            font-size: 8px;
            color: #666;
            padding: 2px 3px;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
          }
          @media print {
            body {
              padding: 0;
              zoom: 137%;
            }
            .delivery-note {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="delivery-note">
          <!-- Top header with star SEB and checkbox -->
          <div class="dn-top-header">
            <div class="dn-top-left">
              <span class="dn-star">★</span>
              <span class="dn-seb">SEB</span>
            </div>
            <div class="dn-top-right">
              ${deliveryForm.noSurfaceTreatment || '此产品不需做表面处理'}
            </div>
          </div>

          <!-- Title -->
          <div class="dn-title">采购产品送检（送货）单</div>

          <!-- Info table with date, number, attachment, warehouse -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 2px; font-size: 10px;">
            <tr>
              <td style="border: none; padding: 1px 2px; width: 25%; color: #0000FF;">
                *附件: ${deliveryForm.attachment || '无需'}
              </td>
              <td style="border: none; padding: 1px 2px; width: 50%; text-align: center;">
                <span style="font-weight: bold;">日期:</span> ${formatPrintDate(deliveryForm.date)}
              </td>
              <td style="border: none; padding: 1px 2px; width: 25%; text-align: right;">
                <span style="font-weight: bold;">编号:</span> ${deliveryForm.documentNumber} <span style="color: #FF0000; margin-left: 2px;">✕</span>
              </td>
            </tr>
            <tr>
              <td style="border: none; padding: 0; height: 2px;" colspan="3"></td>
            </tr>
            <tr>
              <td style="border: none; padding: 1px 2px;" colspan="2">
              </td>
              <td style="border: none; padding: 1px 2px; text-align: right; color: #FF0000;">
                ★仓库接收
              </td>
            </tr>
          </table>

          <!-- Main table -->
          <table class="dn-table">
              <colgroup>
                <col style="width: 95px" />
                <col style="width: 140px" />
                <col style="width: 85px" />
                <col style="width: 85px" />
                <col style="width: 45px" />
                <col style="width: 25px" />
                <col style="width: 25px" />
              </colgroup>
            <tbody>
            <!-- Supplier and project info -->
            <tr>
              <td class="dn-field-label">供货单位</td>
              <td class="dn-field-value">${deliveryForm.supplier}</td>
              <td class="dn-field-label" style="background-color: white;"><span style="color: #FF0000;">*</span>项目代号</td>
              <td class="dn-field-value" colspan="4">${deliveryForm.projectCode}</td>
            </tr>

            <!-- Part number and name -->
            <tr>
              <td class="dn-field-label">件&nbsp;&nbsp;号</td>
              <td class="dn-field-value">${deliveryForm.partNumber}</td>
              <td class="dn-field-label" style="background-color: white;"><span style="color: #FF0000;">*</span>名称/规格</td>
              <td class="dn-field-value" colspan="4">${deliveryForm.partName}</td>
            </tr>

            <!-- Price and quantity section -->
            <tr>
              <td class="dn-field-label" rowspan="2" style="background-color: white;"><span style="color: #FF0000;">*</span>单&nbsp;&nbsp;价</td>
              <td class="dn-field-value" rowspan="2">${deliveryForm.unitPrice || ''}</td>
              <td class="dn-field-label">单位</td>
              <td class="dn-field-value">${deliveryForm.unit}</td>
              <td class="dn-field-label">仓库</td>
              <td class="dn-field-label">单位</td>
              <td class="dn-field-value">${deliveryForm.warehouseUnit}</td>
            </tr>
            <tr>
              <td class="dn-field-label" style="background-color: white;"><span style="color: #FF0000;">*</span>数量</td>
              <td class="dn-field-value">${deliveryForm.quantity}</td>
              <td class="dn-field-label">实收</td>
              <td class="dn-field-label">数量</td>
              <td class="dn-field-value">${deliveryForm.receivedQuantity}</td>
            </tr>

            <!-- Inspection basis and method -->
            <tr>
              <td class="dn-field-label">检验依据</td>
              <td class="dn-field-value" colspan="2">${deliveryForm.inspectionBasis || ''}</td>
              <td class="dn-field-label">检验方式</td>
              <td class="dn-field-value" colspan="3">
                ${checkboxSymbol(deliveryForm.inspectionMethod.includes('逐证'))} 逐证&nbsp;
                ${checkboxSymbol(deliveryForm.inspectionMethod.includes('抽检'))} 抽检&nbsp;
                ${checkboxSymbol(deliveryForm.inspectionMethod.includes('全检'))} 全检
              </td>
            </tr>

            <!-- Inspection results -->
            <tr>
              <td class="dn-field-label">检验结果</td>
              <td class="dn-field-value" style="text-align: center; padding: 0; width: 80px;">
                <div style="font-weight: bold; padding: 1px; border-bottom: 1px solid #000; font-size: 9px;">合格数</div>
                <div style="padding: 1px;">${deliveryForm.qualifiedQuantity || ''}</div>
              </td>
              <td class="dn-field-value" style="text-align: center; padding: 0; width: 80px;">
                <div style="font-weight: bold; padding: 1px; border-bottom: 1px solid #000; font-size: 9px;">不合格数</div>
                <div style="padding: 1px;">${deliveryForm.unqualifiedQuantity || ''}</div>
              </td>
              <td class="dn-field-label" style="font-size: 9px;">检验部门<br/>意见:</td>
              <td class="dn-field-value" colspan="3">${deliveryForm.inspectionComment}</td>
            </tr>

            <!-- Signatures -->
            <tr>
              <td class="dn-signature-label" rowspan="2" style="background-color: white;"><span style="color: #FF0000;">*</span>采购</td>
              <td class="dn-signature-value">${deliveryForm.procurementSignature}</td>
              <td class="dn-signature-label">检验</td>
              <td class="dn-signature-value">${deliveryForm.inspectionSignature}</td>
              <td class="dn-signature-label">仓库</td>
              <td class="dn-signature-value" colspan="2">${deliveryForm.warehouseSignature}</td>
            </tr>
            <tr>
              <td class="dn-date-cell">${formatPrintDate(deliveryForm.procurementDate)}</td>
              <td class="dn-signature-label">签署</td>
              <td class="dn-date-cell">${formatPrintDate(deliveryForm.inspectionDate || '')}</td>
              <td class="dn-signature-label">签署</td>
              <td class="dn-date-cell" colspan="2">${formatPrintDate(deliveryForm.warehouseDate || '')}</td>
            </tr>
            </tbody>
          </table>

          <!-- Footer -->
          <div class="dn-footer">
            说明：一、检验留存（白色），二、仓库留存（浅红），三、采购留存（蓝色），四、供货留存（黄色）
          </div>
        </div>
      </body>
    </html>
  `)

  printWindow.document.close()
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

const getTransactionTagType = (type: string): string => {
  return type === 'SalesOut' ? 'danger' : 'success'
}

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    SalesOut: '销售出库',
    ProductionOut: '生产领料',
    OutsourceOut: '委外发料',
    AdjustmentOut: '调整出库',
  }
  return labels[type] || type
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

const formatDateTime = (dateString: string): string => {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* Delivery Note Styles */
.delivery-note {
  border: 2px solid #000;
  padding: 15px;
  background: white;
}

.dn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  position: relative;
}

.dn-star {
  color: #000;
  font-size: 18px;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.dn-seb {
  color: #000;
  font-size: 14px;
  font-weight: bold;
  margin-left: 25px;
}

.dn-title {
  flex: 1;
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  margin: 0;
  letter-spacing: 2px;
}

.dn-header-right {
  position: absolute;
  right: 0;
}

.dn-subheader {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
}

.dn-attachment {
  color: #0000FF;
  font-weight: bold;
}

.dn-warehouse-check {
  color: #FF0000;
  font-weight: bold;
}

.dn-date-number {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.dn-date,
.dn-number {
  display: flex;
  align-items: center;
}

.dn-label {
  font-weight: bold;
  margin-right: 8px;
  font-size: 14px;
}

.dn-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  border: 1px solid #000;
  table-layout: fixed;
}

.dn-table td {
  border: 1px solid #000;
  padding: 4px;
  font-size: 11px;
  word-wrap: break-word;
  overflow: hidden;
}

.dn-field-label {
  font-weight: bold;
  text-align: center;
  background-color: #f0f0f0;
  color: #0000FF;
  min-width: 70px;
  font-size: 10px;
}

.dn-field-value {
  padding: 3px 4px;
  font-size: 11px;
}

.dn-sub-label {
  font-weight: bold;
  text-align: center;
  color: #FF0000;
  padding: 3px;
  font-size: 10px;
}

.dn-sub-value {
  text-align: center;
  padding: 3px;
}

.dn-signature-label {
  font-weight: bold;
  text-align: center;
  color: #0000FF;
  padding: 3px;
  font-size: 10px;
}

.dn-signature-value {
  padding: 3px 4px;
}

.dn-date-field {
  padding: 3px 4px;
}

.dn-inspection-label {
  writing-mode: vertical-rl;
  text-align: center;
  font-weight: bold;
  padding: 4px;
  background-color: #f0f0f0;
}

.dn-dash {
  text-align: center;
  padding: 4px;
  font-size: 16px;
}

.dn-vertical-date {
  writing-mode: vertical-rl;
  text-align: center;
  padding: 4px 2px;
  font-size: 10px;
  line-height: 1.4;
}

.dn-footer {
  font-size: 11px;
  color: #666;
  margin-top: 10px;
  padding: 5px;
  background-color: #f9f9f9;
  border: 1px dashed #ccc;
}

@media print {
  .delivery-note {
    border: 2px solid #000;
    page-break-inside: avoid;
  }
}
</style>
