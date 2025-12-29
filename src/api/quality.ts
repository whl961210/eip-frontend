import apiClient from './axios'

export const qualityApi = {
  // Get Pending Inspections
  getPendingInspections(params?: any) {
    return apiClient.get('/quality/pending-inspections', { params })
  },

  // Submit Inspection
  submitInspection(data: any) {
    return apiClient.post('/quality/inspect', data)
  },

  // Query Inspections
  getInspections(params?: any) {
    return apiClient.get('/quality/inspections', { params })
  },

  getInspection(id: number) {
    return apiClient.get(`/quality/inspections/${id}`)
  },

  // Get Inspections by Production Task
  getInspectionsByTask(productionTaskId: number) {
    return apiClient.get(`/quality/inspections/task/${productionTaskId}`)
  },
}
