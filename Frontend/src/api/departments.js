import { api } from '@/lib/axios'

export const departmentsApi = {
  /**
   * Get all departments
   * @param {{ page?: number, size?: number }} params
   */
  getDepartments: async (params = {}) => {
    const response = await api.get('/public/departments', { params })
    return response.data
  },

  /**
   * Create department
   * @param {{ name: string, headDoctorId?: number }} data
   */
  createDepartment: async (data) => {
    const response = await api.post('/admin/departments', data)
    return response.data
  },

  /**
   * Update department
   * @param {number} id
   * @param {{ name: string, headDoctorId?: number }} data
   */
  updateDepartment: async (id, data) => {
    const response = await api.put(`/admin/departments/${id}`, data)
    return response.data
  },

  /**
   * Delete department
   * @param {number} id
   */
  deleteDepartment: async (id) => {
    const response = await api.delete(`/admin/departments/${id}`)
    return response.data
  },

  /**
   * Assign doctor to department
   * @param {number} departmentId
   * @param {number} doctorId
   */
  assignDoctor: async (departmentId, doctorId) => {
    const response = await api.post(`/admin/departments/${departmentId}/doctors/${doctorId}`)
    return response.data
  },

  /**
   * Remove doctor from department
   * @param {number} departmentId
   * @param {number} doctorId
   */
  removeDoctor: async (departmentId, doctorId) => {
    const response = await api.delete(`/admin/departments/${departmentId}/doctors/${doctorId}`)
    return response.data
  },

  /**
   * Set department head doctor
   * @param {number} departmentId
   * @param {number} doctorId
   */
  setDepartmentHead: async (departmentId, doctorId) => {
    const response = await api.put(`/admin/departments/${departmentId}/head/${doctorId}`)
    return response.data
  },
}
