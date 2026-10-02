import { api } from '@/lib/axios'

export const authApi = {
  /**
   * Authenticates user with username and password
   * @param {{ username: string, password: string }} credentials
   * @returns {Promise<{ jwt: string, userId: number, refreshToken: string }>}
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  /**
   * Registers a new patient account
   * @param {{ username: string, password: string, name: string }} data
   * @returns {Promise<{ id: number, username: string }>}
   */
  signup: async (data) => {
    const response = await api.post('/auth/signup', data)
    return response.data
  },

  /**
   * Rotates refresh token and generates new access token
   * @param {string} refreshToken
   * @returns {Promise<{ jwt: string, userId: number, refreshToken: string }>}
   */
  refresh: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  /**
   * Logs out the session by revoking the refresh token
   * @param {string} refreshToken
   */
  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken })
    return response.data
  },

  /**
   * Retrieves current user profile details (id, username, name, roles)
   */
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  /**
   * Request email verification OTP for signup
   * @param {string} email
   */
  sendSignupOtp: async (email) => {
    const response = await api.post('/auth/send-signup-otp', { email })
    return response.data
  },

  /**
   * Verify login OTP to finalize 2FA authentication
   * @param {string} email
   * @param {string} otp
   */
  verifyLoginOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-login-otp', { email, otp })
    return response.data
  },

  /**
   * Resend login OTP
   * @param {string} email
   */
  resendLoginOtp: async (email) => {
    const response = await api.post('/auth/resend-login-otp', { email })
    return response.data
  },
}
