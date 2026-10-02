import { api } from '@/lib/axios'

export const patientApi = {
  /**
   * Retrieves the authenticated patient's medical profile
   */
  getProfile: async () => {
    const response = await api.get('/patient/profile')
    return response.data
  },

  /**
   * Updates patient profile details (name, bloodGroup, gender, birthDate)
   * @param {{ name?: string, bloodGroup?: string, gender?: string, birthDate?: string }} data
   */
  updateProfile: async (data) => {
    const response = await api.put('/patient/profile', data)
    return response.data
  },
}
