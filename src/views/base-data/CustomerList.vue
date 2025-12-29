<template>
  <div class="customer-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>客户管理</span>
          <el-button type="primary" @click="showDialog = true">
            <el-icon><Plus /></el-icon>
            新增客户
          </el-button>
        </div>
      </template>

      <el-table :data="customers" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="contactPerson" label="联系人" />
        <el-table-column prop="phone" label="电话" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="address" label="地址" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="editCustomer(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteCustomer(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchCustomers"
        @current-change="fetchCustomers"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="showDialog"
      :title="editingCustomer ? '编辑客户' : '新增客户'"
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { baseDataApi } from '@/api'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const showDialog = ref(false)
const customers = ref([])
const editingCustomer = ref<any>(null)
const formRef = ref<FormInstance>()

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const form = reactive({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话号码', trigger: 'blur' }],
}

const fetchCustomers = async () => {
  loading.value = true
  try {
    const response = await baseDataApi.getCustomers({
      page: currentPage.value,
      limit: pageSize.value,
    })
    customers.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('Failed to fetch customers:', error)
  } finally {
    loading.value = false
  }
}

const editCustomer = (customer: any) => {
  editingCustomer.value = customer
  Object.assign(form, customer)
  showDialog.value = true
}

const deleteCustomer = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该客户吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await baseDataApi.deleteCustomer(id)
    ElMessage.success('客户删除成功')
    fetchCustomers()
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
        if (editingCustomer.value) {
          await baseDataApi.updateCustomer(editingCustomer.value.id, form)
          ElMessage.success('客户更新成功')
        } else {
          await baseDataApi.createCustomer(form)
          ElMessage.success('客户创建成功')
        }
        showDialog.value = false
        resetForm()
        fetchCustomers()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const resetForm = () => {
  editingCustomer.value = null
  Object.assign(form, {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
.customer-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
