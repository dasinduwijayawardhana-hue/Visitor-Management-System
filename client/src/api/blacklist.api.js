import axiosClient from './axiosClient'

// Admin + Security Officer — probe an identity before registration
export const checkBlacklist = (params) => axiosClient.get('/blacklist/check', { params })

// Admin — full list with pagination
export const getBlacklist = (params) => axiosClient.get('/blacklist', { params })

// Admin — manually add a person to the blacklist
export const addToBlacklist = (payload) => axiosClient.post('/blacklist', payload)

// Admin — remove an entry (sets status = REMOVED)
export const removeBlacklist = (id) => axiosClient.delete(`/blacklist/${id}`)
