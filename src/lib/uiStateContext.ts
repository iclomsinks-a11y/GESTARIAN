import { createContext, useContext } from 'react'

export type AvatarState = 'idle' | 'listening' | 'speaking';

export interface UIStateCtx {
  isFullscreen: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  headerVisible: boolean;
  footerVisible: boolean;
  setHeaderHover: (v: boolean) => void;
  setFooterHover: (v: boolean) => void;
  audioStream?: MediaStream;
  setAudioStream?: (stream: MediaStream) => void;
  mediaRecorder?: MediaRecorder;
  setMediaRecorder?: (recorder: MediaRecorder) => void;
  avatarState: AvatarState;
  setAvatarState: (s: AvatarState) => void;
}

export const UIStateContext = createContext<UIStateCtx>({
  isFullscreen: false,
  enterFullscreen: () => {},
  exitFullscreen: () => {},
  headerVisible: false,
  footerVisible: false,
  setHeaderHover: () => {},
  setFooterHover: () => {},
  audioStream: undefined,
  setAudioStream: () => {},
  mediaRecorder: undefined,
  setMediaRecorder: () => {},
  avatarState: 'idle',
  setAvatarState: () => {},
});

export const useUIState = () => useContext(UIStateContext)
