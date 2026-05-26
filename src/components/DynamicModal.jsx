import React, { useState, useEffect } from 'react'
import { getModalConfig, validateForm, validateField } from '../utils/modalConfig'

/**
 * Componente de modal dinámico que cambia su contenido según el tipo
 */
export function DynamicModal({ isOpen, modalType, onClose, onSubmit, title, fieldOptions = {}, initialData = {}, onFieldChange }) {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [focusedField, setFocusedField] = useState(null)
  const [showPassword, setShowPassword] = useState({})

  const config = getModalConfig(modalType)

  // Inicializar formData cuando cambia el tipo de modal
  useEffect(() => {
    if (isOpen && modalType) {
      const init = {}
      config.fields.forEach((field) => {
        init[field.name] = field.defaultValue || ''
      })
      // merge provided initialData (from parent) on top of defaults
      setFormData({ ...init, ...(initialData || {}) })
      setErrors({})
      setFocusedField(null)
    }
  }, [isOpen, modalType, initialData])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (typeof onFieldChange === 'function') onFieldChange(name, value)
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
      <style>{`
        .modal-overlay input::placeholder {
          color: #b0b0b0 !important;
          opacity: 1 !important;
        }
        .modal-overlay input::-webkit-input-placeholder {
          color: #b0b0b0 !important;
        }
        .modal-overlay input::-moz-placeholder {
          color: #b0b0b0 !important;
          opacity: 1 !important;
        }
        .modal-overlay input:-ms-input-placeholder {
          color: #b0b0b0 !important;
        }
        .modal-overlay textarea::placeholder {
          color: #b0b0b0 !important;
          opacity: 1 !important;
        }
        .modal-overlay textarea::-webkit-input-placeholder {
          color: #b0b0b0 !important;
        }
        .modal-overlay textarea::-moz-placeholder {
          color: #b0b0b0 !important;
          opacity: 1 !important;
        }
        .modal-overlay textarea:-ms-input-placeholder {
          color: #b0b0b0 !important;
        }
        .dynamic-modal-input {
          background-color: white !important;
        }
        .dynamic-modal-textarea {
          background-color: white !important;
        }
      `}</style>
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

              {field.type === 'select' ? (
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
                  {(fieldOptions[field.name] || field.options || []).map((option) => (
                    <option key={option.value || option} value={option.value || option}>
                      {option.label || option}
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
              {config.submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default DynamicModal
