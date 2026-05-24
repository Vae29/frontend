import React, { useState, useEffect } from 'react'
import { getModalConfig, validateForm, validateField } from '../utils/modalConfig'

/**
 * Componente de modal dinámico que cambia su contenido según el tipo
 */
export function DynamicModal({ isOpen, modalType, onClose, onSubmit, title, submitButtonText, initialData, fieldOptions }) {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [focusedField, setFocusedField] = useState(null)
  const [showPassword, setShowPassword] = useState({})
  const [searchFilters, setSearchFilters] = useState({})

  let config = getModalConfig(modalType)

  // Actualizar opciones dinámicas si se proporcionan
  if (fieldOptions && config) {
    config = {
      ...config,
      fields: config.fields.map((field) => {
        if (fieldOptions[field.name]) {
          return {
            ...field,
            options: fieldOptions[field.name],
          }
        }
        return field
      }),
    }
  }

  // Inicializar formData cuando cambia el tipo de modal o llegan datos iniciales
  useEffect(() => {
    if (isOpen && modalType) {
      const initialState = {}
      const initialSearch = {}
      config.fields.forEach((field) => {
        if (initialData && Object.prototype.hasOwnProperty.call(initialData, field.name)) {
          initialState[field.name] = initialData[field.name]
        } else {
          initialState[field.name] = field.defaultValue || (field.type === 'checkbox-group' ? [] : '')
        }
        if (field.type === 'checkbox-group') {
          initialSearch[field.name] = ''
        }
      })
      setFormData(initialState)
      setErrors({})
      setFocusedField(null)
      setSearchFilters(initialSearch)
    }
  }, [isOpen, modalType, initialData, fieldOptions])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validar el formulario
    const validationErrors = validateForm(modalType, formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Enviar los datos
    onSubmit(formData)

    // Resetear el formulario
    setFormData({})
    setErrors({})
  }

  const handleCancel = () => {
    setFormData({})
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}
        onClick={handleCancel}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            marginBottom: '30px',
            color: 'var(--color-verde-oscuro)',
            fontFamily: "var(--font-titulo, 'Playfair Display')",
          }}
        >
          {title || config.title}
        </h2>

        <form onSubmit={handleSubmit}>
          {config.fields.map((field) => (
            <div key={field.name} style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'var(--color-verde-oscuro)',
                }}
              >
                {field.label}
                {field.required && <span style={{ color: '#e74c3c' }}> *</span>}
              </label>

              {field.type === 'checkbox-group' ? (
                <div>
                  <input
                    type="text"
                    placeholder={`Buscar ${field.label.toLowerCase()}...`}
                    value={searchFilters[field.name] || ''}
                    onChange={(e) => {
                      setSearchFilters((prev) => ({
                        ...prev,
                        [field.name]: e.target.value.toLowerCase(),
                      }))
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: '12px',
                      border: '2px solid #e8e8e8',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: "var(--font-cuerpo, 'Poppins')",
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-verde-oscuro)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e8e8'
                    }}
                  />
                  <div
                    style={{
                      border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: 'white',
                      maxHeight: '250px',
                      overflowY: 'auto',
                    }}
                  >
                    {field.options && field.options.length > 0 ? (
                      field.options
                        .filter(
                          (option) =>
                            option.label.toLowerCase().includes(searchFilters[field.name] || '') ||
                            (option.description && option.description.toLowerCase().includes(searchFilters[field.name] || ''))
                        )
                        .map((option) => (
                          <label
                            key={option.value}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              marginBottom: '10px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontFamily: "var(--font-cuerpo, 'Poppins')",
                              padding: '8px',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f5f5f5'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              value={option.value}
                              checked={
                                Array.isArray(formData[field.name])
                                  ? formData[field.name].includes(option.value)
                                  : false
                              }
                              onChange={(e) => {
                                const currentArray = Array.isArray(formData[field.name]) ? formData[field.name] : []
                                const newArray = e.target.checked
                                  ? [...currentArray, option.value]
                                  : currentArray.filter((item) => item !== option.value)
                                setFormData((prev) => ({
                                  ...prev,
                                  [field.name]: newArray,
                                }))
                                if (errors[field.name]) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    [field.name]: '',
                                  }))
                                }
                              }}
                              style={{
                                marginRight: '8px',
                                marginTop: '2px',
                                cursor: 'pointer',
                                width: '16px',
                                height: '16px',
                                accentColor: 'var(--color-verde-oscuro)',
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{option.label}</span>
                              {option.description && (
                                <span style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                  {option.description}
                                </span>
                              )}
                            </div>
                          </label>
                        ))
                    ) : (
                      <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>No hay opciones disponibles</p>
                    )}
                  </div>
                </div>
              ) : field.type === 'select' ? (
                <select
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField(field.name)}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: "var(--font-cuerpo, 'Poppins')",
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!errors[field.name] && focusedField !== field.name) {
                      e.target.style.borderColor = 'var(--color-verde-oscuro)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!errors[field.name] && focusedField !== field.name) {
                      e.target.style.borderColor = '#e8e8e8'
                    }
                  }}
                >
                  <option value="">Seleccionar {field.label}</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="dynamic-modal-textarea"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField(field.name)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={field.placeholder}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: "var(--font-cuerpo, 'Poppins')",
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    resize: 'vertical',
                  }}
                  onMouseEnter={(e) => {
                    if (!errors[field.name] && focusedField !== field.name) {
                      e.target.style.borderColor = 'var(--color-verde-oscuro)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!errors[field.name] && focusedField !== field.name) {
                      e.target.style.borderColor = '#e8e8e8'
                    }
                  }}
                />
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    className="dynamic-modal-input"
                    type={field.type === 'password' && showPassword[field.name] ? 'text' : field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField(field.name)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: field.type === 'password' ? '12px 45px 12px 16px' : '12px 16px',
                      border: `2px solid ${errors[field.name] ? '#e74c3c' : '#e8e8e8'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: "var(--font-cuerpo, 'Poppins')",
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundColor: 'white',
                      outline: 'none',
                      boxShadow: 'none',
                      WebkitBoxShadow: 'none',
                      color: '#333',
                      WebkitTextFillColor: '#333',
                    }}
                    onMouseEnter={(e) => {
                      if (!errors[field.name] && focusedField !== field.name) {
                        e.target.style.borderColor = 'var(--color-verde-oscuro)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!errors[field.name] && focusedField !== field.name) {
                        e.target.style.borderColor = '#e8e8e8'
                      }
                    }}
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          [field.name]: !prev[field.name],
                        }))
                      }
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-verde-oscuro)',
                      }}
                      title={showPassword[field.name] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword[field.name] ? '👁️' : '👁️‍🗨️'}
                    </button>
                  )}
                </div>
              )}

              {errors[field.name] && (
                <p
                  style={{
                    color: '#e74c3c',
                    fontSize: '12px',
                    marginTop: '6px',
                    margin: '6px 0 0 0',
                  }}
                >
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '30px',
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '10px 24px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: "var(--font-cuerpo, 'Poppins')",
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e0e0e0'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f5f5f5'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: 'var(--color-verde-oscuro)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: "var(--font-cuerpo, 'Poppins')",
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#3d5231'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--color-verde-oscuro)'
              }}
            >
              {submitButtonText || config.submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default DynamicModal
