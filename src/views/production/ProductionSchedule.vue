<template>
  <div class="production-schedule">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>排产计划</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- Tab 1: Pending Projects -->
        <el-tab-pane label="待排产项目" name="pending">
          <el-table
            :data="pendingProjects"
            v-loading="loading"
            style="width: 100%"
            @row-click="selectProject"
          >
            <el-table-column prop="projectNumber" label="项目编号" width="150" />
            <el-table-column label="订单号" width="150">
              <template #default="{ row }">
                {{ row.order?.orderNumber }}
              </template>
            </el-table-column>
            <el-table-column label="客户" width="150">
              <template #default="{ row }">
                {{ row.order?.customer?.name }}
              </template>
            </el-table-column>
            <el-table-column label="交货日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.order?.deliveryDate) }}
              </template>
            </el-table-column>
            <el-table-column label="订单项数量" width="100" align="center">
              <template #default="{ row }">
                {{ row.order?.orderItems?.length || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="openScheduleDialog(row)">
                  排产
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchPendingProjects"
            @current-change="fetchPendingProjects"
            style="margin-top: 20px; justify-content: flex-end"
          />
        </el-tab-pane>

        <!-- Tab 2: Scheduled Projects -->
        <el-tab-pane label="已排产项目" name="scheduled">
          <el-table
            :data="scheduledProjects"
            v-loading="loadingScheduled"
            style="width: 100%"
          >
            <el-table-column prop="projectNumber" label="项目编号" width="150" />
            <el-table-column label="订单号" width="150">
              <template #default="{ row }">
                {{ row.order?.orderNumber }}
              </template>
            </el-table-column>
            <el-table-column label="客户" width="150">
              <template #default="{ row }">
                {{ row.order?.customer?.name }}
              </template>
            </el-table-column>
            <el-table-column label="开始日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.startDate) }}
              </template>
            </el-table-column>
            <el-table-column label="生产任务数" width="100" align="center">
              <template #default="{ row }">
                {{ row.productionTasks?.length || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button
                  size="small"
                  @click="router.push(`/production/tasks?projectId=${row.id}`)"
                >
                  查看任务
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="scheduledPage"
            v-model:page-size="scheduledPageSize"
            :total="scheduledTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchScheduledProjects"
            @current-change="fetchScheduledProjects"
            style="margin-top: 20px; justify-content: flex-end"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Schedule Production Dialog -->
    <el-dialog v-model="showScheduleDialog" title="排产" width="800px">
      <div v-if="selectedProject">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目编号">
            {{ selectedProject.projectNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="订单号">
            {{ selectedProject.order?.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="客户">
            {{ selectedProject.order?.customer?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="交货日期">
            {{ formatDate(selectedProject.order?.deliveryDate) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">订单明细</el-divider>

        <el-table :data="selectedProject.order?.orderItems" border style="width: 100%">
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column prop="partName" label="零件名称" />
          <el-table-column prop="partSpec" label="图号/规格" />
          <el-table-column prop="quantity" label="数量" width="100" align="center" />
        </el-table>

        <el-divider content-position="left">工艺路线</el-divider>

        <div style="margin-bottom: 15px">
          <el-button type="primary" @click="addCustomStep" size="small">
            <el-icon><Plus /></el-icon>
            添加工序
          </el-button>
        </div>

        <el-table :data="customSteps" border style="width: 100%">
          <el-table-column prop="stepNumber" label="步骤" width="80" align="center" />
          <el-table-column label="工序名称" min-width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="customSteps[$index].stepName"
                placeholder="请输入工序名称"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="类型" width="150">
            <template #default="{ row, $index }">
              <el-select
                v-model="customSteps[$index].stepType"
                placeholder="选择类型"
                size="small"
                style="width: 100%"
              >
                <el-option label="内制" value="InHouse" />
                <el-option label="委外" value="Outsource" />
                <el-option label="检验" value="Inspect" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="预计工时(小时)" width="150">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="customSteps[$index].estimatedTime"
                :min="0"
                size="small"
                controls-position="right"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                @click="removeCustomStep($index)"
                link
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="showScheduleDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSchedule"
          :loading="scheduling"
          :disabled="customSteps.length === 0"
        >
          确认排产
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi, productionApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeTab = ref('pending')
const loading = ref(false)
const loadingScheduled = ref(false)
const scheduling = ref(false)
const showScheduleDialog = ref(false)

const pendingProjects = ref<any[]>([])
const scheduledProjects = ref<any[]>([])
const selectedProject = ref<any>(null)
const customSteps = ref<any[]>([])

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const scheduledPage = ref(1)
const scheduledPageSize = ref(10)
const scheduledTotal = ref(0)

const scheduleForm = reactive({
  customSteps: [] as any[],
})

const scheduleFormRef = ref()

const formatDate = (date: any) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
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
    Pending: '待开始',
    InProgress: '进行中',
    Completed: '已完成',
    Cancelled: '已取消',
  }
  return statusMap[status] || status
}

const getTaskTypeTag = (type: string) => {
  const typeMap: Record<string, any> = {
    InHouse: '',
    Outsource: 'warning',
    Inspect: 'success',
  }
  return typeMap[type] || 'info'
}

const getTaskTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    InHouse: '内制',
    Outsource: '委外',
    Inspect: '检验',
  }
  return typeMap[type] || type
}

const fetchPendingProjects = async () => {
  loading.value = true
  try {
    const response = await ordersApi.getProjects({
      status: 'Pending',
      page: currentPage.value,
      limit: pageSize.value,
    })
    pendingProjects.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('Failed to fetch pending projects:', error)
    ElMessage.error('加载待排产项目失败')
  } finally {
    loading.value = false
  }
}

const fetchScheduledProjects = async () => {
  loadingScheduled.value = true
  try {
    const response = await ordersApi.getProjects({
      status: 'InProgress',
      page: scheduledPage.value,
      limit: scheduledPageSize.value,
    })
    scheduledProjects.value = response.data
    scheduledTotal.value = response.total
  } catch (error) {
    console.error('Failed to fetch scheduled projects:', error)
    ElMessage.error('加载已排产项目失败')
  } finally {
    loadingScheduled.value = false
  }
}

const addCustomStep = () => {
  const newStep = {
    stepNumber: customSteps.value.length + 1,
    stepName: '',
    stepType: 'InHouse',
    estimatedTime: 0,
  }
  customSteps.value.push(newStep)
}

const removeCustomStep = (index: number) => {
  customSteps.value.splice(index, 1)
  // Re-number the remaining steps
  customSteps.value.forEach((step, idx) => {
    step.stepNumber = idx + 1
  })
}

const selectProject = (row: any) => {
  selectedProject.value = row
}

const openScheduleDialog = async (project: any) => {
  selectedProject.value = project
  customSteps.value = []
  showScheduleDialog.value = true
}

const handleSchedule = async () => {
  if (!selectedProject.value || customSteps.value.length === 0) {
    ElMessage.warning('请添加工艺步骤')
    return
  }

  // Validate steps
  for (const step of customSteps.value) {
    if (!step.stepName) {
      ElMessage.warning('请填写所有工序名称')
      return
    }
  }

  scheduling.value = true
  try {
    const result = await productionApi.scheduleProduction({
      projectId: selectedProject.value.id,
      customSteps: customSteps.value,
    })

    ElMessage.success(
      `排产成功！已创建 ${result.tasksCreated} 个生产任务`
    )

    showScheduleDialog.value = false
    fetchPendingProjects()
    fetchScheduledProjects()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '排产失败')
  } finally {
    scheduling.value = false
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'scheduled' && scheduledProjects.value.length === 0) {
    fetchScheduledProjects()
  }
})

onMounted(() => {
  fetchPendingProjects()
})
</script>

<style scoped>
.production-schedule {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-descriptions) {
  margin-bottom: 20px;
}
</style>
