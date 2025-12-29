<template>
  <div class="supplier-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Supplier Management</span>
          <el-button type="primary" @click="showDialog = true">
            <el-icon><Plus /></el-icon>
            Add Supplier
          </el-button>
        </div>
      </template>

      <el-table :data="suppliers" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="Name" />
        <el-table-column prop="type" label="Type" />
        <el-table-column prop="contactPerson" label="Contact Person" />
        <el-table-column prop="phone" label="Phone" />
        <el-table-column prop="email" label="Email" />
        <el-table-column label="Actions" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="editSupplier(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="deleteSupplier(row.id)">
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="(page) => currentPage = page"
        @size-change="(size) => pageSize = size"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="showDialog"
      :title="editingSupplier ? 'Edit Supplier' : 'Add Supplier'"
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Type" prop="type">
          <el-select v-model="form.type" placeholder="Select supplier type">
            <el-option label="Material" value="material" />
            <el-option label="Outsource" value="outsource" />
            <el-option label="Both" value="both" />
          </el-select>
        </el-form-item>
        <el-form-item label="Contact Person" prop="contactPerson">
          <el-input v-model="form.contactPerson" />
        </el-form-item>
        <el-form-item label="Phone" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="Address" prop="address">
          <el-input v-model="form.address" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="Notes">
          <el-input v-model="form.notes" type="textarea" rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          Submit
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { baseDataApi } from '@/api'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const showDialog = ref(false)
const suppliers = ref([])
const editingSupplier = ref<any>(null)
const formRef = ref<FormInstance>()

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const form = reactive({
  name: '',
  type: 'material',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})

const rules: FormRules = {
  name: [{ required: true, message: 'Please enter supplier name', trigger: 'blur' }],
  type: [{ required: true, message: 'Please select supplier type', trigger: 'change' }],
  phone: [{ required: true, message: 'Please enter phone number', trigger: 'blur' }],
}

const fetchSuppliers = async () => {
  loading.value = true
  try {
    const response = await baseDataApi.getSuppliers({
      page: currentPage.value,
      limit: pageSize.value,
    })
    suppliers.value = response.data.data
    total.value = response.data.total
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
  } finally {
    loading.value = false
  }
}

// Watch for pagination changes (must be after fetchSuppliers is defined)
watch([currentPage, pageSize], () => {
  fetchSuppliers()
})

const editSupplier = (supplier: any) => {
  editingSupplier.value = supplier
  Object.assign(form, supplier)
  showDialog.value = true
}

const deleteSupplier = async (id: number) => {
  try {
    await ElMessageBox.confirm('Are you sure to delete this supplier?', 'Warning', {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    })
    await baseDataApi.deleteSupplier(id)
    ElMessage.success('Supplier deleted successfully')
    fetchSuppliers()
  } catch (error) {
    // User cancelled or error occurred
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (editingSupplier.value) {
          await baseDataApi.updateSupplier(editingSupplier.value.id, form)
          ElMessage.success('Supplier updated successfully')
        } else {
          await baseDataApi.createSupplier(form)
          ElMessage.success('Supplier created successfully')
        }
        showDialog.value = false
        resetForm()
        fetchSuppliers()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Operation failed')
      } finally {
        submitting.value = false
      }
    }
  })
}

const resetForm = () => {
  editingSupplier.value = null
  Object.assign(form, {
    name: '',
    type: 'material',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchSuppliers()
})
</script>

<style scoped>
.supplier-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
