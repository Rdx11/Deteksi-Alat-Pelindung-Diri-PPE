/**
 * Authentication service
 */
import api from './api'

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password })
    return response.data
  },
  
  register: async (username, email, password) => {
    const response = await api.post('/auth/register/', { username, email, password })
    return response.data
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me/')
    return response.data
  },
}
