import React, { useMemo } from 'react'
import useChartInstance from './useChartInstance.js'

export default function MonthlyVisitorsChart({ data = [], label = 'Visitors' }) {
  const normalized = useMemo(() => normalize(data), [data])

  const chartConfig = useMemo(
    () => ({
      type: 'line',
      data: {
        labels: normalized.map((d) => d.label),
        datasets: [
          {
            label,
            data: normalized.map((d) => d.value),
            borderColor: '#3FA66A',
            backgroundColor: 'rgba(63, 166, 106, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 2,
            pointBackgroundColor: '#3FA66A',
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
            ticks: { color: 'rgba(255, 255, 255, 0.85)', font: { family: 'Space Grotesk, sans-serif' }, maxTicksLimit: 12 },
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
        <p className="text-sm font-medium text-white/60">No visitor data available for this month</p>
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
  if (typeof first === 'object' && ('day' in first || 'date' in first || 'label' in first)) {
    return data.map((d) => ({
      label: d.day ?? d.date ?? d.label,
      value: d.visitors ?? d.value ?? d.count ?? 0,
    }))
  }
  return data.map((value, i) => ({ label: i + 1, value }))
}
