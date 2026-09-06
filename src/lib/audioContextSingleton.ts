let audioContextInstance: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContextInstance) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioContextInstance = new AudioCtx();
  }
  return audioContextInstance;
}
