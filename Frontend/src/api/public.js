import { api } from '@/lib/axios'

export const publicApi = {
  /**
   * Fetch doctors with filters & pagination
   * @param {{ specialization?: string, name?: string, departmentId?: number, page?: number, size?: number, sort?: string }} params
   */
  getDoctors: async (params = {}) => {
    const response = await api.get('/public/doctors', { params })
    return response.data
  },

  /**
   * Get single doctor by id
   * @param {number} id
   */
  getDoctorById: async (id) => {
    const response = await api.get(`/public/doctors/${id}`)
    return response.data
  },

  /**
   * Fetch departments
   * @param {{ page?: number, size?: number }} params
   */
  getDepartments: async (params = {}) => {
    const response = await api.get('/public/departments', { params })
    return response.data
  },
}
