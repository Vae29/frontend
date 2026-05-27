import * as Agro from '../../services/agroData'

export function AdminReportTable({ fincaId, reportType }) {
  const cultivosFinca = Agro.getCultivosByFinca(fincaId)
  const resumen = Agro.computeFincaResumen(fincaId)

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
            {cultivosFinca.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>
                  Sin cultivos en la finca seleccionada
                </td>
              </tr>
            ) : (
              cultivosFinca.map((c) => {
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
              })
            )}
          </tbody>
        </table>
      </div>
    )
  }

  if (reportType === 'costos') {
    const rows = []
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
    cultivosFinca.forEach((c) => {
      const detalle = Agro.getDetalleCultivo(c.id)
      ;(detalle.cosechas || []).forEach((x) => {
        const ingreso = (Number(x.cantidad) || 0) * Agro.parseMoney(x.precio)
        cosechas.push({ cultivo: c.nombre, ...x, ingreso })
      })
    })
    const prodTotal = cosechas.reduce((a, x) => a + (Number(x.cantidad) || 0), 0)
    const display =
      cosechas.length > 0
        ? cosechas
        : [{ cultivo: '--', cantidad: 0, unidad: 'kg', fecha: '--', precio: '$0', ingreso: 0 }]

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
    const rows = cultivosFinca.map((c) => {
      const ingresos = Agro.computeCultivoIngresos(c.id)
      const costos = Agro.computeCultivoCostos(c.id)
      const ganancia = ingresos - costos
      const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0
      return { cultivo: c.nombre, ingresos, costos, ganancia, margen }
    })
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
    const asg = Agro.asignaciones.filter((a) => a.fincaId === fincaId)
    const trabajadoresIds = Array.from(new Set(asg.map((a) => a.trabajadorId)))
    const rows = trabajadoresIds.map((id) => {
      const t = Agro.trabajadores.find((x) => x.id === id)
      const cultivosCount = asg
        .filter((a) => a.trabajadorId === id)
        .reduce((acc, x) => acc + (x.cultivoIds || []).length, 0)
      return { nombre: t ? t.nombre : `Trabajador ${id}`, cultivos: cultivosCount }
    })
    const display = rows.length > 0 ? rows : [{ nombre: '--', cultivos: 0 }]

    return (
      <div>
        <div className="reporte-header">
          <h3>Reporte por Trabajador</h3>
        </div>
        <div className="reporte-resumen">
          <div className="resumen-item">
            <label>Total Trabajadores</label>
            <div className="valor">{rows.length}</div>
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
            {display.map((r, i) => (
              <tr key={i}>
                <td>{r.nombre}</td>
                <td>--</td>
                <td>--</td>
                <td>{r.cultivos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return null
}
