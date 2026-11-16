import axiosClient from './axiosClient'

export const getPendingRequests = () => axiosClient.get('/employee/visitor-requests')

export const approveRequest = (id) => axiosClient.put(`/employee/visitor-requests/${id}/approve`)

export const rejectRequest = (id, rejectionReason) => 
  axiosClient.put(`/employee/visitor-requests/${id}/reject`, { rejectionReason })
