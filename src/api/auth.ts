import apiClient from './axios'

export interface LoginDto {
  username: string
  password: string
}

export interface RegisterDto {
  username: string
  password: string
  email?: string
  role?: string
}

export const authApi = {
  login(data: LoginDto) {
    return apiClient.post('/auth/login', data)
  },

  register(data: RegisterDto) {
    return apiClient.post('/auth/register', data)
  },

  getCurrentUser() {
    return apiClient.get('/auth/me')
  },
}
