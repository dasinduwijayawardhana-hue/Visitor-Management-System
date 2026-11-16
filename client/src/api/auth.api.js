import axiosClient from './axiosClient'

// POST /auth/register — Public (self-signup, always Employee role)
export const registerRequest = (payload) => axiosClient.post('/auth/register', payload)

// POST /auth/login — Public (rate limited)
export const loginRequest = (payload) => axiosClient.post('/auth/login', payload)

// POST /auth/refresh — Public
export const refreshRequest = (refreshToken) => axiosClient.post('/auth/refresh', { refreshToken })

// POST /auth/logout — Authenticated
export const logoutRequest = () => axiosClient.post('/auth/logout')

// GET /auth/me — Authenticated
export const getMeRequest = () => axiosClient.get('/auth/me')
