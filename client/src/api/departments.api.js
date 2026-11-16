import axiosClient from './axiosClient'

// Any authenticated user
export const getDepartments = (params) => axiosClient.get('/departments', { params })
export const getDepartment = (id) => axiosClient.get(`/departments/${id}`)

// Admin only
export const createDepartment = (payload) => axiosClient.post('/departments', payload)
export const updateDepartment = (id, payload) => axiosClient.put(`/departments/${id}`, payload)
export const deleteDepartment = (id) => axiosClient.delete(`/departments/${id}`)
