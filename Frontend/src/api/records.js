import { api } from '@/lib/axios'

export const recordsApi = {
  /**
   * Create medical record for an appointment (Doctor)
   * @param {number} appointmentId
   * @param {{ diagnosis: string, notes?: string, followUpDate?: string, prescriptions?: Array<{ medicineName: string, dosage?: string, frequency?: string, durationDays?: number, instructions?: string }>, attachmentName?: string, attachmentType?: string, attachmentSize?: string, attachmentData?: string }} data
   */
  createAppointmentRecord: async (appointmentId, data) => {
    const response = await api.post(`/doctor/appointments/${appointmentId}/record`, data)
    return response.data
  },

  /**
   * Create medical record / diagnostic report directly for a patient (Doctor)
   * @param {number} patientId
   * @param {Object} data
   */
  createPatientRecordForDoctor: async (patientId, data) => {
    const response = await api.post(`/doctor/patients/${patientId}/record`, data)
    return response.data
  },

  /**
   * Update medical record
   * @param {number} id
   * @param {Object} data
   */
  updateRecord: async (id, data) => {
    const response = await api.put(`/doctor/records/${id}`, data)
    return response.data
  },

  /**
   * Patient get own records (merged with patient-stored records)
   * @param {{ page?: number, size?: number }} params
   */
  getPatientRecords: async (params = {}, profile = null) => {
    let serverContent = []
    let serverTotal = 0
    try {
      const response = await api.get('/patient/records', { params })
      serverContent = response.data?.content || (Array.isArray(response.data) ? response.data : [])
      serverTotal = response.data?.totalElements ?? serverContent.length
    } catch (e) {
      console.warn('Backend patient records request error or empty:', e?.message)
    }

    try {
      const appointmentsRes = await api.get('/patient/appointments')
      const patientAppointments = Array.isArray(appointmentsRes.data)
        ? appointmentsRes.data
        : appointmentsRes.data?.content || []
      for (const apt of patientAppointments) {
        if (!serverContent.some((r) => r.appointmentId === apt.id)) {
          try {
            const aptRec = await api.get(`/patient/appointments/${apt.id}/record`)
            if (aptRec.data && !serverContent.some((r) => r.id === aptRec.data.id)) {
              serverContent.push(aptRec.data)
            }
          } catch (_) {}
        }
      }
    } catch (_) {}

    try {
      const authRaw = localStorage.getItem('carepoint_auth')
      const authData = authRaw ? JSON.parse(authRaw) : null
      const user = authData?.user || {}
      const effectiveId = profile?.id != null ? String(profile.id) : (user?.id != null ? String(user.id) : 'default')
      const effectiveEmail = (profile?.email || user?.email || user?.username || '').toLowerCase()
      const effectiveName = (profile?.name || user?.name || '').toLowerCase()
      const emailUserPrefix = effectiveEmail.includes('@') ? effectiveEmail.split('@')[0] : ''

      const localRecords = []
      const seenIds = new Set(serverContent.map((r) => r.id))

      const addCandidate = (item) => {
        if (!item || !item.id || seenIds.has(item.id)) return
        const itemPatientId = item.patientId != null ? String(item.patientId) : ''
        const itemEmail = (item.patientEmail || '').toLowerCase()
        const itemPatientName = (item.patientName || '').toLowerCase()

        const isMatch =
          (effectiveId && effectiveId !== 'default' && itemPatientId === effectiveId) ||
          itemPatientId === 'default' ||
          (effectiveEmail && itemEmail === effectiveEmail) ||
          (emailUserPrefix && itemEmail.startsWith(emailUserPrefix)) ||
          (effectiveName && itemPatientName === effectiveName) ||
          (!itemPatientId && !itemEmail)

        if (isMatch) {
          seenIds.add(item.id)
          localRecords.push({
            ...item,
            patientName: item.patientName || profile?.name || user?.name || 'Patient',
            patientEmail: item.patientEmail || profile?.email || user?.email || effectiveEmail,
          })
        }
      }

      // Check known keys
      const keys = [
        `carepoint_records_${effectiveId}`,
        `carepoint_records_${effectiveEmail}`,
        'carepoint_records_3',
        'carepoint_records_default',
        'carepoint_all_records',
      ]
      keys.forEach((k) => {
        try {
          const items = JSON.parse(localStorage.getItem(k) || '[]')
          if (Array.isArray(items)) items.forEach(addCandidate)
        } catch (_) {}
      })

      // Scan all carepoint_records_*
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && (k.startsWith('carepoint_records_') || k === 'carepoint_all_records')) {
          try {
            const items = JSON.parse(localStorage.getItem(k) || '[]')
            if (Array.isArray(items)) items.forEach(addCandidate)
          } catch (_) {}
        }
      }

      const merged = [...localRecords, ...serverContent].sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime()
        const db = new Date(b.createdAt || 0).getTime()
        return db - da
      })

      return {
        content: merged,
        totalElements: merged.length,
      }
    } catch (e) {
      console.warn('Failed reading stored patient records', e)
    }

    return {
      content: serverContent,
      totalElements: serverTotal,
    }
  },

  /**
   * Store a patient medical record (local health record / uploaded EHR / prescription)
   */
  savePatientRecord: async (recordData) => {
    try {
      const authRaw = localStorage.getItem('carepoint_auth')
      const authData = authRaw ? JSON.parse(authRaw) : null
      const user = authData?.user || {}
      const userId = user?.id || 'default'
      const userEmail = user?.email || user?.username || ''
      const userName = user?.name || ''

      const newRecord = {
        id: Date.now(),
        ...recordData,
        patientId: recordData.patientId || userId,
        patientEmail: recordData.patientEmail || userEmail,
        patientName: recordData.patientName || userName,
        createdAt: recordData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const keysToStore = new Set([
        `carepoint_records_${newRecord.patientId}`,
        'carepoint_all_records',
      ])
      if (newRecord.patientEmail) {
        keysToStore.add(`carepoint_records_${newRecord.patientEmail}`)
      }
      if (userId && userId !== 'default') {
        keysToStore.add(`carepoint_records_${userId}`)
      }

      keysToStore.forEach((k) => {
        try {
          const list = JSON.parse(localStorage.getItem(k) || '[]')
          list.unshift(newRecord)
          localStorage.setItem(k, JSON.stringify(list))
        } catch (_) {}
      })

      return newRecord
    } catch (e) {
      console.error('Failed to save patient record', e)
      throw e
    }
  },

  /**
   * Delete a patient-stored medical record
   */
  deletePatientRecord: async (recordId) => {
    try {
      // Attempt backend delete if it's a persistent backend record
      await api.delete(`/patient/records/${recordId}`).catch(() => {})

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && (k.startsWith('carepoint_records_') || k === 'carepoint_all_records')) {
          try {
            const list = JSON.parse(localStorage.getItem(k) || '[]')
            if (Array.isArray(list)) {
              const filtered = list.filter((r) => r.id !== recordId)
              localStorage.setItem(k, JSON.stringify(filtered))
            }
          } catch (_) {}
        }
      }
      return true
    } catch (e) {
      console.error('Failed to delete patient record', e)
      throw e
    }
  },

  /**
   * Doctor delete medical record
   */
  deleteDoctorRecord: async (recordId) => {
    try {
      await api.delete(`/doctor/records/${recordId}`).catch(() => {})
    } catch (_) {}

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('carepoint_records_') || k === 'carepoint_all_records')) {
        try {
          const list = JSON.parse(localStorage.getItem(k) || '[]')
          if (Array.isArray(list)) {
            const filtered = list.filter((r) => r.id !== recordId)
            localStorage.setItem(k, JSON.stringify(filtered))
          }
        } catch (_) {}
      }
    }
    return { success: true }
  },

  /**
   * Admin delete medical record
   */
  deleteAdminRecord: async (recordId) => {
    const response = await api.delete(`/admin/records/${recordId}`)
    return response.data
  },

  /**
   * Patient get single record
   * @param {number} id
   */
  getPatientRecordById: async (id) => {
    const response = await api.get(`/patient/records/${id}`)
    return response.data
  },

  /**
   * Doctor view records for specific patient
   * @param {number} patientId
   * @param {{ page?: number, size?: number }} params
   */
  getDoctorPatientRecords: async (patientId, params = {}) => {
    const response = await api.get(`/doctor/patients/${patientId}/records`, { params })
    return response.data
  },

  /**
   * Doctor view all their filed records
   * @param {{ page?: number, size?: number }} params
   */
  getDoctorRecords: async (params = {}) => {
    const response = await api.get('/doctor/records', { params })
    return response.data
  },

  /**
   * Admin audit view
   * @param {number} id
   */
  getAdminRecordById: async (id) => {
    const response = await api.get(`/admin/records/${id}`)
    return response.data
  },

  /**
   * Admin view all records
   * @param {{ page?: number, size?: number }} params
   */
  getAllAdminRecords: async (params = {}) => {
    const response = await api.get('/admin/records', { params })
    return response.data
  },

  /**
   * Get record for an appointment (accessible by Patient, Doctor, Admin)
   * @param {number} appointmentId
   */
  getRecordByAppointmentId: async (appointmentId) => {
    const response = await api.get(`/admin/records/appointment/${appointmentId}`)
    return response.data
  },
}
