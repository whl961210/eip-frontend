import apiClient from './axios'

export const baseDataApi = {
  // Customers
  createCustomer(data: any) {
    return apiClient.post('/customers', data)
  },

  getCustomers(params?: any) {
    return apiClient.get('/customers', { params })
  },

  getCustomer(id: number) {
    return apiClient.get(`/customers/${id}`)
  },

  updateCustomer(id: number, data: any) {
    return apiClient.put(`/customers/${id}`, data)
  },

  deleteCustomer(id: number) {
    return apiClient.delete(`/customers/${id}`)
  },

  // Suppliers
  createSupplier(data: any) {
    return apiClient.post('/suppliers', data)
  },

  getSuppliers(params?: any) {
    return apiClient.get('/suppliers', { params })
  },

  getSupplier(id: number) {
    return apiClient.get(`/suppliers/${id}`)
  },

  updateSupplier(id: number, data: any) {
    return apiClient.put(`/suppliers/${id}`, data)
  },

  deleteSupplier(id: number) {
    return apiClient.delete(`/suppliers/${id}`)
  },

  // Materials
  createMaterial(data: any) {
    return apiClient.post('/materials', data)
  },

  getMaterials(params?: any) {
    return apiClient.get('/materials', { params })
  },

  getMaterial(id: number) {
    return apiClient.get(`/materials/${id}`)
  },

  updateMaterial(id: number, data: any) {
    return apiClient.put(`/materials/${id}`, data)
  },

  deleteMaterial(id: number) {
    return apiClient.delete(`/materials/${id}`)
  },
}
