import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const ACCESS_TOKEN_KEY = 'vms_access_token'
export const REFRESH_TOKEN_KEY = 'vms_refresh_token'

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access, refresh) => {
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

const axiosClient = axios.create({
  baseURL: BASE_URL,
})

// Attach the access token to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Track a single in-flight refresh so parallel 401s only trigger one refresh call.
let refreshPromise = null
// Handlers the app can register to react to a forced logout (e.g. redirect to /login).
let onForcedLogout = () => {}
export const registerForcedLogoutHandler = (fn) => {
  onForcedLogout = fn
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh')

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      const refreshToken = tokenStore.getRefresh()

      if (!refreshToken) {
        tokenStore.clear()
        onForcedLogout()
        return Promise.reject(error)
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${BASE_URL}/auth/refresh`, { refreshToken })
            .then((res) => res.data)
            .finally(() => {
              refreshPromise = null
            })
        }
        const body = await refreshPromise
        // Backend wraps every response as { success, message, data }.
        // POST /auth/refresh's payload is body.data.accessToken.
        const newAccess = body?.data?.accessToken
        const newRefresh = body?.data?.refreshToken || refreshToken
        tokenStore.set(newAccess, newRefresh)

        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return axiosClient(originalRequest)
      } catch (refreshError) {
        tokenStore.clear()
        onForcedLogout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default axiosClient
