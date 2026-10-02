import { api } from '@/lib/axios'

export const insuranceApi = {
  /**
   * Save insurance details
   * @param {{ policyNumber: string, provider: string, validUntil?: string, coveragePercent?: number }} data
   */
  addInsurance: async (data) => {
    const response = await api.post('/patient/insurance', data)
    return response.data
  },

  /**
   * Delete insurance policy
   */
  deleteInsurance: async () => {
    const response = await api.delete('/patient/insurance')
    return response.data
  },

  /**
   * Get current insurance policy
   */
  getInsurance: async () => {
    const response = await api.get('/patient/insurance')
    return response.data
  },
}
