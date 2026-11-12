const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const UPLOADS_BASE = BASE_URL.replace('/api', '')

import axiosClient from './axiosClient'

export function getVisitorImageUrl(photoUrl) {
  if (!photoUrl) return null
  return `${UPLOADS_BASE}/${photoUrl}`
}

export const registerVisitor = (payload) => {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    form.append(key, value)
  })
  return axiosClient.post('/visitor-portal/register', form)
}

export const getVisitorProfile = () => axiosClient.get('/visitor-portal/profile')

export const updateVisitorProfile = (payload) => {
  const hasFile = Object.values(payload).some((v) => v instanceof File)
  if (hasFile) {
    const form = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return
      form.append(key, value)
    })
    return axiosClient.put('/visitor-portal/profile', form)
  }
  return axiosClient.put('/visitor-portal/profile', payload)
}

export const getHostEmployees = () => axiosClient.get('/visitor-portal/employees')

export const getVisitorVisits = (params) => axiosClient.get('/visitor-portal/visits', { params })

export const getVisitorVisitById = (id) => axiosClient.get(`/visitor-portal/visits/${id}`)

export const createVisitorVisit = (payload) => axiosClient.post('/visitor-portal/visits', payload)

export const cancelVisitorVisit = (id) => axiosClient.put(`/visitor-portal/visits/${id}/cancel`)
