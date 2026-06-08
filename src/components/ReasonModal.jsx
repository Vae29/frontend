import { useState } from 'react'
import Swal from 'sweetalert2'

export default function ReasonModal({ onConfirm, onCancel, isOpen, title = 'Cambio de Estado', question = '¿Desea continuar?' }) {
  const [motivo, setMotivo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Campo requerido',
        text: 'El motivo es obligatorio',
        confirmButtonColor: '#4CAF50',
      })
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(motivo.trim())
      setMotivo('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setMotivo('')
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>{title}</h2>
        <p style={{ marginTop: 0, marginBottom: '20px', color: '#666', fontSize: '14px' }}>{question}</p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            Motivo *
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Explique el motivo del cambio de estado"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
            disabled={isLoading}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#e0e0e0'
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#f5f5f5'
              }
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !motivo.trim()}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: isLoading || !motivo.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              opacity: isLoading || !motivo.trim() ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (!isLoading && motivo.trim()) {
                e.target.style.backgroundColor = '#45a049'
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading && motivo.trim()) {
                e.target.style.backgroundColor = '#4CAF50'
              }
            }}
          >
            {isLoading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
