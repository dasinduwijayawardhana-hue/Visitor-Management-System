import axiosClient from './axiosClient'

// Admin only
export const getLogs = (params) => axiosClient.get('/audit-logs', { params })
