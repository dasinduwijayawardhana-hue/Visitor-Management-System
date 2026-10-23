import axiosClient from './axiosClient'

// All endpoints below are Admin only.
export const getUsers = (params) => axiosClient.get('/users', { params })
export const createUser = (payload) => axiosClient.post('/users', payload)
export const getUser = (id) => axiosClient.get(`/users/${id}`)
export const updateUser = (id, payload) => axiosClient.put(`/users/${id}`, payload)
export const deleteUser = (id) => axiosClient.delete(`/users/${id}`)

// Self or Admin
export const changePassword = (id, payload) => axiosClient.patch(`/users/${id}/change-password`, payload)
