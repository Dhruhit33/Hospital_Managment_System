import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const defaultUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const baseURL = defaultUrl.includes('localhost') || defaultUrl.includes('10.95') ? `http://${window.location.hostname}:8080` : defaultUrl;

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Bearer JWT for authenticated requests
api.interceptors.request.use(
  (config) => {
    // List of public endpoints that should NEVER include an Authorization header
    const publicAuthEndpoints = [
      '/auth/login',
      '/auth/signup',
      '/auth/refresh',
      '/auth/send-signup-otp',
      '/auth/verify-login-otp',
      '/auth/resend-login-otp',
    ]

    const isPublicAuth = publicAuthEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    )

    if (!isPublicAuth) {
      const token = useAuthStore.getState().token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Handle 401 with Token Rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/signup') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/verify-login-otp')
    ) {
      const refreshToken = useAuthStore.getState().refreshToken

      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        })

        const { jwt, refreshToken: newRefreshToken } = response.data

        useAuthStore.getState().updateTokens({
          token: jwt,
          refreshToken: newRefreshToken,
        })

        processQueue(null, jwt)
        originalRequest.headers.Authorization = `Bearer ${jwt}`
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
