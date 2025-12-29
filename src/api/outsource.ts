import apiClient from './axios'

export const outsourceApi = {
  // Get Pending Tasks
  getPendingTasks(params?: any) {
    return apiClient.get('/outsource/pending-tasks', { params })
  },

  // Outsource Orders
  createOutsourceOrder(data: any) {
    return apiClient.post('/outsource/orders', data)
  },

  getOutsourceOrders(params?: any) {
    return apiClient.get('/outsource/orders', { params })
  },

  getOutsourceOrder(id: number) {
    return apiClient.get(`/outsource/orders/${id}`)
  },

  // Receive from Supplier
  receiveFromSupplier(id: number) {
    return apiClient.put(`/outsource/orders/${id}/receive`)
  },

  updateOutsourceOrderStatus(id: number, data: { status: string }) {
    return apiClient.put(`/outsource/orders/${id}/status`, data)
  },
}
