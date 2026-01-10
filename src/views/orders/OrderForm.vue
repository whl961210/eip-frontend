<template>
  <div class="order-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新建订单</span>
          <el-button @click="router.back()">返回</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户" prop="customerId">
              <el-select
                v-model="form.customerId"
                placeholder="请选择客户"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="customer in customers"
                  :key="customer.id"
                  :label="customer.name"
                  :value="customer.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="订单日期" prop="orderDate">
              <el-date-picker
                v-model="form.orderDate"
                type="date"
                placeholder="选择订单日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="内部编号">
              <el-input
                v-model="form.internalReference"
                placeholder="请输入内部编号"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交货日期" prop="deliveryDate">
              <el-date-picker
                v-model="form.deliveryDate"
                type="date"
                placeholder="选择交货日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">订单明细</el-divider>

        <el-form-item>
          <el-table :data="form.orderItems" border style="width: 100%">
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column label="零件名称" width="180">
              <template #default="{ row }">
                <el-input v-model="row.partName" placeholder="请输入零件名称" />
              </template>
            </el-table-column>
            <el-table-column label="图号/规格" width="180">
              <template #default="{ row }">
                <el-input v-model="row.partSpec" placeholder="请输入图号或规格" />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="120">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :step="1"
                  @change="calculateItemTotal(row)"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.unitPrice"
                  :min="0"
                  :precision="2"
                  :step="0.01"
                  @change="calculateItemTotal(row)"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="总价" width="120">
              <template #default="{ row }">
                <span>{{ row.totalPrice.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.notes" placeholder="备注" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button
                  size="small"
                  type="danger"
                  @click="removeItem($index)"
                  :disabled="form.orderItems.length === 1"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="addItem">
            <el-icon><Plus /></el-icon>
            添加明细
          </el-button>
          <el-button type="success" @click="showImportDialog = true" style="margin-left: 10px">
            <el-icon><Upload /></el-icon>
            导入Excel
          </el-button>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12" :offset="12">
            <el-form-item label="订单总金额" label-width="120px">
              <el-input :value="totalAmount.toFixed(2)" readonly>
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="4" placeholder="订单备注" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" size="large">
            提交订单
          </el-button>
          <el-button @click="router.back()" size="large">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Excel Import Dialog -->
    <el-dialog v-model="showImportDialog" title="导入Excel" width="700px">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".xlsx,.xls"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持 .xlsx 或 .xls 文件</div>
        </template>
      </el-upload>

      <div v-if="excelColumns.length > 0" style="margin-top: 20px">
        <el-divider content-position="left">列映射</el-divider>
        <el-form label-width="120px">
          <el-form-item label="零件名称">
            <el-select v-model="columnMapping.partName" placeholder="选择Excel列" clearable>
              <el-option
                v-for="col in excelColumns"
                :key="col"
                :label="col"
                :value="col"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="图号/规格">
            <el-select v-model="columnMapping.partSpec" placeholder="选择Excel列" clearable>
              <el-option
                v-for="col in excelColumns"
                :key="col"
                :label="col"
                :value="col"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="数量">
            <el-select v-model="columnMapping.quantity" placeholder="选择Excel列" clearable>
              <el-option
                v-for="col in excelColumns"
                :key="col"
                :label="col"
                :value="col"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="单价">
            <el-select v-model="columnMapping.unitPrice" placeholder="选择Excel列" clearable>
              <el-option
                v-for="col in excelColumns"
                :key="col"
                :label="col"
                :value="col"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-select v-model="columnMapping.notes" placeholder="选择Excel列（可选）" clearable>
              <el-option
                v-for="col in excelColumns"
                :key="col"
                :label="col"
                :value="col"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <el-alert
          v-if="previewData.length > 0"
          title="预览前5条数据"
          type="info"
          :closable="false"
          style="margin-bottom: 10px"
        />
        <el-table v-if="previewData.length > 0" :data="previewData.slice(0, 5)" border>
          <el-table-column prop="partName" label="零件名称" />
          <el-table-column prop="partSpec" label="图号/规格" />
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column prop="unitPrice" label="单价" width="100" />
          <el-table-column prop="notes" label="备注" />
        </el-table>
      </div>

      <template #footer>
        <el-button @click="cancelImport">取消</el-button>
        <el-button
          type="primary"
          @click="confirmImport"
          :disabled="!canImport"
        >
          确认导入 ({{ previewData.length }} 条)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { baseDataApi, ordersApi } from '@/api'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Upload, UploadFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const customers = ref<any[]>([])

// Excel Import
const showImportDialog = ref(false)
const uploadRef = ref()
const excelData = ref<any[]>([])
const excelColumns = ref<string[]>([])
const previewData = ref<any[]>([])
const columnMapping = reactive({
  partName: '',
  partSpec: '',
  quantity: '',
  unitPrice: '',
  notes: '',
})

interface OrderItem {
  partName: string
  partSpec: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes: string
}

const form = reactive({
  customerId: null as number | null,
  internalReference: '',
  orderDate: new Date().toISOString().split('T')[0],
  deliveryDate: '',
  notes: '',
  orderItems: [
    {
      partName: '',
      partSpec: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      notes: '',
    },
  ] as OrderItem[],
})

const rules: FormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  orderDate: [{ required: true, message: '请选择订单日期', trigger: 'change' }],
  deliveryDate: [{ required: true, message: '请选择交货日期', trigger: 'change' }],
}

const totalAmount = computed(() => {
  return form.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
})

const calculateItemTotal = (item: OrderItem) => {
  item.totalPrice = item.quantity * item.unitPrice
}

const addItem = () => {
  form.orderItems.push({
    partName: '',
    partSpec: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    notes: '',
  })
}

const removeItem = (index: number) => {
  if (form.orderItems.length > 1) {
    form.orderItems.splice(index, 1)
  }
}

const fetchCustomers = async () => {
  try {
    const response = await baseDataApi.getCustomers({ page: 1, limit: 1000 })
    customers.value = response.data
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    ElMessage.error('加载客户列表失败')
  }
}

const validateOrderItems = () => {
  for (let i = 0; i < form.orderItems.length; i++) {
    const item = form.orderItems[i]
    if (!item.partName.trim()) {
      ElMessage.error(`请填写第${i + 1}行的零件名称`)
      return false
    }
    if (!item.partSpec.trim()) {
      ElMessage.error(`请填写第${i + 1}行的图号/规格`)
      return false
    }
    if (item.quantity <= 0) {
      ElMessage.error(`第${i + 1}行的数量必须大于0`)
      return false
    }
    if (item.unitPrice <= 0) {
      ElMessage.error(`第${i + 1}行的单价必须大于0`)
      return false
    }
  }
  return true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid && validateOrderItems()) {
      submitting.value = true
      try {
        const orderData = {
          customerId: form.customerId,
          internalReference: form.internalReference,
          orderDate: form.orderDate,
          deliveryDate: form.deliveryDate,
          totalAmount: totalAmount.value,
          notes: form.notes,
          orderItems: form.orderItems.map((item) => ({
            partName: item.partName,
            partSpec: item.partSpec,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes,
          })),
        }

        await ordersApi.createOrder(orderData)
        ElMessage.success('订单创建成功')
        router.push('/orders')
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '订单创建失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// Excel Import Functions
const canImport = computed(() => {
  return (
    columnMapping.partName &&
    columnMapping.partSpec &&
    columnMapping.quantity &&
    columnMapping.unitPrice &&
    previewData.value.length > 0
  )
})

const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e: any) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length < 2) {
        ElMessage.error('Excel文件数据不足')
        return
      }

      // Get columns from first row
      const headers = jsonData[0] as string[]
      excelColumns.value = headers.filter((h) => h && h.trim())

      // Store raw data
      excelData.value = jsonData.slice(1).filter((row: any) => {
        return row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
      })

      // Try to auto-map columns based on common names
      autoMapColumns(headers)

      ElMessage.success('Excel文件读取成功')
    } catch (error) {
      console.error('Failed to parse Excel:', error)
      ElMessage.error('Excel文件解析失败')
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

const autoMapColumns = (headers: string[]) => {
  headers.forEach((header, index) => {
    const h = header.trim()
    // Auto-map based on common Chinese column names
    if (h.includes('名称') || h === '名称') {
      columnMapping.partName = header
    } else if (h.includes('规格') || h.includes('型号') || h === '规格型号') {
      columnMapping.partSpec = header
    } else if (h.includes('数量') || h === '数量') {
      columnMapping.quantity = header
    } else if (h.includes('单价') || h === '单价') {
      columnMapping.unitPrice = header
    } else if (h.includes('备注') || h === '备注') {
      columnMapping.notes = header
    }
  })
}

const updatePreview = () => {
  if (!columnMapping.partName || !columnMapping.partSpec || !columnMapping.quantity || !columnMapping.unitPrice) {
    previewData.value = []
    return
  }

  const headerRow = excelColumns.value
  const nameIndex = headerRow.indexOf(columnMapping.partName)
  const specIndex = headerRow.indexOf(columnMapping.partSpec)
  const qtyIndex = headerRow.indexOf(columnMapping.quantity)
  const priceIndex = headerRow.indexOf(columnMapping.unitPrice)
  const notesIndex = columnMapping.notes ? headerRow.indexOf(columnMapping.notes) : -1

  previewData.value = excelData.value
    .map((row: any) => {
      const quantity = parseFloat(row[qtyIndex]) || 0
      const unitPrice = parseFloat(row[priceIndex]) || 0

      return {
        partName: row[nameIndex] || '',
        partSpec: row[specIndex] || '',
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        notes: notesIndex >= 0 ? row[notesIndex] || '' : '',
      }
    })
    .filter((item: any) => item.partName && item.partSpec)
}

const confirmImport = () => {
  if (!canImport.value) {
    ElMessage.warning('请完成必填列的映射')
    return
  }

  updatePreview()

  if (previewData.value.length === 0) {
    ElMessage.error('没有可导入的有效数据')
    return
  }

  // Replace current order items with imported data
  form.orderItems = previewData.value.map((item) => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice,
  }))

  ElMessage.success(`成功导入 ${form.orderItems.length} 条订单明细`)
  cancelImport()
}

const cancelImport = () => {
  showImportDialog.value = false
  excelData.value = []
  excelColumns.value = []
  previewData.value = []
  columnMapping.partName = ''
  columnMapping.partSpec = ''
  columnMapping.quantity = ''
  columnMapping.unitPrice = ''
  columnMapping.notes = ''
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// Watch column mapping changes to update preview
watch(
  () => [
    columnMapping.partName,
    columnMapping.partSpec,
    columnMapping.quantity,
    columnMapping.unitPrice,
    columnMapping.notes,
  ],
  () => {
    if (excelData.value.length > 0) {
      updatePreview()
    }
  }
)

onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
.order-form {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-table .el-input-number) {
  width: 100%;
}

:deep(.el-table .el-input__inner) {
  text-align: left;
}

.el-icon--upload {
  font-size: 67px;
  color: #c0c4cc;
  margin: 40px 0 16px;
  line-height: 50px;
}

.el-upload__text {
  color: #606266;
  font-size: 14px;
  text-align: center;
}

.el-upload__text em {
  color: #409eff;
  font-style: normal;
}
</style>
