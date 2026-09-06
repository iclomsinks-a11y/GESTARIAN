import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Menu, Headphones } from 'lucide-react'
import { playSound } from '../../lib/sound'
import { BentoMenuModal } from '../common/BentoMenuModal'

export const AppFooterNav: React.FC = () => {
  const navigate = useNavigate()
  const [bentoOpen, setBentoOpen] = useState(false)
  const [animatingBtn, setAnimatingBtn] = useState<string | null>(null)

  const triggerAnimatedAction = (btnKey: string, action: () => void) => {
    try {
      playSound('click')
    } catch (_) {}
    setAnimatingBtn(btnKey)
    setTimeout(() => {
      setAnimatingBtn(null)
      action()
    }, 180)
  }

  return (
    <>
      {/* Iconos flotantes independientes fijos en toda la aplicación (sin envoltorio, relleno 0%) */}
      <nav
        id="app-global-footer"
        className="fixed bottom-5 sm:bottom-6 left-0 right-0 z-40 w-full max-w-xl mx-auto px-4 pointer-events-none"
        aria-label="Navegación rápida de la aplicación"
      >
        <div className="grid grid-cols-4 place-items-center w-full">
          {/* 1. Botón Cámara */}
          <button
            id="footer-camera-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              triggerAnimatedAction('camera', () => navigate('/presupuestos?modo=hibrido'))
            }}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-transparent text-[#40e0d0] shadow-[0_0_12px_rgba(64,224,208,0.9),inset_0_0_6px_rgba(64,224,208,0.9)] border border-white flex items-center justify-center transition-all hover:scale-110 shrink-0 cursor-pointer pointer-events-auto ${
              animatingBtn === 'camera' ? 'scale-125 border-cyan-400' : ''
            }`}
            style={{ filter: 'drop-shadow(0 0 6px rgb(64, 224, 157))' }}
            aria-label="Cámara para Presupuesto"
            title="Cámara para Presupuesto"
          >
            <div className={animatingBtn === 'camera' ? 'animate-icon-burst' : ''}>
              <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={1.5} />
            </div>
          </button>

          {/* 2. Botón Menú Bento */}
          <button
            id="footer-bento-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              triggerAnimatedAction('menu', () => setBentoOpen(true))
            }}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-transparent text-[#d3d3d3] shadow-[0_0_14px_rgba(249,115,22,0.9),inset_0_0_8px_rgba(249,115,22,0.9)] border border-white flex items-center justify-center transition-all hover:scale-110 shrink-0 cursor-pointer pointer-events-auto ${
              animatingBtn === 'menu' ? 'scale-125 border-orange-400' : ''
            }`}
            style={{ filter: 'drop-shadow(0 0 6px #f15b04)' }}
            aria-label="Menú Bento"
            title="Menú Bento"
          >
            <div className={animatingBtn === 'menu' ? 'animate-icon-burst' : ''}>
              <Menu className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={1.5} />
            </div>
          </button>

          {/* 3. Botón Asistente METIS IA */}
          <button
            id="footer-metis-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              triggerAnimatedAction('ai', () => {
                window.dispatchEvent(new CustomEvent('metis-open-voice'))
              })
            }}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-transparent text-white shadow-[0_0_12px_rgba(168,85,247,1),inset_0_0_6px_rgba(168,85,247,0.8)] border border-white/80 flex items-center justify-center transition-all hover:scale-110 shrink-0 relative cursor-pointer pointer-events-auto ${
              animatingBtn === 'ai' ? 'scale-125 border-purple-400' : ''
            }`}
            aria-label="Asistente METIS IA"
            title="Asistente METIS IA"
          >
            <div className={animatingBtn === 'ai' ? 'animate-icon-burst' : ''}>
              <span
                className="font-thin text-[26px] sm:text-[28px] text-transparent tracking-widest drop-shadow-[0_0_6px_rgba(168,85,247,1)]"
                style={{ WebkitTextStroke: '1px white' }}
              >
                AI
              </span>
            </div>
            <span className="absolute top-1 right-1 w-3 sm:w-3.5 h-3 sm:h-3.5 bg-emerald-400 rounded-full border-2 border-black animate-metis-ping" />
          </button>

          {/* 4. Botón Conversación Bidireccional */}
          <button
            id="footer-bidirectional-voice-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              triggerAnimatedAction('bidirectional', () => {
                window.dispatchEvent(new CustomEvent('metis-open-voice', { detail: { bidirectional: true } }))
                window.dispatchEvent(new CustomEvent('metis-start-bidirectional'))
              })
            }}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-transparent text-[#10b981] shadow-[0_0_14px_rgba(16,185,129,0.9),inset_0_0_8px_rgba(16,185,129,0.9)] border border-white flex items-center justify-center transition-all hover:scale-110 shrink-0 relative cursor-pointer pointer-events-auto ${
              animatingBtn === 'bidirectional' ? 'scale-125 border-emerald-400' : ''
            }`}
            style={{ filter: 'drop-shadow(0 0 6px #10b981)' }}
            aria-label="Conversación Bidireccional Continua"
            title="Conversación Bidireccional Continua"
          >
            <div className={animatingBtn === 'bidirectional' ? 'animate-icon-burst' : ''}>
              <Headphones className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={1.5} />
            </div>
            <span className="absolute top-1 right-1 w-3 sm:w-3.5 h-3 sm:h-3.5 bg-cyan-400 rounded-full border-2 border-black animate-metis-ping" />
          </button>
        </div>
      </nav>

      {/* Menú Bento Modal Desplegable */}
      <BentoMenuModal
        isOpen={bentoOpen}
        onClose={() => setBentoOpen(false)}
      />
    </>
  )
}
