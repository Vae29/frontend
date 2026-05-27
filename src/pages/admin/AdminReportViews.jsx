import * as Agro from '../../services/agroData'

export function AdminReportTable({ fincaId, reportType, reportData }) {
  // If reportData is provided by backend, prefer it. Otherwise fallback to local Agro mock data.
  const data = reportData || null
  const cultivosFinca = data && reportType === 'por-cultivo' ? data : Agro.getCultivosByFinca(fincaId)
  const resumen = data && reportType === 'por-cultivo' ?
    {
      produccionKg: data.reduce((a, r) => a + (Number(r.total_produccion) || 0), 0),
      ingresos: data.reduce((a, r) => a + (Number(r.total_ingresos) || 0), 0),
      costos: data.reduce((a, r) => a + (Number(r.total_costos) || 0), 0),
    } : Agro.computeFincaResumen(fincaId)

  if (reportType === 'por-cultivo') {
    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte por Cultivo</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Total Cultivos</label>
            <div className="valor">{cultivosFinca.length}</div>
          </div>
          <div className="resumen-item">
            <label>Cultivos Activos</label>
            <div className="valor">{cultivosFinca.filter((c) => c.estado !== 'finalizado').length}</div>
          </div>
          <div className="resumen-item">
            <label>Producción Total</label>
            <div className="valor">{resumen.produccionKg.toLocaleString('es-CO')} kg</div>
          </div>
          <div className="resumen-item">
            <label>Ingresos Totales</label>
            <div className="valor">{Agro.formatCOP(resumen.ingresos)}</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cultivo</th>
              <th>Estado</th>
              <th>Producción</th>
              <th>Costos</th>
              <th>Ingresos</th>
              <th>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(cultivosFinca) && cultivosFinca.length === 0) ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>
                  Sin cultivos en la finca seleccionada
                </td>
              </tr>
            ) : (
              (reportData && reportType === 'por-cultivo'
                ? reportData.map((c, idx) => (
                    <tr key={c.id || idx}>
                      <td>{c.cultivo}</td>
                      <td>{/* estado no siempre viene desde consulta */}</td>
                      <td>{Number(c.total_produccion || 0).toLocaleString('es-CO')} kg</td>
                      <td>{Agro.formatCOP(Number(c.total_costos || 0))}</td>
                      <td>{Agro.formatCOP(Number(c.total_ingresos || 0))}</td>
                      <td>{Agro.formatCOP(Number((c.total_ingresos || 0) - (c.total_costos || 0)))}</td>
                    </tr>
                  ))
                : cultivosFinca.map((c) => {
                    const ingresos = Agro.computeCultivoIngresos(c.id)
                    const costos = Agro.computeCultivoCostos(c.id)
                    const ganancia = ingresos - costos
                    const produccion = (Agro.getDetalleCultivo(c.id).cosechas || []).reduce((a, x) => a + (Number(x.cantidad) || 0), 0)
                    return (
                      <tr key={c.id}>
                        <td>{c.nombre}</td>
                        <td>
                          <span className={`status-badge status-${c.estado}`}>{c.estado.replace('-', ' ')}</span>
                        </td>
                        <td>{produccion.toLocaleString('es-CO')} kg</td>
                        <td>{Agro.formatCOP(costos)}</td>
                        <td>{Agro.formatCOP(ingresos)}</td>
                        <td>{Agro.formatCOP(ganancia)}</td>
                      </tr>
                    )
                  }))
            )}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'costos') {
    const rows = []
    if (reportData && reportType === 'costos') {
      // usar datos provenientes del backend
      const total = reportData.reduce((a, r) => a + Number(r.valor || r.valor || 0), 0)
      const displayRows = reportData.length ? reportData : [{ categoria: '--', cultivo: '--', descripcion: 'Sin costos', valor: '$0', fecha: '--' }]
      return (
        <div>
          <div className="reporte-header">
            <h3>Reporte de Costos</h3>
          </div>
          <div className="reporte-resumen">
            <div className="resumen-item">
              <label>Total Costos</label>
              <div className="valor">{Agro.formatCOP(total)}</div>
            </div>
            <div className="resumen-item">
              <label>Costos Generales</label>
              <div className="valor">{Agro.formatCOP(0)}</div>
            </div>
            <div className="resumen-item">
              <label>Costos por Cultivo</label>
              <div className="valor">{Agro.formatCOP(total)}</div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Cultivo</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.categoria}</td>
                  <td>{r.cultivo}</td>
                  <td>{r.descripcion}</td>
                  <td>{Agro.formatCOP(Number(r.valor || 0))}</td>
                  <td>{r.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    // fallback to client-side implementation
    cultivosFinca.forEach((c) => {
      const detalle = Agro.getDetalleCultivo(c.id)
      ;(detalle.costos || []).forEach((cost) => {
        rows.push({ cultivo: c.nombre, ...cost })
      })
    })
    const total = rows.reduce((a, x) => a + Agro.parseMoney(x.valor), 0)
    const displayRows =
      rows.length > 0 ? rows : [{ categoria: '--', cultivo: '--', descripcion: 'Sin costos', valor: '$0', fecha: '--' }]

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte de Costos</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Total Costos</label>
            <div className="valor">{Agro.formatCOP(total)}</div>
          </div>
          <div className="resumen-item">
            <label>Costos Generales</label>
            <div className="valor">{Agro.formatCOP(0)}</div>
          </div>
          <div className="resumen-item">
            <label>Costos por Cultivo</label>
            <div className="valor">{Agro.formatCOP(total)}</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Cultivo</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r, i) => (
              <tr key={i}>
                <td>{r.categoria}</td>
                <td>{r.cultivo}</td>
                <td>{r.descripcion}</td>
                <td>{r.valor}</td>
                <td>{r.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'produccion') {
    const cosechas = []
    if (reportData && reportType === 'produccion') {
      // backend returns rows: { cultivo, cantidad, fecha, precio_unitario }
      reportData.forEach((r) => cosechas.push({ cultivo: r.cultivo, cantidad: r.cantidad, unidad: r.unidad || 'kg', fecha: r.fecha, precio: r.precio_unitario || 0, ingreso: (Number(r.cantidad) || 0) * (Number(r.precio_unitario) || 0) }))
    } else {
      cultivosFinca.forEach((c) => {
        const detalle = Agro.getDetalleCultivo(c.id)
        ;(detalle.cosechas || []).forEach((x) => {
          const ingreso = (Number(x.cantidad) || 0) * Agro.parseMoney(x.precio)
          cosechas.push({ cultivo: c.nombre, ...x, ingreso })
        })
      })
    }
    const prodTotal = cosechas.reduce((a, x) => a + (Number(x.cantidad) || 0), 0)
    const display = cosechas.length > 0 ? cosechas : [{ cultivo: '--', cantidad: 0, unidad: 'kg', fecha: '--', precio: '$0', ingreso: 0 }]

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte de Producción</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Producción Total</label>
            <div className="valor">{prodTotal.toLocaleString('es-CO')} kg</div>
          </div>
          <div className="resumen-item">
            <label>Cosechas Realizadas</label>
            <div className="valor">{cosechas.length}</div>
          </div>
          <div className="resumen-item">
            <label>Promedio por Cosecha</label>
            <div className="valor">
              {cosechas.length ? Math.round(prodTotal / cosechas.length).toLocaleString('es-CO') : 0} kg
            </div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cultivo</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Fecha Cosecha</th>
              <th>Precio Unitario</th>
              <th>Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {display.map((c, i) => (
              <tr key={i}>
                <td>{c.cultivo}</td>
                <td>{(Number(c.cantidad) || 0).toLocaleString('es-CO')}</td>
                <td>{c.unidad || 'kg'}</td>
                <td>{c.fecha}</td>
                <td>{c.precio}</td>
                <td>{Agro.formatCOP(Number(c.ingreso) || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'rentabilidad') {
    let rows = []
    if (reportData && reportType === 'rentabilidad') {
      rows = reportData.map((r) => ({ cultivo: r.cultivo, ingresos: Number(r.total_ingresos || 0), costos: Number(r.total_costos || 0), ganancia: Number(r.ganancia || 0), margen: r.total_ingresos ? ((Number(r.ganancia || 0) / Number(r.total_ingresos || 1)) * 100) : 0 }))
    } else {
      rows = cultivosFinca.map((c) => {
        const ingresos = Agro.computeCultivoIngresos(c.id)
        const costos = Agro.computeCultivoCostos(c.id)
        const ganancia = ingresos - costos
        const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0
        return { cultivo: c.nombre, ingresos, costos, ganancia, margen }
      })
    }
    const gananciaTotal = rows.reduce((a, x) => a + x.ganancia, 0)
    const ingresosTotal = rows.reduce((a, x) => a + x.ingresos, 0)
    const margenProm = ingresosTotal > 0 ? (gananciaTotal / ingresosTotal) * 100 : 0
    const top = rows.slice().sort((a, b) => b.margen - a.margen)[0]
    const display = rows.length > 0 ? rows : [{ cultivo: '--', ingresos: 0, costos: 0, ganancia: 0, margen: 0 }]

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte de Rentabilidad</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Ganancia Total</label>
            <div className="valor">{Agro.formatCOP(gananciaTotal)}</div>
          </div>
          <div className="resumen-item">
            <label>Margen Promedio</label>
            <div className="valor">{Number(margenProm || 0).toFixed(1)}%</div>
          </div>
          <div className="resumen-item">
            <label>Cultivo Más Rentable</label>
            <div className="valor">{top ? top.cultivo : '--'}</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cultivo</th>
              <th>Ingresos</th>
              <th>Costos</th>
              <th>Ganancia</th>
              <th>Margen %</th>
            </tr>
          </thead>
          <tbody>
            {display.map((r, i) => (
              <tr key={i}>
                <td>{r.cultivo}</td>
                <td>{Agro.formatCOP(r.ingresos)}</td>
                <td>{Agro.formatCOP(r.costos)}</td>
                <td>{Agro.formatCOP(r.ganancia)}</td>
                <td>{Number(r.margen || 0).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'trabajador') {
    let displayRows = []
    let totalTrabajadores = 0

    if (reportData && reportType === 'trabajador' && Array.isArray(reportData)) {
      displayRows = reportData.map((r) => ({
        nombre: r.nombre,
        actividades: r.actividades || '--',
        total_costos: r.total_costos || 0,
        cultivos: r.cultivos_asignados || 0,
      }))
      totalTrabajadores = displayRows.length
    } else {
      displayRows = [{ nombre: '--', actividades: '--', total_costos: '--', cultivos: 0 }]
    }

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte por Trabajador</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Total Trabajadores</label>
            <div className="valor">{totalTrabajadores}</div>
          </div>
          <div className="resumen-item">
            <label>Actividades Registradas</label>
            <div className="valor">--</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Trabajador</th>
              <th>Actividades</th>
              <th>Costos Registrados</th>
              <th>Cultivos Asignados</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r, i) => (
              <tr key={i}>
                <td>{r.nombre}</td>
                <td>{r.actividades ?? '--'}</td>
                <td>{r.total_costos ? Agro.formatCOP(Number(r.total_costos)) : '--'}</td>
                <td>{r.cultivos ?? r.cultivos_asignados ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return null
}
