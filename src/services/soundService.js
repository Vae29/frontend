/**
 * Sound Service
 * Gestiona la reproducción de efectos de sonido para retroalimentación auditiva
 * Utiliza Web Audio API para generar tonos simples y profesionales
 */

class SoundService {
  constructor() {
    this.audioContext = null;
    this.isMuted = localStorage.getItem('soundsMuted') === 'true';
    this.volume = parseFloat(localStorage.getItem('soundsVolume') || '0.3');
  }

  /**
   * Inicializa el contexto de audio
   */
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Reproduce un tono simple con la frecuencia, duración y tipo especificados
   * @param {number} frequency - Frecuencia en Hz
   * @param {number} duration - Duración en segundos
   * @param {string} type - Tipo de onda: 'sine', 'square', 'sawtooth', 'triangle'
   */
  playTone(frequency, duration, type = 'sine') {
    if (this.isMuted) return;

    try {
      const ctx = this.initAudioContext();
      const now = ctx.currentTime;

      // Crear oscilador
      const oscillator = ctx.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = frequency;

      // Crear ganancia para el volumen y fade out
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(this.volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Conectar nodos
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Reproducir
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
    }
  }

  /**
   * Sonido de éxito - dos tonos ascendentes suaves
   * Usado para: crear, actualizar, guardar correctamente
   */
  playSuccess() {
    // Tono 1: 523 Hz (C5) - 100ms
    this.playTone(523, 0.1, 'sine');
    // Tono 2: 659 Hz (E5) - 100ms, después de 50ms
    setTimeout(() => this.playTone(659, 0.1, 'sine'), 50);
  }

  /**
   * Sonido de desactivación/archivado - tono único neutral
   * Usado para: desactivar, bloquear, archivar registros
   */
  playDisable() {
    // Tono único: 440 Hz (A4) - 150ms
    this.playTone(440, 0.15, 'sine');
  }

  /**
   * Sonido de error - dos tonos descendentes
   * Usado para: fallos, errores de validación, operaciones fallidas
   */
  playError() {
    // Tono 1: 659 Hz (E5) - 100ms
    this.playTone(659, 0.1, 'sine');
    // Tono 2: 523 Hz (C5) - 100ms, después de 100ms
    setTimeout(() => this.playTone(523, 0.1, 'sine'), 100);
  }

  /**
   * Sonido de advertencia - tono ascendente ligero
   * Usado para: validaciones, advertencias, acciones que requieren atención
   */
  playWarning() {
    // Tono único: 587 Hz (D5) - 120ms
    this.playTone(587, 0.12, 'sine');
  }

  /**
   * Sonido de confirmación - tono único suave
   * Usado para: confirmación general de acciones
   */
  playConfirm() {
    // Tono único: 554 Hz (C#5) - 100ms
    this.playTone(554, 0.1, 'sine');
  }

  /**
   * Sonido de operación completada - tono positivo
   * Usado para: finalización de procesos, sincronización
   */
  playComplete() {
    // Secuencia de tres tonos ascendentes cortos
    // Tono 1: 523 Hz (C5) - 80ms
    this.playTone(523, 0.08, 'sine');
    // Tono 2: 587 Hz (D5) - 80ms, después de 60ms
    setTimeout(() => this.playTone(587, 0.08, 'sine'), 60);
    // Tono 3: 659 Hz (E5) - 80ms, después de 120ms
    setTimeout(() => this.playTone(659, 0.08, 'sine'), 120);
  }

  /**
   * Silencia o reactiva los sonidos
   * @param {boolean} mute - true para silenciar, false para reactivar
   */
  setMute(mute) {
    this.isMuted = mute;
    localStorage.setItem('soundsMuted', mute);
  }

  /**
   * Establece el volumen
   * @param {number} volume - Volumen entre 0 y 1
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundsVolume', this.volume);
  }

  /**
   * Obtiene el estado de silencio
   */
  isMutedState() {
    return this.isMuted;
  }

  /**
   * Obtiene el volumen actual
   */
  getVolume() {
    return this.volume;
  }
}

// Instancia singleton del servicio de sonidos
export const soundService = new SoundService();

export default soundService;
