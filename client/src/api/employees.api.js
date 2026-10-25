import axiosClient from './axiosClient'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const UPLOADS_BASE = BASE_URL.replace('/api', '')

/**
 * Returns a full URL to an employee's profile image, or null if none.
 * Falls back to null so callers can render a default avatar.
 */
export function getEmployeeImageUrl(profileImage) {
  if (!profileImage) return null
  return `${UPLOADS_BASE}/uploads/employees/${profileImage}`
}

// Employee only
export const getMyVisitors = (params) => axiosClient.get('/employees/my-visitors', { params })

// Admin, Security Officer
export const getEmployees = (params) => axiosClient.get('/employees', { params })
export const getEmployee = (id) => axiosClient.get(`/employees/${id}`)

// Admin only — always sends multipart/form-data so an optional profile image can be included.
// IMPORTANT: do NOT set Content-Type manually. Axios + browser must generate it automatically
// so that the multipart boundary is included. Without the boundary multer cannot parse the body.
export const createEmployee = (payload) => {
  const form = buildFormData(payload)
  return axiosClient.post('/employees', form)
}

export const updateEmployee = (id, payload) => {
  // If any key in payload is a File we send multipart; otherwise plain JSON (e.g. isActive toggle)
  const hasFile = Object.values(payload).some((v) => v instanceof File)
  if (hasFile) {
    const form = buildFormData(payload)
    // No manual Content-Type — browser sets multipart/form-data + boundary automatically
    return axiosClient.put(`/employees/${id}`, form)
  }
  return axiosClient.put(`/employees/${id}`, payload)
}

export const deleteEmployee = (id) => axiosClient.delete(`/employees/${id}`)

// Converts a plain object (with optional File values) into FormData
function buildFormData(payload) {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    form.append(key, value)
  })
  return form
}
