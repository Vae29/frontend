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
          name: 'ubicacion',
          label: 'Ubicación',
          type: 'text',
          placeholder: 'Ej: Granada, Meta',
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
