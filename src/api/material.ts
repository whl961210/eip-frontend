import apiClient from './axios'

export const materialApi = {
  // Get materials list (alias for consistency)
  getList(params?: any) {
    return apiClient.get('/materials', { params })
  },

  // Get single material
  get(id: number) {
    return apiClient.get(`/materials/${id}`)
  },

  // Create material
  create(data: any) {
    return apiClient.post('/materials', data)
  },

  // Update material
  update(id: number, data: any) {
    return apiClient.put(`/materials/${id}`, data)
  },

  // Delete material
  delete(id: number) {
    return apiClient.delete(`/materials/${id}`)
  },
}
