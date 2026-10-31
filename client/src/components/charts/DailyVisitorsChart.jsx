import React, { useMemo } from 'react'
import useChartInstance from './useChartInstance.js'

const BRASS = '#C9A24B'

export default function DailyVisitorsChart({ data = [], label = 'Visitors' }) {
  const normalized = useMemo(() => normalize(data), [data])

  const chartConfig = useMemo(
    () => ({
      type: 'bar',
      data: {
        labels: normalized.map((d) => d.label),
        datasets: [
          {
            label,
            data: normalized.map((d) => d.value),
            backgroundColor: BRASS,
            borderRadius: 6,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: '#f8fafc', font: { family: 'Space Grotesk, sans-serif' } } },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.85)', font: { family: 'Space Grotesk, sans-serif' } },
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: 'rgba(255, 255, 255, 0.85)', font: { family: 'Space Grotesk, sans-serif' } },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
          },
        },
      },
    }),
    [normalized, label],
  )

  const canvasRef = useChartInstance(chartConfig)

  if (!normalized || normalized.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-sm font-medium text-white/60">No visitor data available for today</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <canvas ref={canvasRef} />
    </div>
  )
}

function normalize(data) {
  if (!Array.isArray(data) || data.length === 0) return []
  const first = data[0]
  if (typeof first === 'object' && ('hour' in first || 'label' in first)) {
    return data.map((d) => ({ label: d.hour || d.label, value: d.visitors ?? d.value ?? 0 }))
  }
  // Fallback: bucket raw visit records by check-in hour.
  const buckets = {}
  data.forEach((v) => {
    const time = v.checkInTime || v.checkedInAt || v.createdAt
    if (!time) return
    const hour = new Date(time).getHours()
    const key = `${String(hour).padStart(2, '0')}:00`
    buckets[key] = (buckets[key] || 0) + 1
  })
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }))
}
