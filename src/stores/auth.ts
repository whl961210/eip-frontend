import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import { ElMessage } from 'element-plus'

interface User {
  id: number
  username: string
  email: string
  role: string
  phone?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password })
      token.value = response.access_token
      user.value = response.user
      localStorage.setItem('token', response.access_token)
      ElMessage.success('登录成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '登录失败')
      return false
    }
  }

  const register = async (data: any) => {
    try {
      await authApi.register(data)
      ElMessage.success('注册成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '注册失败')
      return false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    ElMessage.success('退出登录成功')
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      user.value = response
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    fetchCurrentUser,
  }
})
