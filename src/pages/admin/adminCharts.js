import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

function safeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function destroyIfExists(canvas) {
  const existing = Chart.getChart(canvas)
  if (existing) existing.destroy()
}

export function updateAdminDashboardCharts(dashboardData, refs) {
  if (!dashboardData) return
  const { chartProduccion, chartCostos, chartCategoriaCostos, chartRentabilidad } = refs
  const { productionTrend = [], costTrend = [], costByCategory = [], rentability = [] } = dashboardData

  if (chartProduccion?.current) {
    const canvas = chartProduccion.current
    destroyIfExists(canvas)
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: productionTrend.map((item) => item.label),
        datasets: [
          {
            label: 'Producción (kg)',
            data: productionTrend.map((item) => item.value),
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.2)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#27ae60',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => `${v} kg` } } },
      },
    })
  }

  if (chartCostos?.current) {
    const canvas = chartCostos.current
    destroyIfExists(canvas)
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: costTrend.map((item) => item.label),
        datasets: [
          {
            label: 'Costos Mensuales',
            data: costTrend.map((item) => item.value),
            backgroundColor: '#e74c3c',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => '$' + Number(v).toLocaleString() } } },
      },
    })
  }

  if (chartCategoriaCostos?.current) {
    const canvas = chartCategoriaCostos.current
    destroyIfExists(canvas)
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: costByCategory.map((item) => item.categoria),
        datasets: [
          {
            data: costByCategory.map((item) => item.total),
            backgroundColor: ['#16a085', '#e74c3c', '#9b59b6', '#f39c12', '#95a5a6'],
            borderColor: 'white',
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'right' } },
      },
    })
  }

  if (chartRentabilidad?.current) {
    const canvas = chartRentabilidad.current
    destroyIfExists(canvas)
    const labels = rentability.map((item) => item.nombre)
    const ingresos = rentability.map((item) => safeNumber(item.ingresos))
    const costos = rentability.map((item) => safeNumber(item.costo))
    const ganancia = rentability.map((item) => safeNumber(item.ganancia))

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Ingresos (COP)', data: ingresos, backgroundColor: '#27ae60' },
          { label: 'Costos (COP)', data: costos, backgroundColor: '#e74c3c' },
          { label: 'Ganancia (COP)', data: ganancia, backgroundColor: '#f39c12' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: { y: { ticks: { callback: (v) => '$' + Number(v).toLocaleString() } } },
      },
    })
  }
}

export function updateRentabilidadCharts(dashboardData, refs) {
  if (!dashboardData) return
  const { chartRentabilidadDetallada, chartComparativaIngresosCostos } = refs
  const { rentability = [] } = dashboardData
  const labels = rentability.map((item) => item.nombre)
  const rows = rentability.map((item) => {
    const ingresos = safeNumber(item.ingresos)
    const costos = safeNumber(item.costo)
    const ganancia = safeNumber(item.ganancia)
    const margen = ingresos > 0 ? ((ganancia / ingresos) * 100) : 0
    return { ingresos, costos, ganancia, margen }
  })

  if (chartRentabilidadDetallada?.current) {
    const canvas = chartRentabilidadDetallada.current
    destroyIfExists(canvas)
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Margen de Rentabilidad (%)',
            data: rows.map((r) => Number((r.margen || 0).toFixed(1))),
            backgroundColor: ['#27ae60', '#f39c12', '#3498db', '#e74c3c', '#9b59b6'],
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: { x: { ticks: { callback: (v) => `${v}%` } } },
      },
    })
  }

  if (chartComparativaIngresosCostos?.current) {
    const canvas = chartComparativaIngresosCostos.current
    destroyIfExists(canvas)
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: rows.map((r) => r.ingresos),
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.2)',
          },
          {
            label: 'Costos',
            data: rows.map((r) => r.costos),
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: { y: { ticks: { callback: (v) => '$' + Number(v).toLocaleString() } } },
      },
    })
  }
}
