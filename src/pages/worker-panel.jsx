import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Agro from '../services/agroData'
import { clearTokens } from '../services/authSession'
import { logoutUser } from '../services/authApi'
import useAuthSession from '../hooks/useAuthSession'
import { getInventarioElementos } from '../utils/inventarioElementos'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import '../styles/admin-panel.css'

const SECTION_TITLES = { inicio: 'Inicio', cultivos: 'Mis Cultivos' }

function etapaClassName(nombre) {
  return nombre
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
}

function parseCostoFecha(fechaStr) {
  const [dia, mes, ano] = fechaStr.split('/')
  return new Date(Number(ano), Number(mes) - 1, Number(dia))
}

function normEtapaKey(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ /g, '-')
}

export default function WorkerPanel() {
  const navigate = useNavigate()
  const session = useAuthSession()

  const worker = useMemo(() => {
    if (!session || session.role !== 'worker') return null

    if (session.workerKey) {
      const foundByKey = Agro.getTrabajadorByKey(session.workerKey)
      if (foundByKey) return foundByKey
    }

    if (session.email) {
      const foundByEmail = Agro.getTrabajadorByEmail(session.email)
      if (foundByEmail) return foundByEmail
    }

    return {
      id: session.id,
      nombre: session.nombre,
      apellidos: session.apellidos || '',
      email: session.email,
    }
  }, [session])

  const [activeSection, setActiveSection] = useState(() => localStorage.getItem('workerActiveSection') || 'inicio')
  const [fincaId, setFincaId] = useState('')
  const [pageTitle, setPageTitle] = useState(() => {
    const section = localStorage.getItem('workerActiveSection') || 'inicio'
    return section === 'inicio' ? 'Inicio - Mi panel' : SECTION_TITLES[section] || 'Inicio - Mi panel'
  })
  const [selectedCultivo, setSelectedCultivo] = useState(null)

  const [filterCat, setFilterCat] = useState('todos')
  const [filterEtapa, setFilterEtapa] = useState('todos')
  const [filterDesde, setFilterDesde] = useState('')
  const [filterHasta, setFilterHasta] = useState('')

  const [elementosOpen, setElementosOpen] = useState(false)
  const [elementosRows, setElementosRows] = useState([])

  const fincasAsignadas = useMemo(() => (worker ? Agro.getTrabajadorFincas(worker.id) : []), [worker])

  useEffect(() => {
    if (!session || session.role !== 'worker') {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  const validFincaId = useMemo(() => {
    if (!worker || fincasAsignadas.length === 0) return ''
    if (fincaId && fincasAsignadas.some((f) => f.id === fincaId)) return fincaId
    return fincasAsignadas[0].id
  }, [worker, fincasAsignadas, fincaId])

  const cultivosFinca = useMemo(() => {
    if (!worker || !validFincaId) return []
    return Agro.getTrabajadorCultivos(worker.id, validFincaId)
  }, [worker, validFincaId])

  const stats = useMemo(() => {
    if (!worker || !validFincaId) {
      return { total: 0, enProceso: 0, finalizados: 0, fincas: 0 }
    }
    const list = Agro.getTrabajadorCultivos(worker.id, validFincaId)
    return {
      total: list.length,
      enProceso: list.filter((c) => c.estado === 'en-proceso').length,
      finalizados: list.filter((c) => c.estado === 'finalizado').length,
      fincas: Agro.getTrabajadorFincas(worker.id).length,
    }
  }, [worker, validFincaId])

  const resumenRows = useMemo(() => {
    if (!worker || !validFincaId) return []
    return Agro.getTrabajadorCultivos(worker.id, validFincaId).filter((c) => c.estado === 'en-proceso')
  }, [worker, validFincaId])

  const costosSource = useMemo(
    () => (selectedCultivo ? (Agro.getDetalleCultivo(selectedCultivo.id).costos || []) : []),
    [selectedCultivo],
  )

  const filteredCostos = useMemo(() => {
    let list = costosSource
    if (filterCat !== 'todos') {
      list = list.filter((costo) => costo.categoria.toLowerCase().replace(/ /g, '-') === filterCat)
    }
    if (filterEtapa !== 'todos') {
      list = list.filter((costo) => normEtapaKey(costo.etapa) === filterEtapa)
    }
    if (filterDesde || filterHasta) {
      list = list.filter((costo) => {
        const fechaCosto = parseCostoFecha(costo.fecha)
        if (filterDesde) {
          const desde = new Date(filterDesde)
          if (fechaCosto < desde) return false
        }
        if (filterHasta) {
          const hasta = new Date(filterHasta)
          if (fechaCosto > hasta) return false
        }
        return true
      })
    }
    return list
  }, [costosSource, filterCat, filterEtapa, filterDesde, filterHasta])

  const costosTotales = useMemo(() => {
    let total = 0
    filteredCostos.forEach((c) => {
      total += Agro.parseMoney(c.valor)
    })
    return { total, count: filteredCostos.length }
  }, [filteredCostos])

  const detalle = selectedCultivo ? Agro.getDetalleCultivo(selectedCultivo.id) : null

  const switchSection = useCallback(
    (sectionId) => {
      if (sectionId !== 'detalle-cultivo') {
        setSelectedCultivo(null)
        setFilterCat('todos')
        setFilterEtapa('todos')
        setFilterDesde('')
        setFilterHasta('')
      }
      setActiveSection(sectionId)
      if (SECTION_TITLES[sectionId]) {
        setPageTitle(SECTION_TITLES[sectionId] === 'Inicio' ? 'Inicio - Mi panel' : SECTION_TITLES[sectionId])
      }
    },
    [],
  )

  const openCultivoDetail = (cultivo) => {
    setSelectedCultivo(cultivo)
    setFilterCat('todos')
    setFilterEtapa('todos')
    setFilterDesde('')
    setFilterHasta('')
    setActiveSection('detalle-cultivo')
    setPageTitle(`Cultivo de ${cultivo.nombre}`)
    setElementosOpen(false)
  }

  const backToCultivos = () => {
    setSelectedCultivo(null)
    setElementosOpen(false)
    switchSection('cultivos')
    setPageTitle('Mis Cultivos')
  }

  const onLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Llamar al endpoint de logout para cerrar sesión en el servidor
      await logoutUser()

      // Limpiar tokens en el cliente
      clearTokens()
      navigate('/', { replace: true })
    }
  }

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openInventario = (descripcion) => {
    setElementosRows(getInventarioElementos(descripcion, 'cultivo'))
    setElementosOpen(true)
    setTimeout(() => document.getElementById('elementos-inventario-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const navItems = [
    {
      title: 'Principal',
      links: [{ section: 'inicio', label: 'Inicio', icon: '🏡' }],
    },
    {
      title: 'Gestión',
      links: [{ section: 'cultivos', label: 'Cultivos', icon: '🌱' }],
    },
  ]

  useEffect(() => {
    localStorage.setItem('workerActiveSection', activeSection)
  }, [activeSection])

  const workerFullName = [worker?.nombre, worker?.apellidos].filter(Boolean).join(' ') || worker?.email || 'Cuenta'

  if (!worker) {
    return null
  }

  return (
    <div className="container">
      <Sidebar
        roleSubtitle="Rol: Trabajador"
        fincaOptions={fincasAsignadas}
        fincaValue={validFincaId}
        onFincaChange={(id) => setFincaId(id)}
        navItems={navItems}
        activeNavSection={activeSection === 'detalle-cultivo' ? null : activeSection}
        onNavClick={(sectionId) => switchSection(sectionId)}
        accountName={workerFullName}
        accountEmail={worker.email}
        onLogout={onLogout}
      />

      <main className="main-content">
        <Header
          title={pageTitle}
          showNavCultivo={activeSection === 'detalle-cultivo'}
          onScrollToSection={scrollToSection}
        />

        <div className="content-container">
          <section id="inicio-section" className={`content-section ${activeSection === 'inicio' ? 'active' : ''}`}>
            <div className="welcome-container">
              <h2 id="welcomeMessage">¡Bienvenido, {workerFullName}!</h2>
              <p className="welcome-subtitle">Estadísticas de tus cultivos</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🌱</div>
                <div className="stat-info">
                  <h4>Cultivos Asignados</h4>
                  <p className="stat-value" id="estatCultivosAsignados">
                    {stats.total}
                  </p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h4>En Proceso</h4>
                  <p className="stat-value" id="estatCultivosEnProceso">
                    {stats.enProceso}
                  </p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✨</div>
                <div className="stat-info">
                  <h4>Finalizados</h4>
                  <p className="stat-value" id="estatCultivosFinalizados">
                    {stats.finalizados}
                  </p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h4>Total de Fincas</h4>
                  <p className="stat-value" id="estatFincasAsignadas">
                    {stats.fincas}
                  </p>
                </div>
              </div>
            </div>

            <div className="info-section" style={{ marginTop: 40 }}>
              <div className="section-info-header">
                <h3>Tus Cultivos Actuales</h3>
              </div>
              <div className="table-container resumen">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cultivo</th>
                      <th>Tipo</th>
                      <th>Fecha Inicio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody id="cultivos-resumen-tbody">
                    {resumenRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>
                          Sin cultivos asignados
                        </td>
                      </tr>
                    ) : (
                      resumenRows.map((c) => (
                        <tr key={c.id}>
                          <td data-field="nombre">{c.nombre}</td>
                          <td data-field="tipo">{c.tipo}</td>
                          <td data-field="fecha-inicio">{c.fechaInicio}</td>
                          <td data-field="estado">
                            <span className={`status-badge status-${c.estado}`}>{c.estado.replace('-', ' ')}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="cultivos-section" className={`content-section ${activeSection === 'cultivos' ? 'active' : ''}`}>
            <div className="section-header">
              <div className="search-wrapper">
                <input type="text" className="search-input" placeholder="Buscar por nombre..." readOnly />
                <button type="button" className="btn-search">
                  Buscar
                </button>
              </div>
              <div className="filter-wrapper">
                <label className="filter-label">Filtrar por estado:</label>
                <select className="filter-select" defaultValue="todos">
                  <option value="todos">Todos</option>
                  <option value="en-proceso">En Proceso</option>
                  <option value="en-pausa">En Pausa</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr className="table-title-row">
                    <th colSpan={6}>Cultivos Asignados</th>
                  </tr>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Final</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="cultivos-tbody">
                  {cultivosFinca.map((cultivo) => (
                    <tr
                      key={cultivo.id}
                      className="data-item cultivo-clickeable"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        if (e.target.closest('.action-buttons')) return
                        openCultivoDetail(cultivo)
                      }}
                    >
                      <td data-field="nombre">{cultivo.nombre}</td>
                      <td data-field="tipo">{cultivo.tipo}</td>
                      <td data-field="fecha-siembra">{cultivo.fechaInicio}</td>
                      <td data-field="fecha-cosecha">{cultivo.fechaCosecha || '--'}</td>
                      <td data-field="estado">
                        <span className={`status-badge status-${cultivo.estado}`}>{cultivo.estado.replace('-', ' ')}</span>
                      </td>
                      <td data-field="acciones">
                        <div className="action-buttons">
                          <button type="button" className="btn-icon btn-view" title="Ver detalles">
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="detalle-cultivo-section" className={`content-section ${activeSection === 'detalle-cultivo' ? 'active' : ''}`}>
            <div className="section-header">
              <button type="button" className="btn-back" id="btn-back-cultivos" onClick={backToCultivos}>
                ← Volver a Cultivos
              </button>
            </div>

            {selectedCultivo ? (
              <>
                <div className="cultivo-estado-container">
                  <label className="estado-label">Estado:</label>
                  <span id="cultivo-estado-badge" className={`status-badge status-${selectedCultivo.estado}`}>
                    {selectedCultivo.estado.replace('-', ' ').charAt(0).toUpperCase() +
                      selectedCultivo.estado.replace('-', ' ').slice(1)}
                  </span>
                </div>

                <div className="info-section" id="etapas-section">
                  <div className="section-info-header">
                    <h3>Etapas</h3>
                    <button type="button" className="btn-add btn-primary">
                      + Agregar Nueva Etapa
                    </button>
                  </div>
                  <div className="search-filter-wrapper">
                    <div className="search-wrapper">
                      <input type="text" className="search-input" placeholder="Buscar por nombre..." readOnly />
                      <button type="button" className="btn-search">
                        Buscar
                      </button>
                    </div>
                    <div className="filter-wrapper">
                      <label className="filter-label">Filtrar por estado:</label>
                      <select className="filter-select" defaultValue="todos">
                        <option value="todos">Todos</option>
                        <option value="en-proceso">En Proceso</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                    </div>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr className="table-title-row">
                          <th colSpan={6}>Etapas Registradas</th>
                        </tr>
                        <tr>
                          <th>Nombre</th>
                          <th>Descripción</th>
                          <th>Fecha Inicio</th>
                          <th>Fecha Final</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody id="etapas-tbody">
                        {(detalle?.etapas || []).map((etapa, i) => (
                          <tr key={i} className="data-item">
                            <td data-field="nombre">
                              <span className={`etapa-badge etapa-${etapaClassName(etapa.nombre)}`}>{etapa.nombre}</span>
                            </td>
                            <td data-field="descripcion">{etapa.descripcion}</td>
                            <td data-field="fecha-inicio">{etapa.fechaInicio}</td>
                            <td data-field="fecha-final">{etapa.fechaFinal}</td>
                            <td data-field="estado">
                              <span className={`status-badge status-${etapa.estado}`}>{etapa.estado.replace('-', ' ')}</span>
                            </td>
                            <td data-field="acciones">
                              <div className="action-buttons">
                                <button type="button" className="btn-icon btn-edit" title="Editar">
                                  ✏️
                                </button>
                                <button type="button" className="btn-icon btn-delete" title="Eliminar">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="info-section" id="cosechas-section">
                  <div className="section-info-header">
                    <h3>Cosechas</h3>
                    <button type="button" className="btn-add btn-primary">
                      + Agregar Nueva Cosecha
                    </button>
                  </div>
                  <div className="search-filter-wrapper">
                    <div className="filter-wrapper">
                      <label className="filter-label">Filtrar por fecha:</label>
                      <input type="date" className="filter-date" readOnly />
                    </div>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr className="table-title-row">
                          <th colSpan={6}>Cosechas Realizadas</th>
                        </tr>
                        <tr>
                          <th>Fecha</th>
                          <th>Cantidad</th>
                          <th>Unidad Medida</th>
                          <th>Precio</th>
                          <th>Tipo Precio</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody id="cosechas-tbody">
                        {(detalle?.cosechas || []).map((cosecha, i) => (
                          <tr key={i} className="data-item">
                            <td data-field="fecha">{cosecha.fecha}</td>
                            <td data-field="cantidad">{cosecha.cantidad}</td>
                            <td data-field="unidad">{cosecha.unidad}</td>
                            <td data-field="precio">{cosecha.precio}</td>
                            <td data-field="tipo-precio">{cosecha.tipoPrecio}</td>
                            <td data-field="acciones">
                              <div className="action-buttons">
                                <button type="button" className="btn-icon btn-edit" title="Editar">
                                  ✏️
                                </button>
                                <button type="button" className="btn-icon btn-delete" title="Eliminar">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="info-section" id="costos-cultivo-section">
                  <div className="section-info-header">
                    <h3>Costos del Cultivo</h3>
                    <button type="button" className="btn-add btn-primary">
                      + Agregar Nuevo Costo
                    </button>
                  </div>
                  <div className="search-filter-wrapper">
                    <div className="filter-wrapper">
                      <label className="filter-label">Filtrar por etapa:</label>
                      <select className="filter-select filter-etapa-costos" value={filterEtapa} onChange={(e) => setFilterEtapa(e.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="preparacion">Preparación</option>
                        <option value="siembra">Siembra</option>
                        <option value="crecimiento">Crecimiento</option>
                        <option value="en-produccion">En Producción</option>
                        <option value="cosecha">Cosecha</option>
                      </select>
                    </div>
                    <div className="filter-wrapper">
                      <label className="filter-label">Filtrar por categoría:</label>
                      <select className="filter-select filter-categoria-costos" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="mano-obra">Mano de Obra</option>
                        <option value="materia-prima">Materia Prima</option>
                        <option value="servicios">Servicios</option>
                        <option value="costos-indirectos">Costos Indirectos</option>
                      </select>
                    </div>
                    <div className="filter-wrapper" style={{ width: '100%' }}>
                      <label className="filter-label">Rango de fechas:</label>
                      <div className="date-range">
                        <input type="date" className="filter-date filter-fecha-desde" value={filterDesde} onChange={(e) => setFilterDesde(e.target.value)} />
                        <span className="date-separator">-</span>
                        <input type="date" className="filter-date filter-fecha-hasta" value={filterHasta} onChange={(e) => setFilterHasta(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="totales-bar">
                    <span className="total-item">
                      Total:{' '}
                      <strong id="total-costos">{Agro.formatCOP(costosTotales.total)}</strong>
                    </span>
                    <span className="total-item">
                      Registros:{' '}
                      <strong id="total-registros">{costosTotales.count}</strong>
                    </span>
                  </div>

                  <div className="table-container">
                    <table className="data-table costos-table">
                      <thead>
                        <tr className="table-title-row">
                          <th colSpan={7} style={{ backgroundColor: 'var(--bg-header)' }}>
                            Costos Registrados del Cultivo
                          </th>
                        </tr>
                        <tr style={{ backgroundColor: 'var(--bg-header)' }}>
                          <th>Fecha</th>
                          <th>Usuario</th>
                          <th>Categoría</th>
                          <th>Etapa</th>
                          <th>Descripción</th>
                          <th>Valor</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody id="costos-cultivo-tbody">
                        {filteredCostos.map((costo, i) => (
                          <tr
                            key={i}
                            className={`data-item ${costo.categoria === 'Materia Prima' ? 'clickeable-materia-prima' : ''}`}
                            style={{ cursor: costo.categoria === 'Materia Prima' ? 'pointer' : undefined }}
                            onClick={(e) => {
                              if (costo.categoria !== 'Materia Prima') return
                              if (e.target.closest('.action-buttons')) return
                              openInventario(costo.descripcion)
                            }}
                          >
                            <td data-field="fecha">{costo.fecha}</td>
                            <td data-field="usuario">{costo.usuario}</td>
                            <td data-field="categoria">
                              <span className={`categoria-badge cat-${costo.categoria.toLowerCase().replace(/ /g, '-')}`}>{costo.categoria}</span>
                            </td>
                            <td data-field="etapa">{costo.etapa}</td>
                            <td data-field="descripcion">{costo.descripcion}</td>
                            <td data-field="valor">{costo.valor}</td>
                            <td data-field="acciones">
                              <div className="action-buttons">
                                <button type="button" className="btn-icon btn-edit" title="Editar">
                                  ✏️
                                </button>
                                <button type="button" className="btn-icon btn-delete" title="Eliminar">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div id="elementos-inventario-section" className="info-section" style={{ display: elementosOpen ? 'block' : 'none' }}>
                  <div className="section-info-header">
                    <h3>Información del Inventario </h3>
                    <button type="button" className="btn-close-elements" id="btn-close-elementos" onClick={() => setElementosOpen(false)}>
                      ✕ Cerrar
                    </button>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr className="table-title-row">
                          <th colSpan={5} style={{ backgroundColor: 'var(--bg-header)' }}>
                            Elementos usados del inventario
                          </th>
                        </tr>
                        <tr style={{ backgroundColor: 'var(--bg-header)' }}>
                          <th>Producto</th>
                          <th>Precio Producto</th>
                          <th>Cantidad Usada</th>
                          <th>Medida Usada</th>
                          <th>Costo Total</th>
                        </tr>
                      </thead>
                      <tbody id="elementos-inventario-tbody">
                        {elementosRows.map((el, idx) => (
                          <tr key={idx} className="data-item">
                            <td data-field="producto">{el.producto}</td>
                            <td data-field="precio">{el.precioFmt}</td>
                            <td data-field="cantidad">{el.cantidad}</td>
                            <td data-field="medida">{el.medida}</td>
                            <td data-field="total">{el.totalFmt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}
