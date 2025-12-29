import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ordersApi } from '@/api'
import { ElMessage } from 'element-plus'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<any[]>([])
  const projects = ref<any[]>([])
  const currentOrder = ref<any>(null)
  const currentProject = ref<any>(null)
  const loading = ref(false)
  const total = ref(0)

  const fetchOrders = async (params?: any) => {
    loading.value = true
    try {
      const response = await ordersApi.getOrders(params)
      orders.value = response.data
      total.value = response.total
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to fetch orders')
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchOrder = async (id: number) => {
    loading.value = true
    try {
      const response = await ordersApi.getOrder(id)
      currentOrder.value = response
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to fetch order')
      return null
    } finally {
      loading.value = false
    }
  }

  const createOrder = async (data: any) => {
    loading.value = true
    try {
      const response = await ordersApi.createOrder(data)
      ElMessage.success('Order created successfully')
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to create order')
      return null
    } finally {
      loading.value = false
    }
  }

  const updateOrderStatus = async (id: number, status: string) => {
    loading.value = true
    try {
      const response = await ordersApi.updateOrderStatus(id, status)
      ElMessage.success('Order status updated')
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to update order status')
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchProjects = async (params?: any) => {
    loading.value = true
    try {
      const response = await ordersApi.getProjects(params)
      projects.value = response.data
      total.value = response.total
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to fetch projects')
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchProject = async (id: number) => {
    loading.value = true
    try {
      const response = await ordersApi.getProject(id)
      currentProject.value = response
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to fetch project')
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchProjectByNumber = async (projectNumber: string) => {
    loading.value = true
    try {
      const response = await ordersApi.getProjectByNumber(projectNumber)
      currentProject.value = response
      return response
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Failed to fetch project')
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    orders,
    projects,
    currentOrder,
    currentProject,
    loading,
    total,
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrderStatus,
    fetchProjects,
    fetchProject,
    fetchProjectByNumber,
  }
})
