import axiosClient from './axiosClient'

// Admin, Security Officer
export const getCurrentlyInside = (params) => axiosClient.get('/visits/currently-inside', { params })
export const getVisits = (params) => axiosClient.get('/visits', { params })
export const createVisit = (payload) => axiosClient.post('/visits', payload)
export const getVisit = (id) => axiosClient.get(`/visits/${id}`)
export const checkInVisit = (id, payload) => axiosClient.post(`/visits/${id}/check-in`, payload)
export const checkOutVisit = (id, payload) => axiosClient.post(`/visits/${id}/check-out`, payload)
export const updateVisitStatus = (id, payload) => axiosClient.patch(`/visits/${id}/status`, payload)
