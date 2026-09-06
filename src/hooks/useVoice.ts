import { useSyncExternalStore, useCallback } from 'react';
import { voiceService, MetisState } from '../services/voiceService';

export function useVoice() {
  const state = useSyncExternalStore<MetisState>(
    (callback) => voiceService.subscribe(callback),
    () => voiceService.getState(),
    () => voiceService.getState()
  );

  const desbloquearAltavoz = useCallback(() => {
    voiceService.unlockAudio();
  }, []);

  const setIsOpen = useCallback((open: boolean) => {
    voiceService.setIsOpen(open);
  }, []);

  const startListening = useCallback(() => {
    voiceService.setIsOpen(true);
    voiceService.startListening();
  }, []);

  const toggleListening = useCallback(() => {
    voiceService.toggleListening();
  }, []);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
  }, []);

  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking();
  }, []);

  const toggleMute = useCallback(() => {
    return voiceService.toggleMute();
  }, []);

  const processQuery = useCallback((query: string) => {
    voiceService.processQuery(query);
  }, []);

  const startBidirectionalMode = useCallback(() => {
    voiceService.setIsOpen(true);
    voiceService.startBidirectionalConversation();
  }, []);

  const stopBidirectionalMode = useCallback(() => {
    voiceService.stopBidirectionalConversation();
  }, []);

  const toggleBidirectionalMode = useCallback(() => {
    voiceService.toggleBidirectionalConversation();
  }, []);

  const clearHistory = useCallback(() => {
    voiceService.clearHistory();
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    return await voiceService.requestMicrophonePermission();
  }, []);

  return {
    state,
    isOpen: state.isOpen,
    isBidirectional: state.isBidirectional,
    audioLevel: state.audioLevel,
    setIsOpen,
    desbloquearAltavoz,
    iniciarEscucha: toggleListening,
    detenerEscucha: stopListening,
    detenerHabla: stopSpeaking,
    toggleListening,
    startListening,
    stopListening,
    stopSpeaking,
    toggleMute,
    processQuery,
    procesarConsulta: processQuery,
    startBidirectionalMode,
    stopBidirectionalMode,
    toggleBidirectionalMode,
    clearHistory,
    requestMicrophonePermission,
  };
}
