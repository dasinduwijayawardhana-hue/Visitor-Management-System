import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getMeRequest, loginRequest, logoutRequest, registerRequest } from '../api/auth.api'
import { registerForcedLogoutHandler, tokenStore } from '../api/axiosClient'
import { normalizeRole } from '../utils/roles'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [authBusy, setAuthBusy] = useState(false)

  const normalizeUser = (raw) => {
    if (!raw) return null
    return { ...raw, role: normalizeRole(raw.role) }
  }

  const loadCurrentUser = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setInitializing(false)
      return
    }
    try {
      const { data: body } = await getMeRequest()
      // GET /auth/me returns { success, message, data: <user object> } -
      // the user is body.data directly, not body.user.
      setUser(normalizeUser(body?.data))
    } catch (err) {
      tokenStore.clear()
      setUser(null)
    } finally {
      setInitializing(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])

  // If the axios interceptor ever fails to refresh, it calls this to force logout.
  useEffect(() => {
    registerForcedLogoutHandler(() => {
      setUser(null)
    })
  }, [])

  const login = useCallback(async (credentials) => {
    setAuthBusy(true)
    try {
      const { data: body } = await loginRequest(credentials)
      // POST /auth/login returns { success, message, data: { user, accessToken, refreshToken } }.
      const { user: rawUser, accessToken, refreshToken } = body?.data || {}
      tokenStore.set(accessToken, refreshToken)
      const currentUser = normalizeUser(rawUser)
      if (currentUser) {
        setUser(currentUser)
      } else {
        await loadCurrentUser()
      }
      return currentUser
    } finally {
      setAuthBusy(false)
    }
  }, [loadCurrentUser])

  const register = useCallback(async (payload) => {
    setAuthBusy(true)
    try {
      // POST /auth/register returns { success, message, data: <created user> }
      // and never issues tokens - self-signup always lands on /login to sign
      // in explicitly with the new credentials (see pages/auth/Register.jsx).
      const { data: body } = await registerRequest(payload)
      return normalizeUser(body?.data)
    } finally {
      setAuthBusy(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch (err) {
      // Ignore network errors on logout — clear the local session regardless.
    } finally {
      tokenStore.clear()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      initializing,
      authBusy,
      login,
      register,
      logout,
    }),
    [user, initializing, authBusy, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
