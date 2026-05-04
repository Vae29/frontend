import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

function destroyIfExists(canvas) {
  const existing = Chart.getChart(canvas)
  if (existing) existing.destroy()
}

export function updateAdminDashboardCharts(Agro, fincaId, refs) {
  const { chartProduccion, chartCostos, chartCategoriaCostos, chartRentabilidad } = refs
  const cultivosFinca = Agro.getCultivosByFinca(fincaId)
  const labelsBase = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6']

  function seriesFromCultivo(cultivoId) {
    const detalle = Agro.getDetalleCultivo(cultivoId)
    const totalCosecha = (detalle.cosechas || []).reduce((a, x) => a + (Number(x.cantidad) || 0), 0)
    const seed = (cultivoId * 97) % 13
    const base = totalCosecha > 0 ? Math.max(10, Math.round(totalCosecha / 6)) : 20 + seed * 3
    return labelsBase.map((_, i) => Math.round(base * (0.7 + i * 0.08) + seed))
  }

  const palette = ['#e74c3c', '#27ae60', '#3498db', '#f39c12', '#9b59b6', '#16a085']
  const datasetsProduccion = cultivosFinca.map((c, idx) => ({
    label: c.nombre,
    data: seriesFromCultivo(c.id),
    borderColor: palette[idx % palette.length],
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    tension: 0.4,
    fill: true,
    pointRadius: 4,
    pointBackgroundColor: palette[idx % palette.length],
    pointBorderColor: 'white',
    pointBorderWidth: 2,
  }))

  if (chartProduccion?.current) {
    const canvas = chartProduccion.current
    destroyIfExists(canvas)
    new Chart(canvas, {
      type: 'line',
      data: { labels: labelsBase, datasets: datasetsProduccion },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => v + ' kg' } } },
      },
    })
  }

  if (chartCostos?.current) {
    const canvas = chartCostos.current
    const costosTotal = Agro.computeFincaResumen(fincaId).costos
    const insumos = Math.round(costosTotal * 0.35)
    const mano = Math.round(costosTotal * 0.45)
    const otros = Math.max(0, costosTotal - insumos - mano)
    const series = labelsBase.map((_, i) => {
      const factor = 0.75 + i * 0.06
      return {
        insumos: Math.round((insumos / labelsBase.length) * factor),
        mano: Math.round((mano / labelsBase.length) * factor),
        otros: Math.round((otros / labelsBase.length) * factor),
      }
    })
    const data = {
      labels: labelsBase,
      datasets: [
        { label: 'Insumos', data: series.map((x) => x.insumos), backgroundColor: '#3498db' },
        { label: 'Mano de Obra', data: series.map((x) => x.mano), backgroundColor: '#e74c3c' },
        { label: 'Otros', data: series.map((x) => x.otros), backgroundColor: '#f39c12' },
      ],
    }
    destroyIfExists(canvas)
    new Chart(canvas, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, ticks: { callback: (v) => '$' + v.toLocaleString() } },
        },
      },
    })
  }

  if (chartCategoriaCostos?.current) {
    const canvas = chartCategoriaCostos.current
    const categorias = { 'Materia Prima': 0, 'Mano de Obra': 0, Servicios: 0, 'Costos Indirectos': 0, Otros: 0 }
    cultivosFinca.forEach((c) => {
      const detalle = Agro.getDetalleCultivo(c.id)
      ;(detalle.costos || []).forEach((k) => {
        const key = categorias[k.categoria] != null ? k.categoria : 'Otros'
        categorias[key] += Agro.parseMoney(k.valor)
      })
    })
    const labels = Object.keys(categorias)
    const dataVals = labels.map((k) => categorias[k])
    destroyIfExists(canvas)
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: dataVals,
            backgroundColor: ['#16a085', '#e74c3c', '#9b59b6', '#f39c12', '#95a5a6'],
            borderColor: 'white',
            borderWidth: 3,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right' } } },
    })
  }

  if (chartRentabilidad?.current) {
    const canvas = chartRentabilidad.current
    const labels = cultivosFinca.map((c) => c.nombre)
    const ingresos = cultivosFinca.map((c) => Agro.computeCultivoIngresos(c.id))
    const costos = cultivosFinca.map((c) => Agro.computeCultivoCostos(c.id))
    const ganancia = ingresos.map((x, i) => x - costos[i])
    destroyIfExists(canvas)
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
        scales: { y: { ticks: { callback: (v) => '$' + v.toLocaleString() } } },
      },
    })
  }
}

export function updateRentabilidadCharts(Agro, fincaId, refs) {
  const { chartRentabilidadDetallada, chartComparativaIngresosCostos } = refs
  const cultivosFinca = Agro.getCultivosByFinca(fincaId)
  const labels = cultivosFinca.map((c) => c.nombre)
  const rows = cultivosFinca.map((c) => {
    const ingresos = Agro.computeCultivoIngresos(c.id)
    const costos = Agro.computeCultivoCostos(c.id)
    const ganancia = ingresos - costos
    const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0
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
            data: rows.map((r) => Number(r.margen.toFixed(1))),
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
        scales: { x: { ticks: { callback: (v) => v + '%' } } },
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
            pointBackgroundColor: '#27ae60',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
          },
          {
            label: 'Costos',
            data: rows.map((r) => r.costos),
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
            pointBackgroundColor: '#e74c3c',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: { y: { ticks: { callback: (v) => '$' + v.toLocaleString() } } },
      },
    })
  }
}
