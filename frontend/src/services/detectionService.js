/**
 * Detection service
 */
import api from './api'

export const detectionService = {
  // Image detection
  detectImage: async (formData) => {
    const response = await api.post('/detect/image/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  
  // Video detection
  detectVideo: async (formData) => {
    const response = await api.post('/detect/video/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  
  // Check task status
  checkTaskStatus: async (taskId) => {
    const response = await api.get(`/detect/status/${taskId}/`)
    return response.data
  },
  
  // Get sessions
  getSessions: async () => {
    const response = await api.get('/detect/sessions/')
    return response.data
  },
  
  // Get session detail
  getSession: async (sessionId) => {
    const response = await api.get(`/detect/sessions/${sessionId}/`)
    return response.data
  },
  
  // Get alerts
  getAlerts: async () => {
    const response = await api.get('/detect/alerts/')
    return response.data
  },
  
  // Acknowledge alert
  acknowledgeAlert: async (alertId) => {
    const response = await api.patch(`/detect/alerts/${alertId}/acknowledge/`)
    return response.data
  },
  
  // Dashboard stats
  getDashboardStats: async (days = 7) => {
    const response = await api.get(`/detect/dashboard/stats/?days=${days}`)
    return response.data
  },
}
