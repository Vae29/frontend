/**
 * useSounds Hook
 * Hook reutilizable para acceder a los efectos de sonido en todo el sistema
 */

import { useCallback } from 'react';
import soundService from '../services/soundService';

export const useSounds = () => {
  const playSuccess = useCallback(() => {
    soundService.playSuccess();
  }, []);

  const playDisable = useCallback(() => {
    soundService.playDisable();
  }, []);

  const playError = useCallback(() => {
    soundService.playError();
  }, []);

  const playWarning = useCallback(() => {
    soundService.playWarning();
  }, []);

  const playConfirm = useCallback(() => {
    soundService.playConfirm();
  }, []);

  const playComplete = useCallback(() => {
    soundService.playComplete();
  }, []);

  const setMute = useCallback((mute) => {
    soundService.setMute(mute);
  }, []);

  const setVolume = useCallback((volume) => {
    soundService.setVolume(volume);
  }, []);

  const isMuted = useCallback(() => {
    return soundService.isMutedState();
  }, []);

  const getVolume = useCallback(() => {
    return soundService.getVolume();
  }, []);

  return {
    playSuccess,
    playDisable,
    playError,
    playWarning,
    playConfirm,
    playComplete,
    setMute,
    setVolume,
    isMuted,
    getVolume,
  };
};

export default useSounds;
