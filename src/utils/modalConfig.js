/**
 * Configuración centralizada para los modales del panel de administración
 * Define la estructura, campos y comportamiento de cada tipo de modal
 */

export const MODAL_TYPES = {
  USUARIO: 'usuario',
  CULTIVO: 'cultivo',
  COSTO: 'costo',
  FINCA: 'finca',
}

export const CATEGORIAS_COSTO = [
  'Mano de Obra',
  'Materia Prima',
  'Servicios',
  'Costos Indirectos',
]

export const TIPOS_CULTIVOS = [
  'Naranja',
  'Plátano',
  'Tomate',
  'Maíz',
  'Lechuga',
  'Papa',
  'Café',
  'Cacao',
]

export const ESTADO_COSTO = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
]

/**
 * Define la estructura de campos para cada tipo de modal
 */
export const getModalConfig = (type) => {
  const configs = {
    [MODAL_TYPES.USUARIO]: {
      title: 'Agregar Nuevo Usuario',
      submitButtonText: 'Agregar Usuario',
      fields: [
        {
          name: 'nombre',
          label: 'Nombre',
          type: 'text',
          placeholder: 'Ej: Juan Pérez',
          required: true,
        },
        {
          name: 'correo',
          label: 'Correo',
          type: 'text',
          placeholder: 'Ej: juan@example.com',
          required: true,
        },
        {
          name: 'contraseña',
          label: 'Contraseña',
          type: 'password',
          placeholder: 'Mínimo 8 caracteres',
          required: true,
        },
        {
          name: 'rol',
          label: 'Rol',
          type: 'select',
          options: [
            { value: 'administrador', label: 'Administrador' },
            { value: 'trabajador', label: 'Trabajador' },
          ],
          required: true,
        },
        {
          name: 'fincas',
          label: 'Fincas Asignadas',
          type: 'multiselect-search',
          multiple: true,
          required: false,
          searchPlaceholder: 'Buscar finca...',
        },
        {
          name: 'cultivos',
          label: 'Cultivos Asignados',
          type: 'multiselect-search',
          multiple: true,
          required: false,
          searchPlaceholder: 'Buscar cultivo...',
        },
      ],
    },
    [MODAL_TYPES.CULTIVO]: {
      title: 'Agregar Nuevo Cultivo',
      submitButtonText: 'Agregar Cultivo',
      fields: [
        {
          name: 'nombre',
          label: 'Nombre del Cultivo',
          type: 'text',
          placeholder: 'Ej: Tomate Cherry',
          required: true,
        },
        {
          name: 'tipo',
          label: 'Tipo de Cultivo',
          type: 'select',
          options: TIPOS_CULTIVOS.map((tipo) => ({ value: tipo, label: tipo })),
          required: true,
        },
      ],
    },
    [MODAL_TYPES.COSTO]: {
      title: 'Agregar Nuevo Costo',
      submitButtonText: 'Agregar Costo',
      fields: [
        {
          name: 'categoria',
          label: 'Categoría',
          type: 'select',
          options: CATEGORIAS_COSTO.map((cat) => ({ value: cat, label: cat })),
          required: true,
        },
        {
          name: 'descripcion',
          label: 'Descripción (Opcional)',
          type: 'textarea',
          placeholder: 'Ej: Compra de fertilizante NPK 15-15-15',
          required: false,
        },
        {
          name: 'monto',
          label: 'Monto',
          type: 'number',
          placeholder: 'Ej: 50000',
          required: true,
        },
        {
          name: 'estado',
          label: 'Estado',
          type: 'select',
          options: ESTADO_COSTO,
          defaultValue: 'pendiente',
          required: true,
        },
      ],
    },
    [MODAL_TYPES.FINCA]: {
      title: 'Agregar Nueva Finca',
      submitButtonText: 'Agregar Finca',
      fields: [
        {
          name: 'nombre',
          label: 'Nombre de la Finca',
          type: 'text',
          placeholder: 'Ej: Finca El Bosque',
          required: true,
        },
        {
          name: 'departamento',
          label: 'Departamento',
          type: 'select',
          options: [], // se proveerá desde DEPARTAMENTOS
          required: true,
        },
        {
          name: 'municipio',
          label: 'Municipio / Ciudad',
          type: 'select',
          options: [], // se cargan dinámicamente según departamento seleccionado
          required: true,
        },
      ],
    },
  }

  return configs[type] || configs[MODAL_TYPES.FINCA]
}

/**
 * Crea el estado inicial del formulario basado en el tipo de modal
 */
export const createInitialFormState = (type) => {
  const config = getModalConfig(type)
  const initialState = {}

  config.fields.forEach((field) => {
    initialState[field.name] = field.defaultValue || ''
  })

  return initialState
}

/**
 * Valida si un campo es válido basado en su configuración
 */
