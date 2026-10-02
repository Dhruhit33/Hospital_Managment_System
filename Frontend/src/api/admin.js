import { api } from '@/lib/axios'

export const adminApi = {
  /**
   * Search / list patients
   * @param {{ name?: string, bloodGroup?: string, bornAfter?: string, page?: number, size?: number }} params
   */
  getPatients: async (params = {}) => {
    const response = await api.get('/admin/patients', { params })
    return response.data
  },

  /**
   * Onboard new doctor (must be existing signed-up user)
   * @param {{ userId: number, name: string, specialization: string, email: string }} data
   */
  onboardDoctor: async (data) => {
    const response = await api.post('/admin/onBoardNewDoctor', data)
    return response.data
  },

  /**
   * Admin dashboard metrics & aggregations
   */
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard')
    return response.data
  },

  /**
   * User directory
   * @param {{ role?: string, page?: number, size?: number }} params
   */
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  /**
   * Update user roles - sends raw array of strings
   * @param {number} userId
   * @param {string[]} roles
   */
  updateUserRoles: async (userId, roles) => {
    const response = await api.put(`/admin/users/${userId}/roles`, roles)
    return response.data
  },

  /**
   * Disable user account
   * @param {number} userId
   */
  disableUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/disable`)
    return response.data
  },

  /**
   * Enable user account
   * @param {number} userId
   */
  enableUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/enable`)
    return response.data
  },

  /**
   * Create new user/staff member directly
   * @param {{ username: string, password: string, name: string, role: string, specialization?: string }} data
   */
  createUser: async (data) => {
    const response = await api.post('/admin/users', data)
    return response.data
  },
}
