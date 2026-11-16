import axiosClient from './axiosClient'

export const verifyGatePass = (qrToken) => axiosClient.post('/security/verify-gate-pass', { qrToken })

export const checkInVisitor = (id, qrToken, badgeNumber) => axiosClient.post(`/security/visits/${id}/check-in`, { qrToken, badgeNumber })

export const checkOutVisitor = (id, remarks) => axiosClient.post(`/security/visits/${id}/check-out`, { remarks })
