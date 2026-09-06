import React, { useState, useEffect, useRef } from 'react'
import { useVoice } from '../../hooks/useVoice'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Send
} from 'lucide-react'

export const MetisVoiceModal: React.FC = () => {
  const { 
    state, 
    isOpen, 
    setIsOpen, 
    isBidirectional,
    toggleListening, 
    startBidirectionalMode,
    stopBidirectionalMode,
    stopSpeaking, 
    toggleMute, 
    processQuery,
    desbloquearAltavoz 
  } = useVoice()

  const [manualInput, setManualInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOpen = (e?: Event) => {
      desbloquearAltavoz()
      setIsOpen(true)
      const customEvt = e as CustomEvent<{ bidirectional?: boolean }>
      if (customEvt?.detail?.bidirectional) {
        startBidirectionalMode()
      }
    }
    const handleStartBidirectional = () => {
      desbloquearAltavoz()
      startBidirectionalMode()
    }

    window.addEventListener('metis-open-voice', handleOpen)
    window.addEventListener('metis-toggle-panel', handleOpen)
    window.addEventListener('metis-start-bidirectional', handleStartBidirectional)
    return () => {
      window.removeEventListener('metis-open-voice', handleOpen)
      window.removeEventListener('metis-toggle-panel', handleOpen)
      window.removeEventListener('metis-start-bidirectional', handleStartBidirectional)
    }
  }, [desbloquearAltavoz, setIsOpen, startBidirectionalMode])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isOpen, state.history, state.transcript, state.status])

  if (!isOpen) return null

  const handleSend = () => {
    if (!manualInput.trim()) return
    desbloquearAltavoz()
    processQuery(manualInput.trim())
    setManualInput('')
  }

  const isListening = state.status === 'listening'

  return (
    <div 
      id="metis-modal-backdrop"
      onClick={() => {
        stopSpeaking()
        if (isBidirectional) stopBidirectionalMode()
        setIsOpen(false)
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Tarjeta limpia: 70% de altura de pantalla, centrada, borde blanco 1px, glow celeste, relleno opacidad 5% */}
      <div
        id="metis-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl h-[70vh] flex flex-col rounded-2xl sm:rounded-3xl border border-white bg-white/[0.05] backdrop-blur-xl shadow-[0_0_25px_rgba(56,189,248,0.5),0_0_50px_rgba(14,165,233,0.3)] overflow-hidden"
      >
        {/* Cabecera limpia y minimalista */}
        <div className="px-5 py-3.5 border-b border-white/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold tracking-wider text-white">METIS IA</span>
            {isBidirectional && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 border border-white text-white font-medium">
                Voz Continua
              </span>
            )}
            {isListening && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 border border-white text-white font-medium animate-pulse">
                Escuchando
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={state.isMuted ? 'Activar altavoz' : 'Silenciar'}
              aria-label={state.isMuted ? 'Activar altavoz' : 'Silenciar'}
            >
              {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeaking()
                if (isBidirectional) stopBidirectionalMode()
                setIsOpen(false)
              }}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Cerrar"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área central de globos de diálogo (Opacidad 20%, línea blanca 1px sin glow) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {state.history.length === 0 && !state.transcript && (
            <div className="h-full flex items-center justify-center p-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white/20 border border-white text-white text-center max-w-sm">
                <p className="font-semibold text-sm">METIS IA</p>
                <p className="text-xs text-white/80 mt-1">
                  {isBidirectional 
                    ? 'Conversación continua activa. Habla o escribe y te responderé de tú a tú.' 
                    : 'Asistente de taller disponible. Habla por el micrófono o escribe en el recuadro.'}
                </p>
              </div>
            </div>
          )}

          {state.history.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] p-3.5 rounded-2xl bg-white/20 border border-white text-white text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                }`}
              >
                <p className={`text-[10px] font-semibold tracking-wider uppercase mb-1 ${
                  msg.role === 'user' ? 'text-white/70' : 'text-cyan-200/90'
                }`}>
                  {msg.role === 'user' ? 'Tú' : 'METIS IA'}
                </p>
                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
              </div>
            </div>
          ))}

          {/* Globo de transcripción de dictado en tiempo real */}
          {state.transcript && (
            <div className="flex justify-end">
              <div className="max-w-[82%] p-3.5 rounded-2xl bg-white/20 border border-white text-white text-xs sm:text-sm leading-relaxed italic animate-pulse rounded-br-sm">
                <p className="text-[10px] font-semibold tracking-wider uppercase text-white/70 mb-1">
                  Dictando...
                </p>
                <div className="whitespace-pre-wrap break-words">{state.transcript}...</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Zona inferior de controles: Input 3 líneas + botón enviar grande a la derecha + botón micro abajo centrado */}
        <div className="p-4 sm:p-5 pt-3 border-t border-white/20 bg-white/[0.02] flex flex-col gap-3 shrink-0">
          {/* Fila: Input de dictado para tres líneas + Botón de enviar grande a la derecha */}
          <div className="flex items-stretch gap-3 w-full">
            <textarea
              id="metis-dictation-input"
              rows={3}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Escribe o dicta tu consulta técnica..."
              className="flex-1 bg-white/10 border border-white focus:border-white focus:outline-none rounded-xl p-3 text-xs sm:text-sm text-white placeholder-white/50 resize-none h-[76px] leading-relaxed"
            />
            <button
              id="metis-send-btn"
              type="button"
              onClick={handleSend}
              disabled={!manualInput.trim()}
              className="h-[76px] px-5 sm:px-6 rounded-xl bg-white/20 hover:bg-white/30 border border-white text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title="Enviar mensaje"
              aria-label="Enviar mensaje"
            >
              <Send className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Botón de micrófono abajo centrado */}
          <div className="flex flex-col items-center justify-center pt-1 pb-0.5">
            <button
              id="metis-mic-btn"
              type="button"
              onClick={() => {
                desbloquearAltavoz()
                toggleListening()
              }}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-white flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600/80 text-white animate-pulse'
                  : isBidirectional
                  ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={isListening ? 'Detener micrófono' : 'Hablar por micrófono'}
              aria-label="Micrófono"
            >
              {isListening ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </button>
            {isListening && (
              <span className="text-[11px] text-white/80 font-medium mt-1 tracking-wide animate-pulse">
                Escuchando...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
