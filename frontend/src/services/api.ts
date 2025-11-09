import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios"
import config from "../config/api"

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: config.timeout,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token")
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

// Flag to prevent multiple redirects
let isRedirecting = false

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      const currentPath = window.location.pathname

      // Only handle 401 if:
      // 1. It's not a login request (avoid clearing on failed login)
      // 2. We're not already on login/home page
      // 3. We're not already redirecting
      if (!isLoginRequest && currentPath !== '/login' && currentPath !== '/' && !isRedirecting) {
        isRedirecting = true

        // Token expired or invalid
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("refreshToken")

        // Redirect to login
        window.location.href = "/login"

        // Reset flag after redirect
        setTimeout(() => {
          isRedirecting = false
        }, 1000)
      }
    }
    return Promise.reject(error)
  },
)

export default api
