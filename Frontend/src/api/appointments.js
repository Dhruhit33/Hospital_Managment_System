import { api } from '@/lib/axios'

export const appointmentsApi = {
  /**
   * Book new appointment
   * @param {{ doctorId: number, appointmentTime: string, reason: string }} data
   */
  bookAppointment: async (data) => {
    const response = await api.post('/appointments', data)
    return response.data
  },

  /**
   * Cancel appointment
   * @param {number} id
   * @param {{ reason?: string }} data
   */
  cancelAppointment: async (id, data = {}) => {
    const response = await api.post(`/appointments/${id}/cancel`, data)
    return response.data
  },

  /**
   * Reschedule appointment
   * @param {number} id
   * @param {{ newAppointmentTime: string }} data
   */
  rescheduleAppointment: async (id, data) => {
    const response = await api.post(`/appointments/${id}/reschedule`, data)
    return response.data
  },

  /**
   * Status change: CONFIRMED, COMPLETED, NO_SHOW, CANCELLED, BOOKED
   * @param {number} id
   * @param {{ status: string }} data
   */
  updateStatus: async (id, status) => {
    const response = await api.patch(`/appointments/${id}/status`, { status })
    return response.data
  },

  /**
   * Get appointments for authenticated patient
   */
  getPatientAppointments: async () => {
    const response = await api.get('/patient/appointments')
    return response.data
  },

  /**
   * Delete cancelled appointment
   * @param {number} id
   */
  deleteAppointment: async (id) => {
    const response = await api.delete(`/appointments/${id}`)
    return response.data
  },

  /**
   * Get all hospital appointments (Admin)
   */
  getAllAppointments: async () => {
    const response = await api.get('/admin/appointments')
    return response.data
  },

  /**
   * Purge completed and settled appointments whose end-to-end invoice is cleared (Admin)
   * @param {number} olderThanDays
   */
  cleanupCompletedAppointments: async (olderThanDays = 0) => {
    const response = await api.post('/admin/appointments/cleanup-completed', null, {
      params: { olderThanDays },
    })
    return response.data
  },
}
