import axiosClient from './axiosClient'

// Admin / Security Officer
export const getRoles = () => axiosClient.get('/roles')
