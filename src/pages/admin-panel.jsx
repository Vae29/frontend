import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Agro from '../services/agroData'
import { clearSession, getSession } from '../services/authSession'
import { getInventarioElementos } from '../utils/inventarioElementos'
import { MODAL_TYPES, DEPARTAMENTOS, MUNICIPIOS_POR_DEPARTAMENTO } from '../utils/modalConfig'
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/authApi'
import { fetchFincas, createFinca, updateFinca, deleteFinca } from '../services/fincaService'
import { fetchDashboardForFinca } from '../services/dashboardService'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import DynamicModal from '../components/DynamicModal'
import { updateAdminDashboardCharts, updateRentabilidadCharts } from './admin/adminCharts'
import { AdminReportTable } from './admin/AdminReportViews'
import '../styles/dashboard.css'
import '../styles/admin-panel.css'
import Swal from 'sweetalert2'

const SECTION_TITLES = {
  dashboard: 'Dashboard',
  fincas: 'Gestión de Fincas',
  usuarios: 'Gestión de Usuarios',
  cultivos: 'Gestión de Cultivos',
  reportes: 'Reportes',
  costos: 'Costos Generales',
  rentabilidad: 'Análisis de Rentabilidad',
  alertas: 'Centro de Alertas',
}

// DEPARTAMENTOS y MUNICIPIOS centralizados en modalConfig

const ASIGNACIONES_BY_USUARIO = {
  2: [
    { finca: 'Finca Monterrey', cultivos: 'Naranja, Plátano' },
    { finca: 'Finca Miraflores', cultivos: 'Tomate' },
  ],
  3: [
    { finca: 'Finca Miraflores', cultivos: 'Naranja, Maíz' },
    { finca: 'Finca Monterrey', cultivos: 'Plátano' },
  ],
  4: [
    { finca: 'Finca Miraflores', cultivos: 'Tomate, Maíz' },
    { finca: 'Finca Monterrey', cultivos: 'Naranja' },
  ],
}

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

const COSTOS_GENERALES_ROWS = [
  {
    fecha: '10/04/2026',
    categoria: 'Mano de Obra',
    descripcion: 'Pago de jornales - Abril 2026',
    monto: '$1,200,000',
    estado: 'finalizado',
    estadoLabel: 'Pagado',
  },
  {
    fecha: '09/04/2026',
    categoria: 'Materia Prima',
    descripcion: 'Compra de fertilizante NPK 15-15-15',
    monto: '$850,000',
    estado: 'finalizado',
    estadoLabel: 'Pagado',
  },
  {
    fecha: '08/04/2026',
    categoria: 'Servicios',
    descripcion: 'Servicio fumigación - Control plagas',
    monto: '$450,000',
    estado: 'en-proceso',
    estadoLabel: 'Pendiente',
  },
  {
    fecha: '07/04/2026',
    categoria: 'Costos Indirectos',
    descripcion: 'Mantenimiento maquinaria agrícola',
    monto: '$320,000',
    estado: 'finalizado',
    estadoLabel: 'Pagado',
  },
]

