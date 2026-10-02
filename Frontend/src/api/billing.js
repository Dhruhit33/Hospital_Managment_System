import { api } from '@/lib/axios'

export const billingApi = {
  /**
   * Admin generates bill for an appointment
   * @param {number} appointmentId
   * @param {{ medicineCharges: number, otherCharges: number }} data
   */
  generateBill: async (appointmentId, data) => {
    const response = await api.post(`/admin/bills/generate/${appointmentId}`, data)
    return response.data
  },

  /**
   * Patient gets bills
   * @param {{ status?: string, page?: number, size?: number }} params
   */
  getPatientBills: async (params = {}) => {
    const response = await api.get('/patient/bills', { params })
    return response.data
  },

  /**
   * Patient get single bill
   * @param {number} id
   */
  getPatientBillById: async (id) => {
    const response = await api.get(`/patient/bills/${id}`)
    return response.data
  },

  /**
   * Patient pays bill
   * @param {number} id
   * @param {{ amount: number, method: 'CASH'|'CARD'|'UPI', transactionRef: string, idempotencyKey: string }} data
   */
  payBill: async (id, data) => {
    const response = await api.post(`/patient/bills/${id}/pay`, data)
    return response.data
  },

  /**
   * Admin gets bills with date and status filters
   * @param {{ status?: string, from?: string, to?: string, page?: number, size?: number }} params
   */
  getAdminBills: async (params = {}) => {
    const response = await api.get('/admin/bills', { params })
    return response.data
  },

  /**
   * Admin updates bill status (e.g. PENDING to PAID or PAID to PENDING)
   * @param {number} id
   * @param {'PENDING'|'PAID'|'CANCELLED'} status
   */
  updateBillStatus: async (id, status) => {
    const response = await api.patch(`/admin/bills/${id}/status`, { status })
    return response.data
  },
}
