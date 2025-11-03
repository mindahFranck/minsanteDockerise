import api from "./api"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role?: string
}

export interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface AuthResponse {
  success: boolean
  data: {
    user: User
    token: string
  }
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials)
    if (response.data.success) {
      localStorage.setItem("token", response.data.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.data.user))
    }
    return response.data
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data)
    if (response.data.success) {
      localStorage.setItem("token", response.data.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.data.user))
    }
    return response.data
  }

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout")
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get<{ success: boolean; data: User }>("/auth/me")
      return response.data.data
    } catch (error) {
      return null
    }
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token")
  }
}

const authService = new AuthService()

export { authService }
export default authService
