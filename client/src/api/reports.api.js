import axiosClient from './axiosClient'

// Admin, Security Officer
export const getDailyReport = (date, format = 'json') =>
  axiosClient.get('/reports/daily', { params: { date, format } })

export const getMonthlyReport = (year, month, format = 'json') =>
  axiosClient.get('/reports/monthly', { params: { year, month, format } })

export const getCurrentVisitorsReport = (format = 'json') =>
  axiosClient.get('/reports/current-visitors', { params: { format } })

// Helper for downloading csv/pdf report blobs.
export const downloadReportFile = async (url, params, filename) => {
  const response = await axiosClient.get(url, { params, responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}
