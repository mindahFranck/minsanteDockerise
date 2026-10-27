import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios"
import config from "../config/api"
import { attachNotifications } from "./apiNotifications"

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

let isRedirecting = false

// Response interceptor - Handle 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isLoginRequest = url.includes('/auth/login')
      const currentPath = window.location.pathname

      // Ne déconnecter que sur les requêtes auth explicites (pas les requêtes de données)
      // Quand une requête de données retourne 401, c'est normal si le token a expiré
      // mais on ne force pas la déconnexion immédiate
      const isAuthRoute = url.includes('/auth/me') || url.includes('/auth/refresh')

      if (!isLoginRequest && currentPath !== '/login' && currentPath !== '/' && !isRedirecting) {
        if (isAuthRoute) {
          // Token vraiment expiré - déconnecter
          isRedirecting = true
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          localStorage.removeItem("refreshToken")
          window.location.href = "/login"
          setTimeout(() => { isRedirecting = false }, 1000)
        }
        // Pour les autres requêtes, juste propager l'erreur sans déconnecter
      }
    }
    return Promise.reject(error)
  },
)

attachNotifications(api)

export default api
