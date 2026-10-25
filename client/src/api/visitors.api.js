import axiosClient from './axiosClient'

// Admin, Security Officer
export const getVisitors = (params) => axiosClient.get('/visitors', { params })
export const createVisitor = (payload) => axiosClient.post('/visitors', payload)
export const getVisitor = (id) => axiosClient.get(`/visitors/${id}`)
export const updateVisitor = (id, payload) => axiosClient.put(`/visitors/${id}`, payload)

// Admin only
export const deleteVisitor = (id) => axiosClient.delete(`/visitors/${id}`)
export const setVisitorBlacklist = (id, payload) => axiosClient.patch(`/visitors/${id}/blacklist`, payload)
