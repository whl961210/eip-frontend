import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productionApi } from '@/api'
import { ElMessage } from 'element-plus'

export const useProductionStore = defineStore('production', () => {
  const productionTasks = ref<any[]>([])
  const currentTask = ref<any>(null)
  const loading = ref(false)
  const total = ref(0)

  const fetchProductionTasks = async (params?: any) => {
    loading.value = true
    try {
      const response = await productionApi.getProductionTasks(params)
      productionTasks.value = response.data
      total.value = response.total
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to fetch production tasks')
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchProductionTask = async (id: number) => {
    loading.value = true
    try {
      const response = await productionApi.getProductionTask(id)
      currentTask.value = response
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to fetch production task')
      return null
    } finally {
      loading.value = false
    }
  }

  const scheduleProduction = async (data: { projectId: number; processTemplateId: number }) => {
    loading.value = true
    try {
      const response = await productionApi.scheduleProduction(data)
      ElMessage.success('Production scheduled successfully')
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to schedule production')
      return null
    } finally {
      loading.value = false
    }
  }

  const reportWork = async (data: any) => {
    loading.value = true
    try {
      const response = await productionApi.reportWork(data)
      ElMessage.success('Work reported successfully')
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to report work')
      return null
    } finally {
      loading.value = false
    }
  }

  const assignTask = async (id: number, assignedTo: string) => {
    loading.value = true
    try {
      const response = await productionApi.assignTask(id, { assignedTo })
      ElMessage.success('Task assigned successfully')
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to assign task')
      return null
    } finally {
      loading.value = false
    }
  }

  const updateTaskStatus = async (id: number, status: string) => {
    loading.value = true
    try {
      const response = await productionApi.updateTaskStatus(id, { status })
      ElMessage.success('Task status updated')
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to update task status')
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    productionTasks,
    currentTask,
    loading,
    total,
    fetchProductionTasks,
    fetchProductionTask,
    scheduleProduction,
    reportWork,
    assignTask,
    updateTaskStatus,
  }
})
