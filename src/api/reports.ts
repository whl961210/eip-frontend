import apiClient from './axios'

export const reportsApi = {
  // Daily Order Status
  getOrderStatus(params: { date: string }) {
    return apiClient.get('/reports/order-status', { params })
  },

  // Monthly Sales Report
  getMonthlySales(params: { year: number; month: number }) {
    return apiClient.get('/reports/monthly-sales', { params })
  },

  // Project Traceability (CORE)
  getProjectTraceability(projectId: number) {
    return apiClient.get(`/reports/project-traceability/${projectId}`)
  },

  // Production Progress Dashboard
  getProductionProgress() {
    return apiClient.get('/reports/production-progress')
  },

  // Custom Reports
  getCustomReport(params?: any) {
    return apiClient.get('/reports/custom', { params })
  },
}
