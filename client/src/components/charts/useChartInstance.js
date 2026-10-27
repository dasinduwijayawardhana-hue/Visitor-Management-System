import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

/**
 * Manages the full Chart.js lifecycle for a canvas element.
 *
 * - Creates the chart safely on mount without using structuredClone or JSON.stringify,
 *   preventing DataCloneError crashes on callback functions or DOM nodes.
 * - Updates existing chart instances in-place when data or options change.
 * - Handles React 18 StrictMode double-mount and destroys the chart cleanly on unmount.
 *
 * @param {import('chart.js').ChartConfiguration} config
 * @returns {React.RefObject<HTMLCanvasElement>}
 */
export default function useChartInstance(config) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  // Initial mount & canvas instance creation
  useEffect(() => {
    if (!canvasRef.current) return

    // Clean up any existing Chart.js instance bound to this canvas element (e.g. StrictMode)
    const existingChart = Chart.getChart(canvasRef.current)
    if (existingChart) {
      existingChart.destroy()
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: config.type,
      data: config.data || { labels: [], datasets: [] },
      options: config.options || {},
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Initial mount

  // In-place chart updates on data or options change
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    if (config.data) {
      chart.data.labels = config.data.labels ?? []
      chart.data.datasets = config.data.datasets ?? []
    }
    if (config.options) {
      chart.options = config.options
    }
    chart.update()
  }, [config.data, config.options])

  return canvasRef
}
