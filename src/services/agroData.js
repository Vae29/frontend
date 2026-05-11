// BD simulada — módulo ES (antes agro-data.js)

const STORAGE_KEY_FINCA = 'selectedFincaId'

export function parseMoney(value) {
  if (value == null) return 0
  const n = parseInt(String(value).replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

export function parseDateDDMMYYYY(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy === '--') return null
  const [d, m, y] = ddmmyyyy.split('/')
  if (!d || !m || !y) return null
  const dt = new Date(Number(y), Number(m) - 1, Number(d))
  return Number.isNaN(dt.getTime()) ? null : dt
}

export function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

export const fincas = [
  { id: 'monterrey', nombre: 'Finca Monterrey', ubicacion: 'Acacías, Meta' },
  { id: 'miraflores', nombre: 'Finca Miraflores', ubicacion: 'Granada, Meta' },
]

export const cultivos = [
  { id: 1, nombre: 'Naranja', tipo: 'Cítrico', fincaId: 'monterrey', fechaInicio: '01/03/2026', fechaCosecha: '--', estado: 'en-proceso' },
  { id: 2, nombre: 'Tomate', tipo: 'Hortaliza', fincaId: 'miraflores', fechaInicio: '15/02/2026', fechaCosecha: '10/04/2026', estado: 'finalizado' },
  { id: 3, nombre: 'Plátano', tipo: 'Frutal', fincaId: 'monterrey', fechaInicio: '20/02/2026', fechaCosecha: '--', estado: 'en-pausa' },
  { id: 4, nombre: 'Maíz', tipo: 'Cereal', fincaId: 'miraflores', fechaInicio: '10/01/2026', fechaCosecha: '--', estado: 'suspendido' },
  { id: 5, nombre: 'Fresa', tipo: 'Frutal', fincaId: 'monterrey', fechaInicio: '05/03/2026', fechaCosecha: '--', estado: 'en-proceso' },
  { id: 6, nombre: 'Yuca', tipo: 'Tubérculo', fincaId: 'miraflores', fechaInicio: '12/03/2026', fechaCosecha: '--', estado: 'en-proceso' },
  { id: 7, nombre: 'Café', tipo: 'Perenne', fincaId: 'monterrey', fechaInicio: '18/03/2026', fechaCosecha: '--', estado: 'en-proceso' },
  { id: 8, nombre: 'Papaya', tipo: 'Frutal', fincaId: 'miraflores', fechaInicio: '20/03/2026', fechaCosecha: '--', estado: 'en-proceso' },
]

const detallesCultivos = {
  1: {
    etapas: [
      { nombre: 'Preparación', descripcion: 'Preparación del terreno y limpieza', fechaInicio: '01/03/2026', fechaFinal: '05/03/2026', estado: 'finalizado' },
      { nombre: 'Siembra', descripcion: 'Siembra de germoplasma seleccionado', fechaInicio: '06/03/2026', fechaFinal: '10/03/2026', estado: 'finalizado' },
      { nombre: 'Crecimiento', descripcion: 'Riego y fertilización periódica', fechaInicio: '11/03/2026', fechaFinal: '30/03/2026', estado: 'finalizado' },
      { nombre: 'En Producción', descripcion: 'Maduración y preparación para cosecha', fechaInicio: '31/03/2026', fechaFinal: '--', estado: 'en-proceso' },
    ],
    cosechas: [
      { fecha: '01/04/2026', cantidad: 250, unidad: 'kg', precio: '$5,000', tipoPrecio: 'Por Kg' },
      { fecha: '03/04/2026', cantidad: 180, unidad: 'kg', precio: '$5,200', tipoPrecio: 'Por Kg' },
    ],
    costos: [
      { fecha: '05/03/2026', usuario: 'Carlos Mendez', categoria: 'Mano de Obra', etapa: 'Preparación', descripcion: 'Jornales preparación terreno', valor: '$150,000' },
      { fecha: '08/03/2026', usuario: 'María Gonzalez', categoria: 'Materia Prima', etapa: 'Siembra', descripcion: 'Semillas de naranja calidad A', valor: '$280,000' },
      { fecha: '12/03/2026', usuario: 'Carlos Mendez', categoria: 'Servicios', etapa: 'Crecimiento', descripcion: 'Servicio fumigación - Control plagas', valor: '$180,000' },
      { fecha: '15/03/2026', usuario: 'María Gonzalez', categoria: 'Materia Prima', etapa: 'Crecimiento', descripcion: 'Fertilizante NPK 15-15-15', valor: '$220,000' },
      { fecha: '20/03/2026', usuario: 'Carlos Mendez', categoria: 'Costos Indirectos', etapa: 'En Producción', descripcion: 'Mantenimiento de herramientas', valor: '$95,000' },
    ],
  },
  2: {
    etapas: [
      { nombre: 'Preparación', descripcion: 'Preparación del terreno', fechaInicio: '15/02/2026', fechaFinal: '18/02/2026', estado: 'finalizado' },
      { nombre: 'Siembra', descripcion: 'Siembra de plántulas', fechaInicio: '19/02/2026', fechaFinal: '25/02/2026', estado: 'finalizado' },
      { nombre: 'Cosecha', descripcion: 'Recolección del producto', fechaInicio: '05/04/2026', fechaFinal: '10/04/2026', estado: 'finalizado' },
    ],
    cosechas: [
      { fecha: '05/04/2026', cantidad: 500, unidad: 'kg', precio: '$2,500', tipoPrecio: 'Por Kg' },
      { fecha: '08/04/2026', cantidad: 450, unidad: 'kg', precio: '$2,400', tipoPrecio: 'Por Kg' },
    ],
    costos: [
      { fecha: '15/02/2026', usuario: 'Juan Silva', categoria: 'Mano de Obra', etapa: 'Preparación', descripcion: 'Jornales preparación', valor: '$120,000' },
      { fecha: '18/02/2026', usuario: 'María Gonzalez', categoria: 'Materia Prima', etapa: 'Siembra', descripcion: 'Plántulas de tomate calidad premium', valor: '$150,000' },
      { fecha: '25/02/2026', usuario: 'Carlos Mendez', categoria: 'Servicios', etapa: 'Siembra', descripcion: 'Riego por goteo instalación', valor: '$200,000' },
    ],
  },
  4: {
    etapas: [
      { nombre: 'Preparación', descripcion: 'Preparación del terreno', fechaInicio: '10/01/2026', fechaFinal: '15/01/2026', estado: 'finalizado' },
      { nombre: 'Siembra', descripcion: 'Siembra de semillas', fechaInicio: '16/01/2026', fechaFinal: '20/01/2026', estado: 'finalizado' },
    ],
    cosechas: [],
    costos: [{ fecha: '10/01/2026', usuario: 'Admin', categoria: 'Materia Prima', etapa: 'Siembra', descripcion: 'Semillas de maíz', valor: '$200,000' }],
  },
  5: {
    etapas: [
      { nombre: 'Preparación', descripcion: 'Adecuación de camas y desinfección', fechaInicio: '05/03/2026', fechaFinal: '07/03/2026', estado: 'finalizado' },
      { nombre: 'Siembra', descripcion: 'Trasplante de plántulas', fechaInicio: '08/03/2026', fechaFinal: '10/03/2026', estado: 'finalizado' },
      { nombre: 'Crecimiento', descripcion: 'Riego y nutrición', fechaInicio: '11/03/2026', fechaFinal: '--', estado: 'en-proceso' },
    ],
    cosechas: [],
    costos: [
      { fecha: '06/03/2026', usuario: 'Carlos Mendez', categoria: 'Mano de Obra', etapa: 'Preparación', descripcion: 'Jornales adecuación camas', valor: '$110,000' },
      { fecha: '08/03/2026', usuario: 'Carlos Mendez', categoria: 'Materia Prima', etapa: 'Siembra', descripcion: 'Plántulas de fresa', valor: '$160,000' },
      { fecha: '14/03/2026', usuario: 'María Gonzalez', categoria: 'Servicios', etapa: 'Crecimiento', descripcion: 'Riego - mantenimiento', valor: '$70,000' },
    ],
  },
  6: {
    etapas: [
      { nombre: 'Preparación', descripcion: 'Limpieza y surcado', fechaInicio: '12/03/2026', fechaFinal: '14/03/2026', estado: 'finalizado' },
      { nombre: 'Siembra', descripcion: 'Siembra de estacas', fechaInicio: '15/03/2026', fechaFinal: '16/03/2026', estado: 'finalizado' },
      { nombre: 'Crecimiento', descripcion: 'Control de maleza', fechaInicio: '17/03/2026', fechaFinal: '--', estado: 'en-proceso' },
    ],
    cosechas: [],
    costos: [
      { fecha: '13/03/2026', usuario: 'Juan Silva', categoria: 'Mano de Obra', etapa: 'Preparación', descripcion: 'Jornales de surcado', valor: '$95,000' },
      { fecha: '15/03/2026', usuario: 'Admin', categoria: 'Materia Prima', etapa: 'Siembra', descripcion: 'Estacas de yuca', valor: '$120,000' },
      { fecha: '21/03/2026', usuario: 'Juan Silva', categoria: 'Costos Indirectos', etapa: 'Crecimiento', descripcion: 'Mantenimiento herramientas', valor: '$40,000' },
    ],
  },
  7: {
    etapas: [
      { nombre: 'Preparación', descripcion: 'Revisión de sombra y terreno', fechaInicio: '18/03/2026', fechaFinal: '20/03/2026', estado: 'finalizado' },
      { nombre: 'Siembra', descripcion: 'Siembra de almácigo', fechaInicio: '21/03/2026', fechaFinal: '22/03/2026', estado: 'finalizado' },
      { nombre: 'Crecimiento', descripcion: 'Fertilización y monitoreo', fechaInicio: '23/03/2026', fechaFinal: '--', estado: 'en-proceso' },
    ],
    cosechas: [],
    costos: [
      { fecha: '19/03/2026', usuario: 'Carlos Mendez', categoria: 'Mano de Obra', etapa: 'Preparación', descripcion: 'Jornales acondicionamiento', valor: '$130,000' },
      { fecha: '21/03/2026', usuario: 'María Gonzalez', categoria: 'Materia Prima', etapa: 'Siembra', descripcion: 'Semilla de café seleccionada', valor: '$210,000' },
      { fecha: '27/03/2026', usuario: 'Carlos Mendez', categoria: 'Servicios', etapa: 'Crecimiento', descripcion: 'Control preventivo de plagas', valor: '$85,000' },
    ],
  },
  8: {
    etapas: [
      { nombre: 'Preparación', descripcion: 'Limpieza y ahoyado', fechaInicio: '20/03/2026', fechaFinal: '22/03/2026', estado: 'finalizado' },
      { nombre: 'Siembra', descripcion: 'Trasplante de plántulas', fechaInicio: '23/03/2026', fechaFinal: '24/03/2026', estado: 'finalizado' },
      { nombre: 'Crecimiento', descripcion: 'Riego y abonado', fechaInicio: '25/03/2026', fechaFinal: '--', estado: 'en-proceso' },
    ],
    cosechas: [],
    costos: [
      { fecha: '21/03/2026', usuario: 'Juan Silva', categoria: 'Mano de Obra', etapa: 'Preparación', descripcion: 'Jornales ahoyado', valor: '$105,000' },
      { fecha: '23/03/2026', usuario: 'Admin', categoria: 'Materia Prima', etapa: 'Siembra', descripcion: 'Plántulas de papaya', valor: '$175,000' },
      { fecha: '30/03/2026', usuario: 'Juan Silva', categoria: 'Servicios', etapa: 'Crecimiento', descripcion: 'Riego - mantenimiento', valor: '$65,000' },
    ],
  },
}

export const trabajadores = [
  { id: 2, key: 'carlos', nombre: 'Carlos Mendez Rivas', email: 'carlos.mendez@gmail.com' },
  { id: 3, key: 'maria', nombre: 'María Gonzalez Ortiz', email: 'maria.gonzalez@gmail.com' },
  { id: 4, key: 'juan', nombre: 'Juan Pablo Silva Flores', email: 'juan.silva@gmail.com' },
]

export const asignaciones = [
  { trabajadorId: 2, fincaId: 'monterey', cultivoIds: [1, 3, 5, 7] },
  { trabajadorId: 2, fincaId: 'miraflores', cultivoIds: [2] },
  { trabajadorId: 3, fincaId: 'miraflores', cultivoIds: [4, 6, 8] },
  { trabajadorId: 3, fincaId: 'monterey', cultivoIds: [5] },
  { trabajadorId: 4, fincaId: 'miraflores', cultivoIds: [2, 4, 6, 8] },
  { trabajadorId: 4, fincaId: 'monterey', cultivoIds: [1, 7] },
]

export function getSelectedFincaId() {
  return localStorage.getItem(STORAGE_KEY_FINCA) || fincas[0].id
}

export function setSelectedFincaId(fincaId) {
  localStorage.setItem(STORAGE_KEY_FINCA, fincaId)
  window.dispatchEvent(new CustomEvent('agro:fincaChanged', { detail: { fincaId } }))
}

export function getFincaById(fincaId) {
  return fincas.find((f) => f.id === fincaId) || null
}

export function getCultivosByFinca(fincaId) {
  return cultivos.filter((c) => c.fincaId === fincaId)
}

export function getDetalleCultivo(cultivoId) {
  return detallesCultivos[cultivoId] || { etapas: [], cosechas: [], costos: [] }
}

export function computeCultivoIngresos(cultivoId) {
  const detalle = getDetalleCultivo(cultivoId)
  return (detalle.cosechas || []).reduce((acc, c) => acc + (Number(c.cantidad) || 0) * parseMoney(c.precio), 0)
}

export function computeCultivoCostos(cultivoId) {
  const detalle = getDetalleCultivo(cultivoId)
  return (detalle.costos || []).reduce((acc, c) => acc + parseMoney(c.valor), 0)
}

export function computeFincaResumen(fincaId) {
  const cs = getCultivosByFinca(fincaId)
  const costos = cs.reduce((acc, c) => acc + computeCultivoCostos(c.id), 0)
  const ingresos = cs.reduce((acc, c) => acc + computeCultivoIngresos(c.id), 0)
  const produccionKg = cs.reduce((acc, c) => {
    const detalle = getDetalleCultivo(c.id)
    const total = (detalle.cosechas || []).reduce((a, x) => a + (Number(x.cantidad) || 0), 0)
    return acc + total
  }, 0)
  const activos = cs.filter((c) => c.estado !== 'finalizado').length
  const finalizados = cs.filter((c) => c.estado === 'finalizado').length
  return {
    fincaId,
    totalCultivos: cs.length,
    cultivosActivos: activos,
    cultivosFinalizados: finalizados,
    costos,
    ingresos,
    ganancia: ingresos - costos,
    produccionKg,
  }
}

export function getTrabajadorByKey(key) {
  return trabajadores.find((t) => t.key === key) || null
}

export function getTrabajadorByEmail(email) {
  const e = (email || '').trim().toLowerCase()
  return trabajadores.find((t) => t.email.toLowerCase() === e) || null
}

export function getTrabajadorFincas(trabajadorId) {
  const fincaIds = Array.from(new Set(asignaciones.filter((a) => a.trabajadorId === trabajadorId).map((a) => a.fincaId)))
  return fincaIds.map((id) => getFincaById(id)).filter(Boolean)
}

export function getTrabajadorCultivos(trabajadorId, fincaId) {
  const asg = asignaciones.find((a) => a.trabajadorId === trabajadorId && a.fincaId === fincaId)
  if (!asg) return []
  return asg.cultivoIds.map((id) => cultivos.find((c) => c.id === id)).filter(Boolean)
}

export function agregarFinca(nombre, ubicacion) {
  const newId = `finca-${Date.now()}`
  fincas.push({ id: newId, nombre, ubicacion })
  return { id: newId, nombre, ubicacion }
}

/** Compatibilidad con código que esperaba window.AgroData */
export const AgroData = {
  parseMoney,
  parseDateDDMMYYYY,
  formatCOP,
  fincas,
  cultivos,
  trabajadores,
  asignaciones,
  getSelectedFincaId,
  setSelectedFincaId,
  getFincaById,
  getCultivosByFinca,
  getDetalleCultivo,
  computeCultivoIngresos,
  computeCultivoCostos,
  computeFincaResumen,
  getTrabajadorByKey,
  getTrabajadorFincas,
  getTrabajadorCultivos,
}
