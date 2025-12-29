import apiClient from './axios'

export const productionApi = {
  // Schedule Production
  scheduleProduction(data: { projectId: number; processTemplateId: number }) {
    return apiClient.post('/production/schedule', data)
  },

  // Report Work
  reportWork(data: any) {
    return apiClient.post('/production/report', data)
  },

  // Query Production Tasks
  getProductionTasks(params?: any) {
    return apiClient.get('/production/tasks', { params })
  },

  getProductionTask(id: number) {
    return apiClient.get(`/production/tasks/${id}`)
  },

  // Assign Task
  assignTask(id: number, data: { assignedTo: string }) {
    return apiClient.put(`/production/tasks/${id}/assign`, data)
  },

  // Update Task Status
  updateTaskStatus(id: number, data: { status: string }) {
    return apiClient.put(`/production/tasks/${id}/status`, data)
  },
}