export default function AdminPanel() {
  const navigate = useNavigate()
  const session = getSession()

  const [fincaId, setFincaId] = useState(() => Agro.getSelectedFincaId())
  const [activeSection, setActiveSection] = useState(() => {
    const s = localStorage.getItem('activeSection') || 'dashboard'
    if (s === 'detalle-cultivo') return 'cultivos'
    return s
  })
  const [pageTitle, setPageTitle] = useState(() => {
    const normalized = 'dashboard'
    return SECTION_TITLES[normalized] || 'Dashboard'
  })
  const [selectedCultivoId, setSelectedCultivoId] = useState(null)
  const [activeUsuarioId, setActiveUsuarioId] = useState(null)
  const [asignacionesOpen, setAsignacionesOpen] = useState(false)
  const [elementosCultivo, setElementosCultivo] = useState({ open: false, rows: [] })
  const [elementosGenerales, setElementosGenerales] = useState({ open: false, rows: [] })
  const [toast, setToast] = useState(null)
  const [reportVisible, setReportVisible] = useState(false)
  const [reportType, setReportType] = useState(null)
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroCultivo, setFiltroCultivo] = useState('')
  const [filtroCategoriaCosto, setFiltroCategoriaCosto] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroEstadoCultivo, setFiltroEstadoCultivo] = useState('')
  const [modalInitialData, setModalInitialData] = useState({})
  const [modalFieldOptions, setModalFieldOptions] = useState({})
  const [fincas, setFincas] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingFincas, setIsLoadingFincas] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState(null)
  const [editingFinca, setEditingFinca] = useState(null)
  const [fincasRefresh, setFincasRefresh] = useState(0)
  const [showDynamicModal, setShowDynamicModal] = useState(false)
  const [dynamicModalType, setDynamicModalType] = useState(null)
  // Usuario seleccionado y lista de usuarios (valery integration)
  const [editingUser, setEditingUser] = useState(null)
  const [users, setUsers] = useState([])

  const reportRef = useRef(null)
  const cpRef = useRef(null)
  const ccRef = useRef(null)
  const ccatRef = useRef(null)
  const crRef = useRef(null)
  const crdRef = useRef(null)
  const cicRef = useRef(null)

  useEffect(() => {
    if (!session || session.role !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  useEffect(() => {
    const handler = () => setFincaId(Agro.getSelectedFincaId())
    window.addEventListener('agro:fincaChanged', handler)
    return () => window.removeEventListener('agro:fincaChanged', handler)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Carga la lista de usuarios desde el backend al iniciar el componente.
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchUsers()
        if (response.success) {
          const usersWithNormalizedAssignments = response.data.map((user) => ({
            ...user,
            fincas: Array.isArray(user.fincas) ? user.fincas.map(Number).filter(Boolean) : [],
            cultivos: Array.isArray(user.cultivos) ? user.cultivos.map(Number).filter(Boolean) : [],
          }))
          setUsers(usersWithNormalizedAssignments)
        } else {
          console.error('Error al cargar usuarios:', response.message)
        }
      } catch (error) {
        console.error('Error en loadUsers:', error)
      }
    }

    loadUsers()
  }, [])

  const showNotification = useCallback((message, type = 'info') => {
    setToast({ message, type })
  }, [])

  const fetchDashboardData = useCallback(
    async (selectedFincaId) => {
      if (!selectedFincaId) return
      try {
        setIsLoadingDashboard(true)
        const data = await fetchDashboardForFinca(selectedFincaId)
        setDashboardData(data)
        setDashboardError(null)
      } catch (error) {
        console.error(error)
        setDashboardData(null)
        setDashboardError('No se pudo cargar el dashboard')
      } finally {
        setIsLoadingDashboard(false)
      }
    },
    []
  )

  const fetchFincasList = useCallback(
    async (search = '') => {
      try {
        setIsLoadingFincas(true)
        const lista = await fetchFincas(search)
        setFincas(lista)
        if (!fincaId && lista.length > 0) {
          setFincaId(String(lista[0].id))
        }
      } catch (error) {
        console.error(error)
        showNotification('No se pudo cargar la lista de fincas', 'error')
      } finally {
        setIsLoadingFincas(false)
      }
    },
    [fincaId, showNotification]
  )

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetchFincasList(searchTerm)
    }, 300)
    return () => window.clearTimeout(id)
  }, [searchTerm, fetchFincasList, fincasRefresh])

  useEffect(() => {
    fetchDashboardData(fincaId)
  }, [fincaId, fincasRefresh, fetchDashboardData])

  const handleBuscarFincas = () => {
    fetchFincasList(searchTerm)
  }

  const handleOpenFincaModal = (finca = null) => {
    // prepare modal options and initial data
    const [editDepartamento, editMunicipio] = (() => {
      if (!finca?.ubicacion) return ['', '']
      const parts = finca.ubicacion.split(',')
      const municipio = parts[0].trim()
      const departamento = parts.slice(1).join(',').trim()
      return [departamento, municipio]
    })()

    setEditingFinca(finca)
    setModalFieldOptions({
      departamento: DEPARTAMENTOS,
      municipio: MUNICIPIOS_POR_DEPARTAMENTO[editDepartamento] ? MUNICIPIOS_POR_DEPARTAMENTO[editDepartamento].map((m) => ({ value: m, label: m })) : [],
    })

    setModalInitialData({
      nombre: finca?.nombre || '',
      departamento: editDepartamento || '',
      municipio: editMunicipio || '',
    })

    setDynamicModalType(MODAL_TYPES.FINCA)
    setShowDynamicModal(true)
  }

  const handleDeleteFinca = async (id) => {
    const result = await Swal.fire({
      title: 'AgroGestion',
      text: '¿Seguro que deseas eliminar esta finca? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#ffffff',
      customClass: {
      cancelButton: 'custom-cancel-btn',
      confirmButton: 'custom-confirm-btn',
      }
    })

    if (!result.isConfirmed) return

    try {
      await deleteFinca(id)
      showNotification('Finca eliminada correctamente', 'success')
      setFincasRefresh((prev) => prev + 1)
    } catch (error) {
      console.error(error)
      const message = error?.response?.data?.error || 'Error eliminando la finca'
      showNotification(message, 'error')
    }
  }

  const handleOpenDynamicModal = (type) => {
    setDynamicModalType(type)
    // preparar opciones dinámicas (ej. para modal USUARIO)
    if (type === MODAL_TYPES.USUARIO) {
      ;(async () => {
        try {
          const fincasResponse = await fetchFincas()
          const fincasOptions = Array.isArray(fincasResponse)
            ? fincasResponse.map((finca) => ({ value: finca.id, label: finca.nombre }))
            : []

          const cultivosOptions = (Agro.cultivos || [])
            .filter((c) => c.estado !== 'finalizado')
            .map((c) => ({ value: c.id, label: c.nombre }))

          setModalFieldOptions({ fincas: fincasOptions, cultivos: cultivosOptions })
        } catch (err) {
          console.error(err)
        }
      })()
    }

    setShowDynamicModal(true)
  }

  const handleCloseDynamicModal = () => {
    setShowDynamicModal(false)
    setDynamicModalType(null)
    setModalFieldOptions({})
  }

  const handleSubmitDynamicModal = (formData) => {
    // Por ahora solo mostramos la notificación
    // Aquí es donde iría la lógica para guardar los datos según el tipo de modal
    let successMessage = ''

    switch (dynamicModalType) {
      case MODAL_TYPES.USUARIO:
        successMessage = `Usuario "${formData.nombre}" agregado exitosamente`
        break
      case MODAL_TYPES.CULTIVO:
        successMessage = `Cultivo "${formData.nombre}" agregado exitosamente`
        break
      case MODAL_TYPES.COSTO:
        successMessage = `Costo de ${formData.categoria} agregado exitosamente`
        break
      case MODAL_TYPES.FINCA: {
        const nombre = formData.nombre?.trim()
        const departamento = formData.departamento
        const municipio = formData.municipio
        if (!nombre || !departamento || !municipio) {
          showNotification('Por favor completa todos los campos de la finca', 'error')
          return
        }
        const ubicacion = `${municipio}, ${departamento}`
        ;(async () => {
          try {
            if (editingFinca) {
              await updateFinca(editingFinca.id, { nombre, ubicacion })
              showNotification(`Finca "${nombre}" actualizada exitosamente`, 'success')
            } else {
              await createFinca({ nombre, ubicacion })
              showNotification(`Finca "${nombre}" agregada exitosamente`, 'success')
            }
            setFincasRefresh((prev) => prev + 1)
            setEditingFinca(null)
          } catch (error) {
            console.error(error)
            const message = error?.response?.data?.error || 'Error guardando la finca'
            showNotification(message, 'error')
          }
        })()
        successMessage = editingFinca ? `Finca "${nombre}" actualizada exitosamente` : `Finca "${nombre}" agregada exitosamente`
        break
      }
      default:
        successMessage = 'Datos agregados exitosamente'
    }

    showNotification(successMessage, 'success')
    handleCloseDynamicModal()
  }

  const resumen = dashboardData?.summary || {
    costos: 0,
    ingresos: 0,
    ganancia: 0,
    produccionKg: 0,
    cultivosActivos: 0,
    cultivosFinalizados: 0,
  }
  const margin = resumen.ingresos > 0 ? (resumen.ganancia / resumen.ingresos) * 100 : 0

  const formatTrendChange = (trend = []) => {
    if (!Array.isArray(trend) || trend.length < 2) return 'Sin datos históricos'
    const previous = trend[trend.length - 2]?.value || 0
    const current = trend[trend.length - 1]?.value || 0
    if (previous === 0) {
      return current === 0 ? 'Sin cambio reciente' : `Ultimo mes: +${Math.round(current)}%`
    }
    const diff = current - previous
    const percent = Math.round((diff / previous) * 100)
    const sign = diff >= 0 ? '+' : ''
    return `${sign}${percent}% desde el mes pasado`
  }

  const costTrendText = formatTrendChange(dashboardData?.costTrend)
  const productionTrendText = formatTrendChange(dashboardData?.productionTrend)
  const ingresosSubtext = dashboardData?.productionTrend?.length > 1 ? productionTrendText : 'Basado en ingresos registrados'

  const cultivosEnFinca = dashboardData?.cultivosEstado || []
  const detalleCultivo = selectedCultivoId ? Agro.getDetalleCultivo(selectedCultivoId) : null
  const cultivoSeleccionado = selectedCultivoId ? Agro.cultivos.find((c) => c.id === selectedCultivoId) : null

  const costosDetalleTotales = (() => {
    if (!detalleCultivo?.costos) return { total: 0, count: 0 }
    let total = 0
    detalleCultivo.costos.forEach((f) => {
      total += Agro.parseMoney(f.valor)
    })
    return { total, count: detalleCultivo.costos.length }
  })()

  const rentabilidadRows = dashboardData?.rentability || []

  useEffect(() => {
    if (activeSection !== 'dashboard' || !dashboardData) return
    const id = window.setTimeout(() => {
      updateAdminDashboardCharts(dashboardData, {
        chartProduccion: cpRef,
        chartCostos: ccRef,
        chartCategoriaCostos: ccatRef,
        chartRentabilidad: crRef,
      })
    }, 120)
    return () => window.clearTimeout(id)
  }, [activeSection, dashboardData])

  useEffect(() => {
    if (activeSection !== 'rentabilidad' || !dashboardData) return
    const id = window.setTimeout(() => {
      updateRentabilidadCharts(dashboardData, {
        chartRentabilidadDetallada: crdRef,
        chartComparativaIngresosCostos: cicRef,
      })
    }, 120)
    return () => window.clearTimeout(id)
  }, [activeSection, dashboardData])

  useEffect(() => {
    const handler = () => {
      if (!dashboardData) return
      if (activeSection === 'dashboard') {
        window.setTimeout(() => {
          updateAdminDashboardCharts(dashboardData, {
            chartProduccion: cpRef,
            chartCostos: ccRef,
            chartCategoriaCostos: ccatRef,
            chartRentabilidad: crRef,
          })
        }, 50)
      }
      if (activeSection === 'rentabilidad') {
        window.setTimeout(() => {
          updateRentabilidadCharts(dashboardData, {
            chartRentabilidadDetallada: crdRef,
            chartComparativaIngresosCostos: cicRef,
          })
        }, 50)
      }
      if (reportVisible && reportType) {
        /* mismo tipo, datos actualizados al renderizar */
      }
    }
    window.addEventListener('agro:fincaChanged', handler)
    return () => window.removeEventListener('agro:fincaChanged', handler)
  }, [activeSection, dashboardData, reportVisible, reportType])

  const switchSection = (sectionId) => {
    if (sectionId !== 'detalle-cultivo') {
      setSelectedCultivoId(null)
    }
    setActiveSection(sectionId)
    setPageTitle(SECTION_TITLES[sectionId] || 'Dashboard')
  }

  const onFincaChange = (id) => {
    Agro.setSelectedFincaId(id)
    setFincaId(id)
    const fincaNombre = fincas.find((f) => String(f.id) === String(id))?.nombre || id
    showNotification(`Finca ${fincaNombre} seleccionada`)
  }

  const onLogout = async () => {
    const result = await Swal.fire({
      title: 'AgroGestion',
      text: '¿Estás seguro de que deseas cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#ffffff',
      customClass: {
        cancelButton: 'custom-cancel-btn',
        confirmButton: 'custom-confirm-btn',
      },
    })

    if (!result.isConfirmed) return

    clearSession()
    navigate('/', { replace: true })
  }

  const openCultivoDetalle = (cultivo) => {
    setSelectedCultivoId(cultivo.id)
    setActiveSection('detalle-cultivo')
    setPageTitle(`Cultivo de ${cultivo.nombre}`)
    setElementosCultivo({ open: false, rows: [] })
  }

  const backToCultivos = () => {
    setSelectedCultivoId(null)
    setElementosCultivo({ open: false, rows: [] })
    switchSection('cultivos')
    setPageTitle('Gestión de Cultivos')
  }

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const navItems = [
    {
      title: 'Principal',
      links: [{ section: 'dashboard', label: 'Dashboard', icon: '📊' }],
    },
    {
      title: 'Gestión',
      links: [
        { section: 'fincas', label: 'Fincas', icon: '🏠' },
        { section: 'usuarios', label: 'Usuarios', icon: '👥' },
        { section: 'cultivos', label: 'Cultivos', icon: '🌱' },
      ],
    },
    {
      title: 'Operaciones',
      links: [
        { section: 'reportes', label: 'Reportes', icon: '📋' },
        { section: 'costos', label: 'Costos Generales', icon: '💰' },
      ],
    },
    {
      title: 'Análisis',
      links: [{ section: 'rentabilidad', label: 'Rentabilidad', icon: '📈' }],
    },
  ]

  const openReport = (tipo) => {
    setReportType(tipo)
    setReportVisible(true)
  }

  const exportPdf = async () => {
    if (!reportRef.current) return
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 10,
      filename: `reporte-${reportType}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    }
    html2pdf().set(opt).from(reportRef.current).save()
  }

  const exportExcel = async () => {
    if (!reportRef.current) return
    const XLSX = await import('xlsx')
    const table = reportRef.current.querySelector('.data-table')
    if (!table) return
    const ws = XLSX.utils.table_to_sheet(table)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Reporte-${reportType}`)
    XLSX.writeFile(wb, `reporte-${reportType}.xlsx`)
  }

  const recentActivities = dashboardData?.recentActivities || []
  const alertItems = dashboardData?.alerts || []
  const alertIcons = {
    warning: '⚠️',
    danger: '🚨',
    info: 'ℹ️',
    success: '✅',
  }

  const cultivosEstadoCards = cultivosEnFinca.map((c) => {
    const badgeClass = c.estado?.toLowerCase() === 'finalizado' ? 'completed' : 'active'
    const badgeText = badgeClass === 'completed' ? 'Finalizado' : 'Activo'
    return (
      <div key={c.id} className="cultivo-card">
        <div className="cultivo-header">
          <h4>{c.nombre}</h4>
          <span className={`status-badge ${badgeClass}`}>{badgeText}</span>
        </div>
        <div className="cultivo-content">
          <p>
            <strong>Inicio:</strong> {c.fechaInicio || '--'}
          </p>
          <p>
            <strong>Fin:</strong> {c.fechaFinal || '--'}
          </p>
          <p>
            <strong>Ganancia:</strong> {Agro.formatCOP(c.ganancia)}
          </p>
          <p>
            <strong>Costo:</strong> {Agro.formatCOP(c.costo)}
          </p>
        </div>
      </div>
    )
  })

  return (
    <div className="container">
      <DynamicModal
        isOpen={showDynamicModal}
        modalType={dynamicModalType}
        onClose={handleCloseDynamicModal}
        onSubmit={handleSubmitDynamicModal}
        fieldOptions={modalFieldOptions}
        initialData={modalInitialData}
        onFieldChange={(name, value) => {
          if (name === 'departamento') {
            const municipios = value ? (MUNICIPIOS_POR_DEPARTAMENTO[value] || []) : []
            setModalFieldOptions((prev) => ({
              ...prev,
              municipio: municipios.map((m) => ({ value: m, label: m })),
            }))
            // clear selected municipio in initial data when departamento changes
            setModalInitialData((prev) => ({ ...prev, municipio: '' }))
          }
        }}
      />

      {toast ? (
        <div
          className={`notification ${toast.type}`}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            padding: '15px 20px',
            borderRadius: 6,
            backgroundColor: toast.type === 'success' ? '#27ae60' : '#3498db',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
            fontWeight: 500,
          }}
        >
          {toast.message}
        </div>
      ) : null}

      <Sidebar
        roleSubtitle="Rol: Administrador"
        fincaOptions={fincas.length > 0 ? fincas : Agro.fincas}
        fincaValue={fincaId}
        onFincaChange={onFincaChange}
        navItems={navItems}
        activeNavSection={activeSection === 'detalle-cultivo' ? null : activeSection}
        onNavClick={switchSection}
        accountName="Admin"
        accountEmail="admin123@gmail.com"
        onLogout={onLogout}
      />

      <main className="main-content">
        <Header
          title={pageTitle}
          showNavCultivo={activeSection === 'detalle-cultivo'}
          onScrollToSection={scrollToSection}
        />

        <div className="content-container">
          <section id="dashboard-section" className={`content-section ${activeSection === 'dashboard' ? 'active' : ''}`}>
            {dashboardError ? (
              <div className="dashboard-error" style={{ marginBottom: 16, color: '#c0392b' }}>
                {dashboardError}
              </div>
            ) : null}
            {isLoadingDashboard ? (
              <div className="dashboard-loading" style={{ marginBottom: 16, color: '#34495e' }}>
                Cargando información del dashboard...
              </div>
            ) : null}
            <div className="kpi-container">
              <div className="kpi-card">
                <div className="kpi-header">
                  <h3>Costo Total Finca</h3>
                  <span className="icon">💰</span>
                </div>
                <div className="kpi-value" id="kpiCostoTotal">
                  {Agro.formatCOP(resumen.costos)}
                </div>
                <div className="kpi-subtext">{costTrendText}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <h3>Ingresos Totales</h3>
                  <span className="icon">💵</span>
                </div>
                <div className="kpi-value" id="kpiIngresosTotales">
                  {Agro.formatCOP(resumen.ingresos)}
                </div>
                <div className="kpi-subtext">{ingresosSubtext}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <h3>Ganancia Total</h3>
                  <span className="icon">📈</span>
                </div>
                <div className="kpi-value" id="kpiGananciaTotal">
                  {Agro.formatCOP(resumen.ganancia)}
                </div>
                <div className="kpi-subtext">
                  Margen: <span id="kpiMargen">{margin.toFixed(1)}%</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <h3>Producción Total</h3>
                  <span className="icon">📦</span>
                </div>
                <div className="kpi-value" id="kpiProduccionTotal">
                  {resumen.produccionKg.toLocaleString('es-CO')} kg
                </div>
                <div className="kpi-subtext">Basado en cosechas registradas</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <h3>Cultivos Activos</h3>
                  <span className="icon">🌱</span>
                </div>
                <div className="kpi-value" id="kpiCultivosActivos">
                  {resumen.cultivosActivos}
                </div>
                <div className="kpi-subtext">En diferentes etapas</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <h3>Cultivos Finalizados</h3>
                  <span className="icon">✅</span>
                </div>
                <div className="kpi-value" id="kpiCultivosFinalizados">
                  {resumen.cultivosFinalizados}
                </div>
                <div className="kpi-subtext">Este período</div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Producción en el Tiempo</h3>
                <div className="chart-wrapper">
                  <canvas ref={cpRef} id="chartProduccion" />
                </div>
              </div>
              <div className="chart-card">
                <h3>Costos en el Tiempo</h3>
                <div className="chart-wrapper">
                  <canvas ref={ccRef} id="chartCostos" />
                </div>
              </div>
              <div className="chart-card">
                <h3>Costos por Categoría</h3>
                <div className="chart-wrapper">
                  <canvas ref={ccatRef} id="chartCategoriaCostos" />
                </div>
              </div>
              <div className="chart-card">
                <h3>Rentabilidad por Cultivo</h3>
                <div className="chart-wrapper">
                  <canvas ref={crRef} id="chartRentabilidad" />
                </div>
              </div>
            </div>

            <div className="cultivos-estado">
              <h2>Estado de Cultivos</h2>
              <div className="cultivos-grid" id="cultivosEstadoGrid">
                {cultivosEstadoCards.length > 0 ? (
                  cultivosEstadoCards
                ) : (
                  <p style={{ padding: 10, color: 'var(--text-light)' }}>Sin cultivos para la finca seleccionada.</p>
                )}
              </div>
            </div>

            <div className="timeline-section">
              <h2>Actividades Recientes</h2>
              <div className="timeline">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={`${activity.type}-${activity.occurredAt}-${index}`} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <h4>{activity.title}</h4>
                        <p>{activity.description}</p>
                        <time>{activity.occurredAt}</time>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ padding: 10, color: 'var(--text-light)' }}>No hay actividades recientes para la finca seleccionada.</p>
                )}
              </div>
            </div>

            <div className="alerts-section">
              <h2>Alertas y Advertencias</h2>
              <div className="alerts-grid">
                {alertItems.length > 0 ? (
                  alertItems.map((alert, index) => (
                    <div key={`${alert.type}-${index}`} className={`alert-card alert-${alert.type}`}>
                      <span className="alert-icon">{alertIcons[alert.type] || 'ℹ️'}</span>
                      <div className="alert-content">
                        <h4>{alert.title}</h4>
                        <p>{alert.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="alert-card alert-info">
                    <span className="alert-icon">ℹ️</span>
                    <div className="alert-content">
                      <h4>Sin alertas por el momento</h4>
                      <p>La finca no reporta eventos críticos ni advertencias recientes.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="fincas-section" className={`content-section ${activeSection === 'fincas' ? 'active' : ''}`}>
            <div className="section-header">
              <div className="search-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="🔍 Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="button" className="btn-search" onClick={handleBuscarFincas}>
                  Buscar
                </button>
              </div>
              <button type="button" className="btn-add btn-primary" onClick={() => handleOpenFincaModal()}>
                + Agregar Nueva Finca
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr className="table-title-row">
                    <th colSpan={4}>Fincas Registradas</th>
                  </tr>
                  <tr>
                    <th>Nombre</th>
                    <th>Ubicación</th>
                    <th>Cultivos activos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingFincas ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                        Cargando fincas...
                      </td>
                    </tr>
                  ) : fincas.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                        No hay fincas registradas.
                      </td>
                    </tr>
                  ) : (
                    fincas.map((finca) => {
                      const cultivosActivos = Agro.cultivos.filter(
                        (c) => String(c.fincaId) === String(finca.id) && c.estado !== 'finalizado' && c.estado !== 'perdido'
                      ).length
                      return (
                        <tr key={finca.id} className="data-item">
                          <td data-field="nombre">{finca.nombre}</td>
                          <td data-field="ubicacion">{finca.ubicacion || '--'}</td>
                          <td data-field="cultivos">{cultivosActivos}</td>
                          <td data-field="acciones">
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="btn-icon btn-edit"
                                title="Editar"
                                onClick={() => handleOpenFincaModal(finca)}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn-icon btn-delete"
                                title="Eliminar"
                                onClick={() => handleDeleteFinca(finca.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section id="usuarios-section" className={`content-section ${activeSection === 'usuarios' ? 'active' : ''}`}>
            <div className="section-header">
              <div className="search-wrapper">
                <input type="text" className="search-input" placeholder="🔍 Buscar por nombre..." readOnly />
                <button type="button" className="btn-search">
                  Buscar
                </button>
              </div>
              <button type="button" className="btn-add btn-primary" onClick={() => handleOpenDynamicModal(MODAL_TYPES.USUARIO)}>
                + Agregar Nuevo Usuario
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr className="table-title-row">
                    <th colSpan={5}>Usuarios Registrados</th>
                  </tr>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Contraseña</th>
                    <th>Rol</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="data-item">
                    <td data-field="nombre">Admin</td>
                    <td data-field="email">admin123@gmail.com</td>
                    <td data-field="password">Admin12345</td>
                    <td data-field="rol">Administrador</td>
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
                  {[2, 3, 4].map((uid) => {
                    const rows = [
                      { id: 2, nombre: 'Carlos Mendez Rivas', email: 'carlos.mendez@gmail.com', pass: 'CarlosMendez2024', rol: 'Trabajador' },
                      { id: 3, nombre: 'María Gonzalez Ortiz', email: 'maria.gonzalez@gmail.com', pass: 'MariaGonz2024', rol: 'Trabajador' },
                      { id: 4, nombre: 'Juan Pablo Silva Flores', email: 'juan.silva@gmail.com', pass: 'JuanPablo2024', rol: 'Trabajador' },
                    ]
                    const u = rows.find((r) => r.id === uid)
                    return (
                      <tr
                        key={uid}
                        className={`data-item usuario-clickeable ${activeUsuarioId === uid ? 'activo' : ''}`}
                        onClick={(e) => {
                          if (e.target.closest('.action-buttons')) return
                          setActiveUsuarioId(uid)
                          setAsignacionesOpen(true)
                          setTimeout(() => document.getElementById('asignaciones-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
                        }}
                      >
                        <td data-field="nombre">{u.nombre}</td>
                        <td data-field="email">{u.email}</td>
                        <td data-field="password">{u.pass}</td>
                        <td data-field="rol">{u.rol}</td>
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
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="info-section" id="asignaciones-section" style={{ display: asignacionesOpen ? 'block' : 'none', marginTop: 40 }}>
              <div className="section-info-header">
                <h3>
                  Asignaciones de{' '}
                  <span id="usuario-nombre-asignaciones">
                    {activeUsuarioId === 2
                      ? 'Carlos Mendez Rivas'
                      : activeUsuarioId === 3
                        ? 'María Gonzalez Ortiz'
                        : activeUsuarioId === 4
                          ? 'Juan Pablo Silva Flores'
                          : '--'}
                  </span>
                </h3>
                <button
                  type="button"
                  className="btn-close-asignaciones"
                  id="btn-close-asignaciones"
                  onClick={() => {
                    setAsignacionesOpen(false)
                    setActiveUsuarioId(null)
                  }}
                >
                  ✕ Cerrar
                </button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr className="table-title-row">
                      <th colSpan={2}>Asignaciones</th>
                    </tr>
                    <tr>
                      <th>Fincas Asignadas</th>
                      <th>Cultivos Asignados</th>
                    </tr>
                  </thead>
                  <tbody id="asignaciones-tbody">
                    {(ASIGNACIONES_BY_USUARIO[activeUsuarioId] || []).map((a, i) => (
                      <tr key={i} className="data-item">
                        <td data-field="finca">{a.finca}</td>
                        <td data-field="cultivos">{a.cultivos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="cultivos-section" className={`content-section ${activeSection === 'cultivos' ? 'active' : ''}`}>
            <div className="section-header">
              <input type="text" className="search-input" placeholder="🔍 Buscar por nombre..." readOnly />
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
              <button type="button" className="btn-add btn-primary" onClick={() => handleOpenDynamicModal(MODAL_TYPES.CULTIVO)}>
                + Agregar Nuevo Cultivo
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr className="table-title-row">
                    <th colSpan={6}>Cultivos Registrados</th>
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
                <tbody>
                  {cultivosEnFinca.map((c) => (
                    <tr
                      key={c.id}
                      className="data-item"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        if (e.target.closest('.action-buttons')) return
                        openCultivoDetalle(c)
                      }}
                    >
                      <td data-field="nombre">{c.nombre}</td>
                      <td data-field="tipo">{c.tipo}</td>
                      <td data-field="fecha-siembra">{c.fechaInicio}</td>
                      <td data-field="fecha-cosecha">{c.fechaCosecha || '--'}</td>
                      <td data-field="estado">
                        <span className={`status-badge status-${c.estado}`}>{c.estado.replace('-', ' ')}</span>
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
          </section>

          <section id="detalle-cultivo-section" className={`content-section ${activeSection === 'detalle-cultivo' ? 'active' : ''}`}>
            <div className="section-header">
              <button type="button" className="btn-back" id="btn-back-cultivos" onClick={backToCultivos}>
                ← Volver a Cultivos
              </button>
            </div>

            {cultivoSeleccionado ? (
              <>
                <div className="cultivo-estado-container">
                  <label className="estado-label">Estado:</label>
                  <span id="cultivo-estado-badge" className={`status-badge status-${cultivoSeleccionado.estado}`}>
                    {cultivoSeleccionado.estado.replace('-', ' ').charAt(0).toUpperCase() +
                      cultivoSeleccionado.estado.replace('-', ' ').slice(1)}
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
                      <input type="text" className="search-input" placeholder="🔍 Buscar por nombre..." readOnly />
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
                      <tbody>
                        {(detalleCultivo?.etapas || []).map((etapa, i) => (
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
                      <tbody>
                        {(detalleCultivo?.cosechas || []).map((cosecha, i) => (
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
                    <button type="button" className="btn-add btn-primary" onClick={() => handleOpenDynamicModal(MODAL_TYPES.COSTO)}>
                      + Agregar Nuevo Costo
                    </button>
                  </div>
                  <div className="search-filter-wrapper">
                    <div className="filter-wrapper">
                      <label className="filter-label">Filtrar por etapa:</label>
                      <select className="filter-select filter-etapa-cultivo" defaultValue="todos">
                        <option value="todos">Todos</option>
                      </select>
                    </div>
                    <div className="filter-wrapper">
                      <label className="filter-label">Filtrar por categoría:</label>
                      <select className="filter-select filter-categoria-cultivo" defaultValue="todos">
                        <option value="todos">Todos</option>
                        <option value="costos-indirectos">Costos Indirectos</option>
                        <option value="mano-obra">Mano de Obra</option>
                        <option value="materia-prima">Materia Prima</option>
                        <option value="servicios">Servicios</option>
                      </select>
                    </div>
                    <div className="filter-wrapper" style={{ width: '100%' }}>
                      <label className="filter-label">Rango de fechas:</label>
                      <div className="date-range">
                        <input type="date" className="filter-date filter-fecha-desde-cultivo" readOnly />
                        <span className="date-separator">-</span>
                        <input type="date" className="filter-date filter-fecha-hasta-cultivo" readOnly />
                      </div>
                    </div>
                  </div>

                  <div className="totales-bar">
                    <span className="total-item">
                      Total: <strong id="total-costos">{Agro.formatCOP(costosDetalleTotales.total)}</strong>
                    </span>
                    <span className="total-item">
                      Registros: <strong id="total-registros">{costosDetalleTotales.count}</strong>
                    </span>
                  </div>

                  <div className="table-container">
                    <table className="data-table costos-table">
                      <thead>
                        <tr className="table-title-row">
                          <th colSpan={7}>Costos Registrados del Cultivo</th>
                        </tr>
                        <tr>
                          <th>Fecha</th>
                          <th>Usuario</th>
                          <th>Categoría</th>
                          <th>Etapa</th>
                          <th>Descripción</th>
                          <th>Valor</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detalleCultivo?.costos || []).map((costo, i) => {
                          const isMp = costo.categoria === 'Materia Prima'
                          return (
                            <tr
                              key={i}
                              className={`data-item ${isMp ? 'clickeable-materia-prima' : ''}`}
                              style={{ cursor: isMp ? 'pointer' : undefined }}
                              onClick={(e) => {
                                if (!isMp) return
                                if (e.target.closest('.action-buttons')) return
                                setElementosCultivo({ open: true, rows: getInventarioElementos(costo.descripcion, 'cultivo') })
                                setTimeout(
                                  () => document.getElementById('elementos-inventario-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                                  100,
                                )
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
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="info-section" id="elementos-inventario-section" style={{ display: elementosCultivo.open ? 'block' : 'none' }}>
                  <div className="section-info-header">
                    <h3>Información del Inventario </h3>
                    <button type="button" className="btn-close-elements" id="btn-close-elements" onClick={() => setElementosCultivo({ open: false, rows: [] })}>
                      ✕ Cerrar
                    </button>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr className="table-title-row">
                          <th colSpan={5}>Elementos usados del inventario</th>
                        </tr>
                        <tr>
                          <th>Producto</th>
                          <th>Precio Producto</th>
                          <th>Cantidad Usada</th>
                          <th>Medida Usada</th>
                          <th>Costo Total</th>
                        </tr>
                      </thead>
                      <tbody id="elementos-inventario-tbody">
                        {elementosCultivo.rows.map((el, idx) => (
                          <tr key={idx} className="data-item">
                            <td data-field="producto">{el.producto}</td>
                            <td data-field="precio">{el.precioFmt}</td>
                            <td data-field="cantidad">{el.cantidad}</td>
                            <td data-field="medida">{el.medida}</td>
                            <td data-field="costo-total">{el.totalFmt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </section>

          <section id="reportes-section" className={`content-section ${activeSection === 'reportes' ? 'active' : ''}`}>
            <div className="reportes-container">
              <div className="reportes-header">
                <h2>Módulo de Reportes</h2>
                <p>Genera reportes completos y exportables del sistema</p>
              </div>
              <div className="filtros-section">
                <h3>Filtros</h3>
                <div className="filtros-grid">
                  <div className="filtro-group">
                    <label>Rango de Fechas</label>
                    <input type="date" id="filtroFechaInicio" className="filtro-input" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} />
                    <input type="date" id="filtroFechaFin" className="filtro-input" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} />
                  </div>
                  <div className="filtro-group">
                    <label>Cultivo</label>
                    <select id="filtroCultivo" className="filtro-select" value={filtroCultivo} onChange={(e) => setFiltroCultivo(e.target.value)}>
                      <option value="">Todos los cultivos</option>
                      <option value="tomate">Tomate Cherry</option>
                      <option value="lechuga">Lechuga Iceberg</option>
                      <option value="pepino">Pepino</option>
                      <option value="pimenton">Pimentón Rojo</option>
                    </select>
                  </div>
                  <div className="filtro-group">
                    <label>Categoría de Costo</label>
                    <select id="filtroCategoriaCosto" className="filtro-select" value={filtroCategoriaCosto} onChange={(e) => setFiltroCategoriaCosto(e.target.value)}>
                      <option value="">Todas las categorías</option>
                      <option value="insumos">Insumos</option>
                      <option value="personal">Personal</option>
                      <option value="equipos">Equipos</option>
                      <option value="otros">Otros</option>
                    </select>
                  </div>
                  <div className="filtro-group">
                    <label>Usuario</label>
                    <select id="filtroUsuario" className="filtro-select" value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)}>
                      <option value="">Todos los usuarios</option>
                      <option value="1">Juan Pérez</option>
                      <option value="2">María García</option>
                      <option value="3">Carlos López</option>
                    </select>
                  </div>
                  <div className="filtro-group">
                    <label>Estado del Cultivo</label>
                    <select id="filtroEstadoCultivo" className="filtro-select" value={filtroEstadoCultivo} onChange={(e) => setFiltroEstadoCultivo(e.target.value)}>
                      <option value="">Todos los estados</option>
                      <option value="activo">Activo</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="pausado">Pausado</option>
                    </select>
                  </div>
                  <div className="filtro-group">
                    <button
                      type="button"
                      id="btnAplicarFiltros"
                      className="btn-primary"
                      onClick={() =>
                        showNotification(
                          `Filtros registrados (${filtroFechaInicio || '—'} → ${filtroFechaFin || '—'})`,
                          'info',
                        )
                      }
                    >
                      Aplicar Filtros
                    </button>
                    <button
                      type="button"
                      id="btnLimpiarFiltros"
                      className="btn-secondary"
                      onClick={() => {
                        setFiltroFechaInicio('')
                        setFiltroFechaFin('')
                        setFiltroCultivo('')
                        setFiltroCategoriaCosto('')
                        setFiltroUsuario('')
                        setFiltroEstadoCultivo('')
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
              <div className="reportes-tipos">
                <h3>Selecciona un tipo de reporte</h3>
                <div className="reportes-botones">
                  {[
                    { tipo: 'por-cultivo', icon: '🌱', label: 'Reporte por Cultivo' },
                    { tipo: 'costos', icon: '💸', label: 'Reporte de Costos' },
                    { tipo: 'produccion', icon: '🌾', label: 'Reporte de Producción' },
                    { tipo: 'rentabilidad', icon: '📈', label: 'Reporte de Rentabilidad' },
                    { tipo: 'trabajador', icon: '👷', label: 'Reporte por Trabajador' },
                  ].map((b) => (
                    <button key={b.tipo} type="button" className="btn-reporte" data-reporte={b.tipo} onClick={() => openReport(b.tipo)}>
                      <span className="icon">{b.icon}</span>
                      <span>{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div
                id="reporteContenedor"
                ref={reportRef}
                className="reporte-contenedor"
                style={{ display: reportVisible ? 'block' : 'none' }}
                data-last-reporte={reportType || ''}
              >
                {reportVisible && reportType ? (
                  <>
                    <AdminReportTable fincaId={fincaId} reportType={reportType} />
                    <div className="reporte-exportar">
                      <button type="button" className="btn-exportar pdf" onClick={() => exportPdf()}>
                        Exportar PDF
                      </button>
                      <button type="button" className="btn-exportar excel" onClick={() => exportExcel()}>
                        Exportar Excel
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </section>

          <section id="costos-section" className={`content-section ${activeSection === 'costos' ? 'active' : ''}`}>
            <div className="search-filter-wrapper">
              <div className="filter-wrapper">
                <label className="filter-label">Filtrar por categoría:</label>
                <select className="filter-select" defaultValue="todos">
                  <option value="todos">Todos</option>
                  <option value="mano-obra">Mano de Obra</option>
                  <option value="materia-prima">Materia Prima</option>
                  <option value="servicios">Servicios</option>
                  <option value="costos-indirectos">Costos Indirectos</option>
                </select>
              </div>
              <div className="filter-wrapper">
                <label className="filter-label">Rango de fechas:</label>
                <div className="date-range">
                  <input type="date" className="filter-date" readOnly />
                  <span className="date-separator">-</span>
                  <input type="date" className="filter-date" readOnly />
                </div>
              </div>
              <button type="button" className="btn-add btn-primary" onClick={() => handleOpenDynamicModal(MODAL_TYPES.COSTO)}>
                + Agregar Nuevo Costo
              </button>
            </div>
            <div className="table-container">
              <table className="data-table costos-generales-table">
                <thead>
                  <tr className="table-title-row">
                    <th colSpan={6}>Costos Generales de la Finca</th>
                  </tr>
                  <tr>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {COSTOS_GENERALES_ROWS.map((row, i) => {
                    const isMp = row.categoria === 'Materia Prima'
                    return (
                      <tr
                        key={i}
                        className={`data-item ${isMp ? 'clickeable-materia-prima' : ''}`}
                        style={{ cursor: isMp ? 'pointer' : undefined }}
                        onClick={(e) => {
                          if (!isMp) return
                          if (e.target.closest('.action-buttons')) return
                          setElementosGenerales({ open: true, rows: getInventarioElementos(row.descripcion, 'generales') })
                          setTimeout(
                            () => document.getElementById('elementos-inventario-generales-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                            100,
                          )
                        }}
                      >
                        <td data-field="fecha">{row.fecha}</td>
                        <td data-field="categoria">
                          <span className={`categoria-badge cat-${row.categoria.toLowerCase().replace(/ /g, '-')}`}>{row.categoria}</span>
                        </td>
                        <td data-field="descripcion">{row.descripcion}</td>
                        <td data-field="monto">{row.monto}</td>
                        <td data-field="estado">
                          <span className={`status-badge status-${row.estado}`}>{row.estadoLabel}</span>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="info-section" id="elementos-inventario-generales-section" style={{ display: elementosGenerales.open ? 'block' : 'none' }}>
              <div className="section-info-header">
                <h3>Información del Inventario</h3>
                <button
                  type="button"
                  className="btn-close-elements"
                  id="btn-close-elements-generales"
                  onClick={() => setElementosGenerales({ open: false, rows: [] })}
                >
                  ✕ Cerrar
                </button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr className="table-title-row">
                      <th colSpan={5}>Elementos usados del inventario</th>
                    </tr>
                    <tr>
                      <th>Producto</th>
                      <th>Precio Producto</th>
                      <th>Cantidad Usada</th>
                      <th>Medida Usada</th>
                      <th>Costo Total</th>
                    </tr>
                  </thead>
                  <tbody id="elementos-inventario-generales-tbody">
                    {elementosGenerales.rows.map((el, idx) => (
                      <tr key={idx} className="data-item">
                        <td data-field="producto">{el.producto}</td>
                        <td data-field="precio">{el.precioFmt}</td>
                        <td data-field="cantidad">{el.cantidad}</td>
                        <td data-field="medida">{el.medida}</td>
                        <td data-field="costo-total">{el.totalFmt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="rentabilidad-section" className={`content-section ${activeSection === 'rentabilidad' ? 'active' : ''}`}>
            <div className="section-header">
              <h2>Análisis de Rentabilidad</h2>
            </div>
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Rentabilidad por Cultivo (%)</h3>
                <div className="chart-wrapper">
                  <canvas ref={crdRef} id="chartRentabilidadDetallada" />
                </div>
              </div>
              <div className="chart-card">
                <h3>Comparación: Ingresos vs Costos</h3>
                <div className="chart-wrapper">
                  <canvas ref={cicRef} id="chartComparativaIngresosCostos" />
                </div>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cultivo</th>
                    <th>Ingresos</th>
                    <th>Costos</th>
                    <th>Ganancia</th>
                    <th>Margen (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {(rentabilidadRows.length ? rentabilidadRows : [{ nombre: '--', ingresos: 0, costos: 0, ganancia: 0, margen: 0 }]).map((r, i) => (
                    <tr key={i}>
                      <td>{r.nombre}</td>
                      <td>{Agro.formatCOP(r.ingresos)}</td>
                      <td>{Agro.formatCOP(r.costos)}</td>
                      <td>{Agro.formatCOP(r.ganancia)}</td>
                      <td>{r.margen.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
