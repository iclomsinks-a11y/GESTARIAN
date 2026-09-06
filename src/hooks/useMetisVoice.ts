import { useSyncExternalStore, useCallback } from 'react';
import { voiceService, MetisState } from '../services/voiceService';

export function useMetisVoice() {
  const state = useSyncExternalStore<MetisState>(
    (callback) => voiceService.subscribe(callback),
    () => voiceService.getState(),
    () => voiceService.getState()
  );

  const desbloquearAltavozMovil = useCallback(() => {
    voiceService.unlockAudio();
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

  const setIsOpen = useCallback((open: boolean) => {
    voiceService.setIsOpen(open);
  }, []);

  return {
    state,
    isOpen: state.isOpen,
    setIsOpen,
    isBidirectional: state.isBidirectional,
    audioLevel: state.audioLevel,
    desbloquearAltavozMovil,
    toggleListening,
    startListening: () => {
      voiceService.setIsOpen(true);
      voiceService.startListening();
    },
    stopListening,
    stopSpeaking,
    toggleMute,
    processQuery,
    startBidirectionalMode,
    stopBidirectionalMode,
    toggleBidirectionalMode,
  };
}
