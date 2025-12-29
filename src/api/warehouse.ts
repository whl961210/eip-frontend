import apiClient from './axios'

export const warehouseApi = {
  // Legacy single-item operations (backward compatibility)
  inbound(data: any) {
    return apiClient.post('/warehouse/inbound', data)
  },

  outbound(data: any) {
    return apiClient.post('/warehouse/outbound', data)
  },

  // Batch operations (recommended)
  createInbound(data: any) {
    return apiClient.post('/warehouse/inbound-batch', data)
  },

  createOutbound(data: any) {
    return apiClient.post('/warehouse/outbound-batch', data)
  },

  // Get pending order items for outbound
  getPendingOutboundOrders() {
    return apiClient.get('/warehouse/pending-outbound')
  },

  // Mark order items as inbound (simplified flow)
  markOrderItemsInbound(data: {
    orderItemIds: number[]
    operator?: string
    referenceNumber?: string
    notes?: string
  }) {
    // Use longer timeout for batch operations (5 minutes)
    return apiClient.post('/warehouse/mark-inbound', data, {
      timeout: 300000 // 5 minutes for large batch operations
    })
  },

  // Mark order items as outbound (simplified flow)
  markOrderItemsOutbound(data: {
    orderItemIds: number[]
    quantities?: number[]
    operator: string
    referenceNumber?: string
    notes?: string
  }) {
    // Use longer timeout for batch operations (5 minutes)
    return apiClient.post('/warehouse/mark-outbound', data, {
      timeout: 300000 // 5 minutes for large batch operations
    })
  },

  // Inventory Adjustment
  adjust(data: any) {
    return apiClient.post('/warehouse/adjust', data)
  },

  // Get Inventory Levels
  getInventory(params?: any) {
    return apiClient.get('/warehouse/inventory', { params })
  },

  getInventoryByMaterial(materialId: number) {
    return apiClient.get(`/warehouse/inventory/${materialId}`)
  },

  // Get Transaction History
  getTransactions(params?: any) {
    return apiClient.get('/warehouse/history', { params })
  },

  getTransactionsByProject(projectId: number) {
    return apiClient.get(`/warehouse/history/project/${projectId}`)
  },
}
