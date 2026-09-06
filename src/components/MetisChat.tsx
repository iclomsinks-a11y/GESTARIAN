import React, { useState, useEffect, useRef } from 'react'
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  Volume2, 
  VolumeX, 
  Headphones, 
  Radio, 
  Trash2, 
  AlertCircle,
  Activity,
  CheckCircle2,
  Wrench
} from 'lucide-react'
import { useVoice } from '../hooks/useVoice'
import { appContextService, LiveAppContext } from '../services/appContextService'

interface MetisChatProps {
  className?: string
  compact?: boolean
  onClose?: () => void
}

export const MetisChat: React.FC<MetisChatProps> = ({ className = '', compact = false, onClose }) => {
  const {
    state,
    isBidirectional,
    audioLevel,
    toggleListening,
    toggleBidirectionalMode,
    stopSpeaking,
    toggleMute,
    processQuery,
    clearHistory,
    desbloquearAltavoz
  } = useVoice()

  const [inputQuery, setInputQuery] = useState('')
  const [appContext, setAppContext] = useState<LiveAppContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    appContextService.getLiveAppContext().then(setAppContext).catch(() => {})
  }, [state.isOpen, state.status])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.history, state.transcript, state.status])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputQuery.trim()) return
    desbloquearAltavoz()
    processQuery(inputQuery.trim())
    setInputQuery('')
  }

  const isListening = state.status === 'listening'
  const isSpeaking = state.status === 'speaking'
  const isProcessing = state.status === 'processing'

  const quickPrompts = [
    '¿Cuántos vehículos y reparaciones tenemos hoy en el taller?',
    '¿Hay algún presupuesto pendiente de aprobación?',
    '¿Cómo confeccionar un presupuesto de chapa y mecánica?',
    'Explícame la normativa Veri*Factu para las facturas'
  ]

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isBidirectional 
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50' 
                : 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/20'
            }`}>
              {isBidirectional ? <Headphones className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            {isListening && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-slate-900 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                METIS IA
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  {appContext?.empresa.sectorLabel || 'Automoción'}
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              {isBidirectional ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Modo Conversación Fluida Activo
                </span>
              ) : (
                <span>Asistente por voz y texto</span>
              )}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {/* Bidirectional Mode Toggle */}
          <button
            onClick={() => {
              desbloquearAltavoz()
              toggleBidirectionalMode()
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isBidirectional
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Activar o desactivar conversación bidireccional continua (de tú a tú)"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modo Continuo</span>
          </button>

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl text-xs border transition-colors ${
              state.isMuted
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={state.isMuted ? 'Altavoz silenciado' : 'Altavoz activo'}
          >
            {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clear history */}
          {state.history.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
              title="Borrar historial de chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Context Status Ribbon */}
      <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 overflow-x-auto gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-slate-300">
            <Wrench className="w-3.5 h-3.5 text-sky-400" />
            {appContext ? `${appContext.estadisticas.reparacionesEnCurso} en curso` : 'Cargando taller...'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            {appContext ? `${appContext.estadisticas.presupuestosPendientes} presupuestos` : '...'}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[260px] max-h-[460px]">
        {state.history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h4 className="text-sm font-bold text-white">METIS IA · Asistente en Tiempo Real</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Entiendo el estado dinámico de tu taller, presupuestos, facturas Veri*Factu y órdenes de trabajo.
                Activa el <strong>Modo Continuo</strong> para hablar de tú a tú sin pulsar botones.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg text-left pt-2">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    desbloquearAltavoz()
                    processQuery(prompt)
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.history.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role !== 'user' && (
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[82%] ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-800 text-slate-100 border border-slate-700/70 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Real-time interim voice transcription bubble */}
        {state.transcript && (
          <div className="flex gap-2.5 justify-end">
            <div className="p-3.5 rounded-2xl text-xs bg-sky-600/70 text-white italic max-w-[82%] rounded-br-none animate-pulse border border-sky-400/40">
              <span className="inline-block w-2 h-2 rounded-full bg-white mr-2 animate-ping" />
              {state.transcript}...
            </div>
          </div>
        )}

        {/* Assistant Processing state */}
        {isProcessing && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-sky-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-slate-300 text-[11px] ml-1">Consultando contexto del taller...</span>
            </div>
          </div>
        )}

        {/* Assistant Speaking state with soundwaves */}
        {isSpeaking && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/40 text-xs text-sky-300">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>METIS hablando por altavoz...</span>
            </div>
            <button
              onClick={stopSpeaking}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium"
            >
              Interrumpir
            </button>
          </div>
        )}

        {/* Error message */}
        {state.errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{state.errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice level & audio meter when listening */}
      {isListening && (
        <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-rose-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Escuchando tu voz...</span>
          </div>

          {/* Audio Visualizer Wave */}
          <div className="flex items-center gap-1 h-5">
            {[0.2, 0.5, 0.8, 1, 0.7, 0.4, 0.9, 0.6].map((multiplier, i) => {
              const height = Math.max(3, Math.min(20, Math.round((audioLevel || 20) * multiplier * 0.25)))
              return (
                <div
                  key={i}
                  className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                  style={{ height: `${height}px` }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        {/* Mic toggle */}
        <button
          onClick={() => {
            desbloquearAltavoz()
            toggleListening()
          }}
          className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-rose-600 text-white ring-4 ring-rose-500/30 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title={isListening ? 'Detener escucha' : 'Hablar por micrófono'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text input */}
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              isBidirectional 
                ? 'Modo continuo activo: habla por micrófono o escribe...' 
                : 'Escribe o pulsa el micro para consultar a METIS...'
            }
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-medium text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  )
}
