<template>
  <div class="material-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Material Management</span>
          <el-button type="primary" @click="showDialog = true">
            <el-icon><Plus /></el-icon>
            Add Material
          </el-button>
        </div>
      </template>

      <el-table :data="materials" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="code" label="Code" width="120" />
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column label="Type" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'RawMaterial' ? 'info' : 'success'">
              {{ row.type === 'RawMaterial' ? '原材料' : '成品' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="Category" width="120" />
        <el-table-column prop="spec" label="Specification" width="150" />
        <el-table-column prop="unit" label="Unit" width="80" />
        <el-table-column prop="unitPrice" label="Unit Price" width="100" />
        <el-table-column prop="description" label="Description" show-overflow-tooltip />
        <el-table-column label="Actions" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="editMaterial(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="deleteMaterial(row.id)">
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
      :title="editingMaterial ? 'Edit Material' : 'Add Material'"
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Code" prop="code">
          <el-input v-model="form.code" placeholder="Material code" />
        </el-form-item>
        <el-form-item label="Type" prop="type">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="原材料 (Raw Material)" value="RawMaterial" />
            <el-option label="成品 (Finished Good)" value="FinishedGood" />
          </el-select>
        </el-form-item>
        <el-form-item label="Category">
          <el-input v-model="form.category" placeholder="e.g., Electronics, Metal" />
        </el-form-item>
        <el-form-item label="Specification">
          <el-input v-model="form.spec" />
        </el-form-item>
        <el-form-item label="Unit" prop="unit">
          <el-input v-model="form.unit" placeholder="e.g., kg, pcs, m" />
        </el-form-item>
        <el-form-item label="Unit Price">
          <el-input-number v-model="form.unitPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
const materials = ref([])
const editingMaterial = ref<any>(null)
const formRef = ref<FormInstance>()

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const form = reactive({
  name: '',
  code: '',
  type: 'RawMaterial',
  category: '',
  spec: '',
  unit: '',
  unitPrice: 0,
  description: '',
})

const rules: FormRules = {
  name: [{ required: true, message: 'Please enter material name', trigger: 'blur' }],
  type: [{ required: true, message: 'Please select material type', trigger: 'change' }],
  unit: [{ required: true, message: 'Please enter unit', trigger: 'blur' }],
}

const fetchMaterials = async () => {
  loading.value = true
  try {
    const response = await baseDataApi.getMaterials({
      page: currentPage.value,
      limit: pageSize.value,
    })
    // Axios interceptor already unwraps response.data, so response is the backend data directly
    materials.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('Failed to fetch materials:', error)
  } finally {
    loading.value = false
  }
}

// Watch for pagination changes (must be after fetchMaterials is defined)
watch([currentPage, pageSize], () => {
  fetchMaterials()
})

const editMaterial = (material: any) => {
  editingMaterial.value = material
  Object.assign(form, material)
  showDialog.value = true
}

const deleteMaterial = async (id: number) => {
  try {
    await ElMessageBox.confirm('Are you sure to delete this material?', 'Warning', {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    })
    await baseDataApi.deleteMaterial(id)
    ElMessage.success('Material deleted successfully')
    fetchMaterials()
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
        if (editingMaterial.value) {
          await baseDataApi.updateMaterial(editingMaterial.value.id, form)
          ElMessage.success('Material updated successfully')
        } else {
          await baseDataApi.createMaterial(form)
          ElMessage.success('Material created successfully')
        }
        showDialog.value = false
        resetForm()
        fetchMaterials()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Operation failed')
      } finally {
        submitting.value = false
      }
    }
  })
}

const resetForm = () => {
  editingMaterial.value = null
  Object.assign(form, {
    name: '',
    code: '',
    type: 'RawMaterial',
    category: '',
    spec: '',
    unit: '',
    unitPrice: 0,
    description: '',
  })
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchMaterials()
})
</script>

<style scoped>
.material-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
