import * as Agro from '../../services/agroData'

export function AdminReportTable({ reportType, reportData }) {
  const data = Array.isArray(reportData) ? reportData : []
  const resumen = {
    produccionKg: data.reduce((total, row) => total + (Number(row.total_produccion) || 0), 0),
    ingresos: data.reduce((total, row) => total + (Number(row.total_ingresos) || 0), 0),
  }

  if (reportType === 'por-cultivo') {
    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte por Cultivo</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Total Cultivos</label>
              <div className="valor">{data.length}</div>
          </div>
          <div className="resumen-item">
            <label>Cultivos Activos</label>
              <div className="valor">{data.filter((crop) => String(crop.estado || '').toLowerCase() !== 'finalizado').length}</div>
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
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>
                  Sin resultados para los filtros seleccionados
                </td>
              </tr>
            ) : (
              data.map((crop) => (
                <tr key={crop.id}>
                  <td>{crop.cultivo}</td>
                  <td>{crop.estado || '--'}</td>
                  <td>{Number(crop.total_produccion || 0).toLocaleString('es-CO')} kg</td>
                  <td>{Agro.formatCOP(Number(crop.total_costos || 0))}</td>
                  <td>{Agro.formatCOP(Number(crop.total_ingresos || 0))}</td>
                  <td>{Agro.formatCOP(Number(crop.ganancia ?? (Number(crop.total_ingresos || 0) - Number(crop.total_costos || 0))))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'costos') {
    const total = data.reduce((sum, row) => sum + (Number(row.valor) || 0), 0)

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
                <th>Subcategoría</th>
              <th>Cultivo</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Sin resultados para los filtros seleccionados</td></tr>
            ) : data.map((r, i) => (
              <tr key={i}>
                <td>{r.categoria}</td>
                <td>{r.subcategoria || '--'}</td>
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
    const cosechas = data.map((row) => ({
      cultivo: row.cultivo,
      cantidad: row.cantidad,
      unidad: row.unidad || 'kg',
      fecha: row.fecha,
      precio: row.precio_unitario || 0,
      ingreso: (Number(row.cantidad) || 0) * (Number(row.precio_unitario) || 0),
    }))
    const prodTotal = cosechas.reduce((a, x) => a + (Number(x.cantidad) || 0), 0)

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
            {cosechas.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Sin resultados para los filtros seleccionados</td></tr>
            ) : cosechas.map((c, i) => (
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
    const rows = data.map((row) => ({
      cultivo: row.cultivo,
      ingresos: Number(row.total_ingresos || 0),
      costos: Number(row.total_costos || 0),
      ganancia: Number(row.ganancia || 0),
      margen: row.total_ingresos ? ((Number(row.ganancia || 0) / Number(row.total_ingresos || 1)) * 100) : 0,
    }))
    const gananciaTotal = rows.reduce((a, x) => a + x.ganancia, 0)
    const ingresosTotal = rows.reduce((a, x) => a + x.ingresos, 0)
    const margenProm = ingresosTotal > 0 ? (gananciaTotal / ingresosTotal) * 100 : 0
    const top = rows.slice().sort((a, b) => b.margen - a.margen)[0]

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
            {rows.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Sin resultados para los filtros seleccionados</td></tr>
            ) : rows.map((r, i) => (
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
    const displayRows = data.map((row) => ({
      nombre: row.nombre,
      actividades: row.actividades || '--',
      total_costos: row.total_costos || 0,
      cultivos: row.cultivos_asignados || 0,
    }))

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte por Trabajador</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Total Trabajadores</label>
              <div className="valor">{displayRows.length}</div>
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
            {displayRows.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Sin resultados para los filtros seleccionados</td></tr>
            ) : displayRows.map((r, i) => (
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