export const validateField = (field, value) => {
  if (field.required && !value) {
    return `${field.label} es requerido`
  }

  if ((field.type === 'email' || field.name === 'correo') && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'El correo no es válido'
    }
  }

  if (field.type === 'password' && value) {
    if (value.length < 8) {
      return 'La contraseña debe tener mínimo 8 caracteres'
    }
  }

  if (field.type === 'number' && value) {
    if (isNaN(value) || Number(value) <= 0) {
      return 'El monto debe ser un número mayor a 0'
    }
  }

  return null
}

/**
 * Valida todo el formulario
 */
export const validateForm = (type, formData) => {
  const config = getModalConfig(type)
  const errors = {}

  config.fields.forEach((field) => {
    const error = validateField(field, formData[field.name])
    if (error) {
      errors[field.name] = error
    }
  })

  return errors
}

/**
 * Resetea el estado del formulario
 */
export const resetForm = (type) => {
  return createInitialFormState(type)
}

// Lista de departamentos y municipios (centralizada para usar en modales)
export const MUNICIPIOS_POR_DEPARTAMENTO = {
  Amazonas: ['Leticia', 'Puerto Nariño'],
  Antioquia: ['Medellín', 'Envigado', 'Bello', 'Itagüí', 'Rionegro', 'Turbo', 'Apartadó', 'Caucasia', 'Santa Fe de Antioquia', 'Marinilla'],
  Arauca: ['Arauca', 'Arauquita', 'Saravena', 'Tame', 'Fortul'],
  Atlántico: ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia', 'Sabanalarga', 'Baranoa'],
  Bolívar: ['Cartagena', 'Magangué', 'Turbaco', 'El Carmen de Bolívar', 'Arjona', 'Mompox'],
  Boyacá: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Villa de Leyva', 'Paipa', 'Samacá'],
  Caldas: ['Manizales', 'Chinchiná', 'La Dorada', 'Villamaría', 'Riosucio'],
  Caquetá: ['Florencia', 'San Vicente del Caguán', 'Cartagena del Chairá', 'Belén de los Andaquíes'],
  Casanare: ['Yopal', 'Aguazul', 'Villanueva', 'Paz de Ariporo', 'Tauramena'],
  Cauca: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía', 'Guapi'],
  Cesar: ['Valledupar', 'Aguachica', 'Bosconia', 'Codazzi', 'Curumaní'],
  Chocó: ['Quibdó', 'Istmina', 'Tadó', 'Condoto', 'Bahía Solano'],
  Córdoba: ['Montería', 'Cereté', 'Lorica', 'Sahagún', 'Planeta Rica'],
  Cundinamarca: ['Soacha', 'Zipaquirá', 'Chía', 'Facatativá', 'Girardot', 'Fusagasugá', 'Mosquera', 'Madrid', 'Cajicá'],
  'Bogotá D.C.': ['Suba', 'Engativá', 'Kennedy', 'Chapinero', 'Usaquén', 'Bosa'],
  Guainía: ['Inírida'],
  Guaviare: ['San José del Guaviare', 'Calamar', 'El Retorno', 'Miraflores'],
  Huila: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre'],
  'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'Fonseca', 'San Juan del Cesar'],
  Magdalena: ['Santa Marta', 'Ciénaga', 'Fundación', 'Plato', 'El Banco'],
  Meta: ['Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Restrepo'],
  Nariño: ['Pasto', 'Ipiales', 'Tumaco', 'Túquerres', 'La Unión'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Villa del Rosario', 'Pamplona', 'Tibú'],
  Putumayo: ['Mocoa', 'Puerto Asís', 'Orito', 'Sibundoy', 'Valle del Guamuez'],
  Quindío: ['Armenia', 'Calarcá', 'Montenegro', 'Quimbaya', 'Salento'],
  Risaralda: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Belén de Umbría'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia'],
  Santander: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil'],
  Sucre: ['Sincelejo', 'Corozal', 'Tolú', 'San Marcos', 'Sampués'],
  Tolima: ['Ibagué', 'Espinal', 'Melgar', 'Honda', 'Chaparral'],
  'Valle del Cauca': ['Alcalá', 'Andalucía', 'Ansermanuevo', 'Argelia', 'Bolívar', 'Buenaventura', 'Bugalagrande', 'Caicedonia', 'Calima El Darién', 'Candelaria', 'Cartago', 'Dagua', 'El Águila', 'El Cairo', 'El Cerrito', 'El Dovio', 'Florida', 'Ginebra', 'Guacarí', 'Guadalajara de Buga', 'Jamundí', 'La Cumbre', 'La Unión', 'La Victoria', 'Obando', 'Palmira', 'Pradera', 'Restrepo', 'Riofrío', 'Roldanillo', 'San Pedro', 'Sevilla', 'Toro', 'Trujillo', 'Tuluá', 'Ulloa', 'Versalles', 'Vijes', 'Yotoco', 'Yumbo', 'Zarzal'],
  Vaupés: ['Mitú', 'Carurú', 'Taraira'],
  Vichada: ['Puerto Carreño', 'La Primavera', 'Santa Rosalía', 'Cumaribo'],
}

export const DEPARTAMENTOS = Object.keys(MUNICIPIOS_POR_DEPARTAMENTO).map((d) => ({ value: d, label: d }))
