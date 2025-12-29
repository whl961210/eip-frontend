import apiClient from './axios'

export const ordersApi = {
  // Orders
  createOrder(data: any) {
    return apiClient.post('/orders', data)
  },

  getOrders(params?: any) {
    return apiClient.get('/orders', { params })
  },

  getOrder(id: number) {
    return apiClient.get(`/orders/${id}`)
  },

  updateOrder(id: number, data: any) {
    return apiClient.put(`/orders/${id}`, data)
  },

  updateOrderStatus(id: number, status: string) {
    return apiClient.put(`/orders/${id}/status`, { status })
  },

  // Projects
  getProjects(params?: any) {
    return apiClient.get('/projects', { params })
  },

  getProject(id: number) {
    return apiClient.get(`/projects/${id}`)
  },

  getProjectByNumber(projectNumber: string) {
    return apiClient.get(`/projects/number/${projectNumber}`)
  },

  updateProjectStatus(id: number, status: string) {
    return apiClient.put(`/projects/${id}/status`, { status })
  },
}
