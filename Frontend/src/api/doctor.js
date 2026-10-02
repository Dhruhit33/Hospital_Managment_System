import { api } from '@/lib/axios'

export const doctorApi = {
  /**
   * Paginated list of doctors
   */
  getDoctors: async (params = {}) => {
    const response = await api.get('/doctor', { params })
    return response.data
  },

  /**
   * Array of all doctors without pagination
   */
  getAllDoctors: async () => {
    const response = await api.get('/doctor/all')
    return response.data
  },

  /**
   * Single doctor details
   */
  getDoctorById: async (id) => {
    const response = await api.get(`/doctor/${id}`)
    return response.data
  },

  /**
   * Appointments for the authenticated doctor
   */
  getDoctorAppointments: async () => {
    const response = await api.get('/doctor/appointments')
    return response.data
  },

  getMyAppointments: async () => {
    const response = await api.get('/doctor/appointments')
    return response.data
  },

  /**
   * Update weekly schedule
   * @param {{ availabilities: Array<{ dayOfWeek: string, startTime: string, endTime: string }> }} data
   */
  setAvailability: async (data) => {
    const response = await api.post('/doctor/availability', data)
    return response.data
  },

  /**
   * Get logged-in doctor's schedule
   */
  getAvailability: async () => {
    const response = await api.get('/doctor/availability')
    return response.data
  },

  /**
   * Get any doctor's schedule by ID
   */
  getDoctorAvailabilityById: async (id) => {
    const response = await api.get(`/doctor/${id}/availability`)
    return response.data
  },

  /**
   * Apply for leave
   * @param {{ leaveDate: string, reason?: string }} data
   */
  addLeave: async (data) => {
    const response = await api.post('/doctor/leave', data)
    return response.data
  },

  /**
   * Available slots for a doctor on a specific date (YYYY-MM-DD)
   * @param {number} doctorId
   * @param {string} date
   */
  getSlots: async (doctorId, date) => {
    const response = await api.get('/doctor/slots', {
      params: { doctorId, date },
    })
    return response.data
  },

  /**
   * Get patients under doctor's care
   */
  getDoctorPatients: async () => {
    const response = await api.get('/doctor/patients')
    return response.data
  },
}
