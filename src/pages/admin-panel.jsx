import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Agro from '../services/agroData'
import { clearSession, getSession } from '../services/authSession'
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/authApi'
import { fetchCultivosEnProceso } from '../services/asignaciones-usuarioAPI'
import { getInventarioElementos } from '../utils/inventarioElementos'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import DynamicModal from '../components/DynamicModal'
import { updateAdminDashboardCharts, updateRentabilidadCharts } from './admin/adminCharts'
import { AdminReportTable } from './admin/AdminReportViews'
import '../styles/dashboard.css'
import '../styles/admin-panel.css'
import { fetchFincas, createFinca, updateFinca, deleteFinca } from '../services/fincaService'
import { fetchDashboardForFinca } from '../services/dashboardService'
import { fetchCultivosPorFinca } from '../services/cultivoService'

import { MODAL_TYPES, DEPARTAMENTOS, MUNICIPIOS_POR_DEPARTAMENTO } from '../utils/modalConfig'
import Swal from 'sweetalert2'

// Nombres de secciones que se usan en la navegación del panel admin.
// Esta constante asigna un identificador interno a un título visible.
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

// Convierte el nombre de una etapa en una clase CSS segura.
// Ejemplo: "Preparación Inicial" => "preparacion-inicial".
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

function isValidFincaId(value) {
  const numberValue = Number(value)
  return Number.isInteger(numberValue) && numberValue > 0
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
  // Hook para cambiar de ruta cuando el usuario no tiene permiso o cierra sesión.
  const navigate = useNavigate()
  // Sesión actual del usuario; se usa para validar rol de administrador.
  const session = getSession()

  // Estado local del componente administrado por React.
  // fincaId guarda la finca seleccionada actualmente.
  const [fincaId, setFincaId] = useState(() => {
    const initial = Agro.getSelectedFincaId()
    return isValidFincaId(initial) ? String(initial) : ''
  })
  const [activeSection, setActiveSection] = useState(() => {
    const s = localStorage.getItem('activeSection') || 'dashboard'
    if (s === 'detalle-cultivo') return 'cultivos'
    return s
  })
  // Título que se muestra en la cabecera según la sección activa.
  const [pageTitle, setPageTitle] = useState(() => {
    const normalized = 'dashboard'
    return SECTION_TITLES[normalized] || 'Dashboard'
  })
  const [selectedCultivoId, setSelectedCultivoId] = useState(null)
  // El usuario seleccionado para ver asignaciones de fincas/cultivos.
  const [activeUsuarioId, setActiveUsuarioId] = useState(null)
  // Controla si se muestran las asignaciones de usuario.
  const [asignacionesOpen, setAsignacionesOpen] = useState(false)
  // Estado para mostrar información detallada de inventario en costos de cultivo.
  const [elementosCultivo, setElementosCultivo] = useState({ open: false, rows: [] })
  // Estado para mostrar información detallada de inventario en costos generales.
  const [elementosGenerales, setElementosGenerales] = useState({ open: false, rows: [] })
  // Toast de notificaciones breves.
  const [toast, setToast] = useState(null)
  // Controla si el panel de reportes está visible.
  const [reportVisible, setReportVisible] = useState(false)
  // Tipo de reporte seleccionado para generar contenido.
  const [reportType, setReportType] = useState(null)
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroCultivo, setFiltroCultivo] = useState('')
  const [filtroCategoriaCosto, setFiltroCategoriaCosto] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroEstadoCultivo, setFiltroEstadoCultivo] = useState('')
  // Variable para forzar recarga de fincas cuando se agrega una nueva.
  const [fincasRefresh, setFincasRefresh] = useState(0)
  // Controla la apertura del modal dinámico.
  const [showDynamicModal, setShowDynamicModal] = useState(false)
  // Tipo de modal dinámico que se muestra (usuario, cultivo, costo, finca).
  const [dynamicModalType, setDynamicModalType] = useState(null)
  // Usuario que está siendo editado actualmente.
  const [editingUser, setEditingUser] = useState(null)
  // Lista de usuarios cargados desde el backend.
  const [users, setUsers] = useState([])
  // Opciones dinámicas para los campos del modal.
  const [modalFieldOptions, setModalFieldOptions] = useState({})
  // Datos de fincas y cultivos para mostrar las asignaciones reales.
  const [fincasData, setFincasData] = useState([])
  const [cultivosData, setCultivosData] = useState([])

  const [modalInitialData, setModalInitialData] = useState({})
  const [fincas, setFincas] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingFincas, setIsLoadingFincas] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState(null)
  const [cultivos, setCultivos] = useState([])
  const [isLoadingCultivos, setIsLoadingCultivos] = useState(false)
  const [editingFinca, setEditingFinca] = useState(null)

  // Memoize initial data for DynamicModal to avoid recreating object each render
  const memoizedModalInitialData = useMemo(() => {
    if (!editingUser) return undefined
    return {
      nombre: editingUser.nombre || '',
      apellidos: editingUser.apellidos || '',
      correo: editingUser.email || '',
      contraseña: editingUser.password || '',
      rol: editingUser.rol?.toLowerCase() || '',
      fincas: Array.isArray(editingUser.fincas) ? editingUser.fincas.map(Number).filter(Boolean) : [],
      cultivos: Array.isArray(editingUser.cultivos) ? editingUser.cultivos.map(Number).filter(Boolean) : [],
    }
  }, [editingUser])

  // Refs para elementos DOM y gráficos.
  const reportRef = useRef(null)
  const cpRef = useRef(null)
  const ccRef = useRef(null)
  const ccatRef = useRef(null)
  const crRef = useRef(null)
  const crdRef = useRef(null)
  const cicRef = useRef(null)

  // Valida que el usuario tenga rol de admin; si no, lo redirige al login.
  useEffect(() => {
    if (!session || session.role !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  // Escucha el evento global de cambio de finca y actualiza el estado local.
  useEffect(() => {
    const handler = () => setFincaId(Agro.getSelectedFincaId())
    window.addEventListener('agro:fincaChanged', handler)
    return () => window.removeEventListener('agro:fincaChanged', handler)
  }, [])

  // Cierra automáticamente la notificación después de 3 segundos.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Carga la lista de usuarios desde el backend al iniciar el componente.
  useEffect(() => {
    const loadUsers = async () => {
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
    }

    loadUsers()
  }, [])

  useEffect(() => {
    const loadAssignmentOptions = async () => {
      const [fincasResponse, cultivosResponse] = await Promise.all([
        fetchFincas(),
        fetchCultivosEnProceso(),
      ])

      // Normalize fincasResponse to an array of fincas
      const fincasArray = fincasResponse?.success
        ? fincasResponse.data
        : Array.isArray(fincasResponse)
        ? fincasResponse
        : fincasResponse?.data || []

      // Normalize cultivosResponse to an array of cultivos
      const cultivosArray = cultivosResponse?.success
        ? cultivosResponse.data
        : Array.isArray(cultivosResponse)
        ? cultivosResponse
        : cultivosResponse?.data || []

      const fincasOptions = fincasArray.map((finca) => ({ value: finca.id, label: finca.nombre }))

      const cultivosOptions = cultivosArray.map((cultivo) => ({
        value: cultivo.id,
        label: `${cultivo.nombre}`,
        description: `Finca: ${cultivo.finca_nombre || 'No asignada'}`,
        idfinca: cultivo.idfinca,
      }))

      setModalFieldOptions({ fincas: fincasOptions, cultivos: cultivosOptions })
      setFincasData(fincasArray)
      setCultivosData(cultivosArray)
    }

    loadAssignmentOptions()
  }, [])

  // Muestra una notificación rápida en pantalla.
  const showNotification = useCallback((message, type = 'info') => {
    setToast({ message, type })
  }, [])

    const fetchDashboardData = useCallback(
    async (selectedFincaId) => {
      if (!selectedFincaId) return
      const fincaNumericId = Number(selectedFincaId)
      if (!Number.isInteger(fincaNumericId) || fincaNumericId <= 0) return
      try {
        setIsLoadingDashboard(true)
        const data = await fetchDashboardForFinca(fincaNumericId)
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

  const fetchCultivosData = useCallback(
    async (selectedFincaId) => {
      if (!selectedFincaId) return
      const fincaNumericId = Number(selectedFincaId)
      if (!Number.isInteger(fincaNumericId) || fincaNumericId <= 0) return
      try {
        setIsLoadingCultivos(true)
        const data = await fetchCultivosPorFinca(fincaNumericId)
        setCultivos(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error al cargar cultivos:', error)
        setCultivos([])
      } finally {
        setIsLoadingCultivos(false)
      }
    },
    []
  )

  const fetchFincasList = useCallback(
    async (search = '') => {
      try {
        setIsLoadingFincas(true)
        const lista = await fetchFincas(search)
        const fincasArray = Array.isArray(lista) ? lista : Array.isArray(lista?.data) ? lista.data : []
        setFincas(fincasArray)
        const selectedId = String(fincaId || '')
        const hasSelected = fincasArray.some((finca) => String(finca.id) === selectedId)
        if (!hasSelected && fincasArray.length > 0) {
          setFincaId(String(fincasArray[0].id))
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

  useEffect(() => {
    fetchCultivosData(fincaId)
  }, [fincaId, fincasRefresh, fetchCultivosData])

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

  // Filtra la lista de usuarios según el texto ingresado en el buscador.
  const filteredUsers = users.filter((usuario) => {
    if (!filtroUsuario) return true
    const filterValue = filtroUsuario.trim().toLowerCase()
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim().toLowerCase()
    return nombreCompleto.includes(filterValue)
  })

  const activeUsuario = useMemo(
    () => users.find((usuario) => usuario.id === activeUsuarioId),
    [users, activeUsuarioId]
  )

  const fincasById = useMemo(
    () => Object.fromEntries(fincasData.map((finca) => [Number(finca.id), finca])),
    [fincasData]
  )

  const cultivosById = useMemo(
    () => Object.fromEntries(cultivosData.map((cultivo) => [Number(cultivo.id), cultivo])),
    [cultivosData]
  )

  const activeUsuarioAssignments = useMemo(() => {
    if (!activeUsuario) return []

    const rowsMap = new Map()

    ;(activeUsuario.cultivos || []).forEach((cultivoId) => {
      const numCultivoId = Number(cultivoId)
      const cultivo = cultivosById[numCultivoId]
      if (!cultivo) return

      const numFincaId = Number(cultivo.idfinca)
      const fincaName = fincasById[numFincaId]?.nombre || 'Finca desconocida'

      const existing = rowsMap.get(numFincaId) || {
        finca: fincaName,
        cultivos: [],
      }
      existing.cultivos.push(cultivo.nombre)
      rowsMap.set(numFincaId, existing)
    })

    ;(activeUsuario.fincas || []).forEach((fincaId) => {
      const numFincaId = Number(fincaId)
      if (!rowsMap.has(numFincaId)) {
        rowsMap.set(numFincaId, {
          finca: fincasById[numFincaId]?.nombre || 'Finca desconocida',
          cultivos: [],
        })
      }
    })

    return Array.from(rowsMap.values()).map((entry) => ({
      finca: entry.finca,
      cultivos: entry.cultivos.length > 0 ? entry.cultivos.join(', ') : 'Sin cultivos asignados',
    }))
  }, [activeUsuario, fincasById, cultivosById])

  // Abre un modal dinámico de creación dependiendo del tipo seleccionado.
  const handleOpenDynamicModal = (type) => {
    setEditingUser(null)
    setDynamicModalType(type)

    if (type === MODAL_TYPES.USUARIO) {
      setModalFieldOptions({ fincas: [], cultivos: [] })

      const loadOptions = async () => {
        try {
          const [fincasResponse, cultivosResponse] = await Promise.all([
            fetchFincas(),
            fetchCultivosEnProceso(),
          ])

          const fincasArray = fincasResponse?.success
            ? fincasResponse.data
            : Array.isArray(fincasResponse)
            ? fincasResponse
            : fincasResponse?.data || []

          const cultivosArray = cultivosResponse?.success
            ? cultivosResponse.data
            : Array.isArray(cultivosResponse)
            ? cultivosResponse
            : cultivosResponse?.data || []

          const fincasOptions = fincasArray.map((finca) => ({ value: finca.id, label: finca.nombre }))
          const cultivosOptions = cultivosArray.map((cultivo) => ({
            value: cultivo.id,
            label: cultivo.nombre,
            description: `Finca: ${cultivo.finca_nombre || 'No asignada'}`,
          }))

          setModalFieldOptions({ fincas: fincasOptions, cultivos: cultivosOptions })

          if (!fincasResponse?.success && !Array.isArray(fincasResponse)) {
            showNotification('No se pudieron cargar las fincas', 'error')
          }
          if (!cultivosResponse?.success && !Array.isArray(cultivosResponse)) {
            showNotification('No se pudieron cargar los cultivos', 'error')
          }
        } catch (error) {
          console.error('Error cargando opciones de usuario:', error)
          showNotification('Error cargando fincas y cultivos', 'error')
        }
      }

      loadOptions()
    }

    setShowDynamicModal(true)
  }

  // Abre el modal para editar un usuario existente.
  const handleOpenEditUser = (usuario) => {
    setEditingUser(usuario)
    setDynamicModalType(MODAL_TYPES.USUARIO)
    
    // Carga las opciones necesarias para editar el usuario.
    const loadOptions = async () => {
      try {
        const [fincasResponse, cultivosResponse] = await Promise.all([
          fetchFincas(),
          fetchCultivosEnProceso(),
        ])

        const fincasArray = fincasResponse?.success
          ? fincasResponse.data
          : Array.isArray(fincasResponse)
          ? fincasResponse
          : fincasResponse?.data || []

        const cultivosArray = cultivosResponse?.success
          ? cultivosResponse.data
          : Array.isArray(cultivosResponse)
          ? cultivosResponse
          : cultivosResponse?.data || []

        const fincasOptions = fincasArray.map((finca) => ({ value: finca.id, label: finca.nombre }))
        const cultivosOptions = cultivosArray.map((cultivo) => ({
          value: cultivo.id,
          label: `${cultivo.nombre} (${cultivo.finca_nombre || 'No asignada'})`,
          description: `Finca: ${cultivo.finca_nombre || 'No asignada'}`,
        }))

        setModalFieldOptions({ fincas: fincasOptions, cultivos: cultivosOptions })

        if (!fincasResponse?.success && !Array.isArray(fincasResponse)) {
          showNotification('No se pudieron cargar las fincas', 'error')
        }
        if (!cultivosResponse?.success && !Array.isArray(cultivosResponse)) {
          showNotification('No se pudieron cargar los cultivos', 'error')
        }
      } catch (error) {
        console.error('Error cargando opciones de edición de usuario:', error)
        showNotification('Error cargando fincas y cultivos', 'error')
      }
    }

    loadOptions()
    
    setShowDynamicModal(true)
  }

  // Cierra el modal dinámico y limpia el estado asociado.
  const handleCloseDynamicModal = () => {
    setShowDynamicModal(false)
    setDynamicModalType(null)
    setEditingUser(null)
    setModalFieldOptions({})
  }

  // Elimina un usuario después de pedir confirmación.
  const handleDeleteUser = async (id) => {
    const confirmDelete = window.confirm('¿Estás segura de que quieres eliminar este usuario?')
    if (!confirmDelete) return

    const response = await deleteUser(id)
    if (!response.success) {
      showNotification(response.message, 'error')
      return
    }

    setUsers((prev) => prev.filter((usuario) => usuario.id !== id))
    if (activeUsuarioId === id) {
      setActiveUsuarioId(null)
      setAsignacionesOpen(false)
    }
    showNotification('Usuario eliminado exitosamente', 'success')
  }

  // Envía los datos del modal dinámico según el tipo seleccionado.
  const handleSubmitDynamicModal = async (formData) => {
    let successMessage = ''

    switch (dynamicModalType) {
      case MODAL_TYPES.USUARIO: {
        // Formatea nombres y apellidos a mayúsculas en inicial.
        const formatWords = (value) =>
          value
            .trim()
            .split(' ')
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')

        const payload = {
          nombre: formatWords(formData.nombre),
          apellidos: formatWords(formData.apellidos),
          correo: formData.correo.trim().toLowerCase(),
          contraseña: formData.contraseña,
          rol: formData.rol,
          fincas: Array.isArray(formData.fincas) ? formData.fincas.map(Number).filter(Boolean) : [],
          cultivos: Array.isArray(formData.cultivos) ? formData.cultivos.map(Number).filter(Boolean) : [],
        }

        if (editingUser) {
          // Actualiza usuario existente.
          const response = await updateUser(editingUser.id, payload)
          if (!response.success) {
            showNotification(response.message, 'error')
            return
          }

          setUsers((prev) => prev.map((usuario) => (usuario.id === response.data.id ? response.data : usuario)))
          successMessage = `Usuario "${response.data.nombre} ${response.data.apellidos}" actualizado exitosamente`
        } else {
          // Crea un nuevo usuario.
          const response = await createUser(payload)
          if (!response.success) {
            showNotification(response.message, 'error')
            return
          }

          setUsers((prev) => [...prev, response.data])
          successMessage = `Usuario "${response.data.nombre} ${response.data.apellidos}" agregado exitosamente`
        }
        break
      }
      case MODAL_TYPES.CULTIVO:
        // Solo muestra mensaje; no hay implementación real de creación de cultivo aquí.
        successMessage = `Cultivo "${formData.nombre}" agregado exitosamente`
        break
      case MODAL_TYPES.COSTO:
        // Solo muestra mensaje; no hay implementación real de creación de costo aquí.
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
        try {
          if (editingFinca) {
            await updateFinca(editingFinca.id, { nombre, ubicacion })
            successMessage = `Finca "${nombre}" actualizada exitosamente`
          } else {
            await createFinca({ nombre, ubicacion })
            successMessage = `Finca "${nombre}" agregada exitosamente`
          }
          setFincasRefresh((prev) => prev + 1)
          setEditingFinca(null)
        } catch (error) {
          console.error(error)
          const message = error?.response?.data?.error || 'Error guardando la finca'
          showNotification(message, 'error')
          return
        }
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

  // Detalle completo del cultivo seleccionado (cuando se hace clic en uno).
  const detalleCultivo = selectedCultivoId ? Agro.getDetalleCultivo(selectedCultivoId) : null
  const cultivoSeleccionado = selectedCultivoId ? Agro.cultivos.find((c) => c.id === selectedCultivoId) : null

  // Suma los costos del cultivo seleccionado y cuenta los registros.
  const costosDetalleTotales = (() => {
    if (!detalleCultivo?.costos) return { total: 0, count: 0 }
    let total = 0
    detalleCultivo.costos.forEach((f) => {
      total += Agro.parseMoney(f.valor)
    })
    return { total, count: detalleCultivo.costos.length }
  })()

  // Datos para la tabla de rentabilidad en la sección de análisis.
  const rentabilidadRows = dashboardData?.rentability || []


  // Cuando estamos en el dashboard, actualiza los gráficos usando el servicio adminCharts.
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

  // Cuando estamos en la sección de rentabilidad, actualiza sus gráficos.
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

  // Escucha el evento de cambio de finca y actualiza los gráficos de la sección activa.
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

  // Cambia la sección activa del panel y guarda la selección en localStorage.
  const switchSection = (sectionId) => {
    if (sectionId !== 'detalle-cultivo') {
      setSelectedCultivoId(null)
    }
    setActiveSection(sectionId)
    setPageTitle(SECTION_TITLES[sectionId] || 'Dashboard')
  }

  // Cambia la finca seleccionada y notifica al usuario.
  const onFincaChange = (id) => {
    Agro.setSelectedFincaId(id)
    setFincaId(id)
    const fincaNombre = fincas.find((f) => String(f.id) === String(id))?.nombre || id
    showNotification(`Finca ${fincaNombre} seleccionada`)
  }

  // Cierra sesión y redirige a la página de inicio.
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

  // Abre la vista de detalle de un cultivo específico.
  const openCultivoDetalle = (cultivo) => {
    setSelectedCultivoId(cultivo.id)
    setActiveSection('detalle-cultivo')
    setPageTitle(`Cultivo de ${cultivo.nombre}`)
    setElementosCultivo({ open: false, rows: [] })
  }

  // Regresa de la vista de detalle a la lista de cultivos.
  const backToCultivos = () => {
    setSelectedCultivoId(null)
    setElementosCultivo({ open: false, rows: [] })
    switchSection('cultivos')
    setPageTitle('Gestión de Cultivos')
  }

  // Desplaza suavemente la pantalla hacia una sección específica.
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Configuración de los enlaces del menú lateral.
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

  // Abre un reporte específico y muestra la sección de reportes.
  const openReport = (tipo) => {
    setReportType(tipo)
    setReportVisible(true)
  }

  // Exporta el reporte visible a PDF usando html2pdf.
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

  // Exporta el reporte visible a Excel usando XLSX.
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
      {/* Modal dinámico que se usa para crear o editar usuarios, cultivos, costos o fincas. */}
      <DynamicModal
        isOpen={showDynamicModal}
        modalType={dynamicModalType}
        onClose={handleCloseDynamicModal}
        onSubmit={handleSubmitDynamicModal}
        title={editingUser ? 'Editar Usuario' : undefined}
        submitButtonText={editingUser ? 'Actualizar Usuario' : undefined}
        fieldOptions={modalFieldOptions}
        initialData={memoizedModalInitialData}
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

      

      {/* Barra lateral con navegación, selección de finca y opción de cerrar sesión. */}
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
        {/* Encabezado principal que muestra el título actual y permite navegar dentro de un cultivo. */}
        <Header
          title={pageTitle}
          showNavCultivo={activeSection === 'detalle-cultivo'}
          onScrollToSection={scrollToSection}
        />

        <div className="content-container">
          {/* Sección de dashboard general con indicadores clave, gráficos y alertas. */}
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
                  Margen: <span id="kpiMargen">{Number(margin || 0).toFixed(1)}%</span>
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

          {/* Sección de gestión de fincas: lista, búsqueda y botones de acción. */}
          {/* Sección de gestión de fincas: lista, búsqueda y botones de acción. */}
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

          {/* Sección de gestión de usuarios: búsqueda, lista y edición/ eliminación. */}
          <section id="usuarios-section" className={`content-section ${activeSection === 'usuarios' ? 'active' : ''}`}>
            <div className="section-header">
              <div className="search-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar por nombre..."
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-search"
                  onClick={() => setFiltroUsuario('')}
                >
                  Limpiar
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
                  {filteredUsers.map((usuario) => {
                    const isWorker = usuario.rol?.toString().toLowerCase() === 'trabajador'

                    return (
                      <tr
                        key={usuario.id}
                        className={`data-item ${isWorker ? 'usuario-clickeable' : ''} ${activeUsuarioId === usuario.id ? 'activo' : ''}`}
                        onClick={(e) => {
                          if (!isWorker) return
                          if (e.target.closest('.action-buttons')) return
                          setActiveUsuarioId(usuario.id)
                          setAsignacionesOpen(true)
                          setTimeout(() => document.getElementById('asignaciones-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
                        }}
                      >
                        <td data-field="nombre">{`${usuario.nombre} ${usuario.apellidos || ''}`.trim()}</td>
                        <td data-field="email">{usuario.email}</td>
                        <td data-field="password">{usuario.password}</td>
                        <td data-field="rol">{usuario.rol}</td>
                        <td data-field="acciones">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="btn-icon btn-edit"
                              title="Editar"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEditUser(usuario)
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-delete"
                              title="Eliminar"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteUser(usuario.id)
                              }}
                            >
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
                    {users.find((u) => u.id === activeUsuarioId)?.nombre || '--'}
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
                    {activeUsuarioAssignments.length > 0 ? (
                      activeUsuarioAssignments.map((a, i) => (
                        <tr key={i} className="data-item">
                          <td data-field="finca">{a.finca}</td>
                          <td data-field="cultivos">{a.cultivos}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="data-item">
                        <td colSpan={2} style={{ textAlign: 'center', color: '#666' }}>
                          No hay asignaciones registradas para este trabajador.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Sección de cultivos: lista por finca y acceso a detalles individuales. */}
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
                  {cultivos && cultivos.length > 0 ? (
                    cultivos.map((c) => (
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
                        <td data-field="tipo">{c.tipo || '--'}</td>
                        <td data-field="fecha-siembra">{c.fechaInicio || '--'}</td>
                        <td data-field="fecha-cosecha">{c.fechaCosecha || '--'}</td>
                        <td data-field="estado">
                          <span className={`status-badge status-${c.estado?.toLowerCase().replace(/\s+/g, '-') || 'desconocido'}`}>
                            {c.estado || '--'}
                          </span>
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
                    ))
                  ) : (
                    <tr className="data-item">
                      <td colSpan={6} style={{ textAlign: 'center', color: '#666' }}>
                        No hay cultivos registrados en esta finca
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sección de detalle de cultivo con etapas, cosechas y costos asociados. */}
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

          {/* Sección de reportes: filtros, selección de tipo y exportación. */}
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

          {/* Sección de costos generales: lista de costos y detalle de inventario. */}
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

          {/* Sección de rentabilidad: gráficos comparativos y tabla de márgenes. */}
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
                      <td>{Number(r.margen || 0).toFixed(1)}%</td>
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