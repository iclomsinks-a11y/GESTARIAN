import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Wrench,
  Car,
  FileText,
  Scale,
  Truck,
  Users,
  AlertTriangle,
  ClipboardList,
  Settings,
  X,
} from 'lucide-react'
import { playSound } from '../../lib/sound'
import { supabase } from '../../lib/supabase'

interface BentoMenuModalProps {
  isOpen: boolean
  onClose: () => void
  backgroundImage?: string | null
}

const MENU_COLORS = [
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#d946ef', // Fuchsia
  '#eab308', // Yellow
]

export const BentoMenuModal: React.FC<BentoMenuModalProps> = ({
  isOpen,
  onClose,
  backgroundImage: initialBg,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [bgImage, setBgImage] = useState<string>(
    initialBg || '/images/backgrounds/background_portrait.png'
  )

  useEffect(() => {
    if (initialBg) {
      setBgImage(initialBg)
      return
    }
    supabase
      .from('configuracion')
      .select('fondo_portrait')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.fondo_portrait) {
          setBgImage(data.fondo_portrait)
        }
      }, () => {})
  }, [initialBg])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleNavClick = (path: string, state?: any) => {
    try {
      playSound('click')
    } catch (_) {}
    onClose()
    if (state) {
      navigate(path, { state })
    } else {
      navigate(path)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col justify-between overflow-hidden select-none"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ['--bento-gap' as any]: '8px',
      }}
    >
      {/* Overlay oscuro semitransparente sobre la imagen (30% como la versión blindada) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />

      {/* Botón cerrar */}
      <button
        onClick={() => {
          try {
            playSound('click')
          } catch (_) {}
          onClose()
        }}
        className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95 shadow-lg cursor-pointer"
        aria-label="Cerrar menú"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Bento grid — ocupando la totalidad del display adaptándose al espacio disponible */}
      <div
        className="relative z-10 w-full h-full flex flex-col box-border"
        style={{
          padding: 'calc(var(--bento-gap) * 2)',
        }}
      >
        <div
          className="w-full h-full max-w-none grid"
          style={{
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateRows: 'repeat(7, 1fr)',
            gap: 'var(--bento-gap)',
          }}
        >
          <style>{`
            @keyframes flyFromLeft {
              0% { opacity: 0; transform: translate3d(-140px, -60px, 0) scale(0.6) rotate(-8deg); }
              100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
            }
            @keyframes flyFromRight {
              0% { opacity: 0; transform: translate3d(140px, 60px, 0) scale(0.6) rotate(8deg); }
              100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
            }
            @keyframes flyFromTop {
              0% { opacity: 0; transform: translate3d(0, -180px, 0) scale(0.5); }
              100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
            }
            @keyframes flyFromBottom {
              0% { opacity: 0; transform: translate3d(0, 180px, 0) scale(0.5); }
              100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
            }
            @keyframes flyFromTopRight {
              0% { opacity: 0; transform: translate3d(160px, -120px, 0) scale(0.5) rotate(12deg); }
              100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
            }
            @keyframes flyFromBottomLeft {
              0% { opacity: 0; transform: translate3d(-160px, 120px, 0) scale(0.5) rotate(-12deg); }
              100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
            }
            @keyframes bentoTap {
              0% { transform: scale(1); }
              40% { transform: scale(0.93); }
              100% { transform: scale(1); }
            }
            .bento-btn {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              gap: 3px;
              border-radius: 12px;
              border-width: 1px;
              border-style: solid;
              overflow: hidden;
              cursor: pointer;
              -webkit-tap-highlight-color: transparent;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
              padding: 4px 2px;
              width: 100%;
              height: 100%;
              min-height: 0;
              animation-duration: 0.9s;
              animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
              animation-fill-mode: backwards;
              backdrop-filter: blur(12px);
            }
            .bento-btn span {
              color: #e2e8f0;
              font-weight: 800;
              font-size: clamp(0.85rem, 2.5vw, 1.3125rem);
              line-height: 1.15;
              text-align: center;
              letter-spacing: -0.01em;
              width: 100%;
              display: block;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              padding: 0 2px;
            }
            .bento-btn .bento-plus {
              color: #e2e8f0;
              font-weight: 900;
              font-size: clamp(1.4rem, 4vw, 2.1rem);
              line-height: 1;
              text-align: center;
            }
            .bento-btn:active {
              animation: bentoTap 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            .bento-btn.active-page {
              border-width: 2.5px;
              box-shadow: 0 0 20px rgba(255,255,255,0.3);
            }
          `}</style>

          {/* 1. INICIO (span 5) */}
          <button
            className={`bento-btn ${location.pathname === '/' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 5',
              backgroundColor: `${MENU_COLORS[0]}4D`,
              borderColor: MENU_COLORS[0],
              animationName: 'flyFromLeft',
              animationDelay: '0.03s',
            }}
            onClick={() => handleNavClick('/')}
          >
            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[0] }} strokeWidth={1.8} />
            <span>Inicio</span>
          </button>

          {/* 2. EXPEDIENTES (span 7) */}
          <button
            className={`bento-btn ${location.pathname === '/expedientes' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 7',
              backgroundColor: `${MENU_COLORS[1]}4D`,
              borderColor: MENU_COLORS[1],
              animationName: 'flyFromTopRight',
              animationDelay: '0.05s',
            }}
            onClick={() => handleNavClick('/expedientes')}
          >
            <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[1] }} strokeWidth={1.8} />
            <span>Expedientes</span>
          </button>

          {/* 3. CITAS (span 4) */}
          <button
            className={`bento-btn ${location.pathname === '/citas' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 4',
              backgroundColor: `${MENU_COLORS[3]}4D`,
              borderColor: MENU_COLORS[3],
              animationName: 'flyFromLeft',
              animationDelay: '0.08s',
            }}
            onClick={() => handleNavClick('/citas')}
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[3] }} strokeWidth={1.8} />
            <span>Citas</span>
          </button>

          {/* 4. REPARACIONES (span 8) */}
          <button
            className={`bento-btn ${location.pathname === '/reparaciones' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 8',
              backgroundColor: `${MENU_COLORS[5]}4D`,
              borderColor: MENU_COLORS[5],
              animationName: 'flyFromRight',
              animationDelay: '0.11s',
            }}
            onClick={() => handleNavClick('/reparaciones')}
          >
            <Wrench className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[5] }} strokeWidth={1.8} />
            <span>Reparaciones</span>
          </button>

          {/* 5. VEHÍCULOS (span 5) */}
          <button
            className={`bento-btn ${location.pathname === '/vehiculos' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 5',
              backgroundColor: `${MENU_COLORS[4]}4D`,
              borderColor: MENU_COLORS[4],
              animationName: 'flyFromLeft',
              animationDelay: '0.13s',
            }}
            onClick={() => handleNavClick('/vehiculos')}
          >
            <Car className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[4] }} strokeWidth={1.8} />
            <span>Vehículos</span>
          </button>

          {/* 6. FACTURACIÓN (span 7) */}
          <button
            className={`bento-btn ${location.pathname === '/facturas' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 7',
              backgroundColor: `${MENU_COLORS[6]}4D`,
              borderColor: MENU_COLORS[6],
              animationName: 'flyFromRight',
              animationDelay: '0.16s',
            }}
            onClick={() => handleNavClick('/facturas')}
          >
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[6] }} strokeWidth={1.8} />
            <span>Facturación</span>
          </button>

          {/* 7. BALANCES (span 5) */}
          <button
            className={`bento-btn ${location.pathname === '/balances' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 5',
              backgroundColor: `${MENU_COLORS[7]}4D`,
              borderColor: MENU_COLORS[7],
              animationName: 'flyFromLeft',
              animationDelay: '0.19s',
            }}
            onClick={() => handleNavClick('/balances')}
          >
            <Scale className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[7] }} strokeWidth={1.8} />
            <span>Balances</span>
          </button>

          {/* 8. PROVEEDORES (span 7) */}
          <button
            className={`bento-btn ${location.pathname === '/proveedores' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 7',
              backgroundColor: `${MENU_COLORS[8]}4D`,
              borderColor: MENU_COLORS[8],
              animationName: 'flyFromRight',
              animationDelay: '0.21s',
            }}
            onClick={() => handleNavClick('/proveedores')}
          >
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[8] }} strokeWidth={1.8} />
            <span>Proveedores</span>
          </button>

          {/* 9. CLIENTES (span 5) */}
          <button
            className={`bento-btn ${location.pathname === '/clientes' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 5',
              backgroundColor: `${MENU_COLORS[2]}4D`,
              borderColor: MENU_COLORS[2],
              animationName: 'flyFromLeft',
              animationDelay: '0.24s',
            }}
            onClick={() => handleNavClick('/clientes')}
          >
            <Users className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[2] }} strokeWidth={1.8} />
            <span>Clientes</span>
          </button>

          {/* 10. INCIDENCIAS (span 7) */}
          <button
            className={`bento-btn ${location.pathname === '/incidencias' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 7',
              backgroundColor: `${MENU_COLORS[9]}4D`,
              borderColor: MENU_COLORS[9],
              animationName: 'flyFromRight',
              animationDelay: '0.27s',
            }}
            onClick={() => handleNavClick('/incidencias')}
          >
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[9] }} strokeWidth={1.8} />
            <span>Incidencias</span>
          </button>

          {/* 11. PRESUPUESTOS (span 6) */}
          <button
            className={`bento-btn ${location.pathname === '/presupuestos' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 6',
              padding: '4px 2px',
              backgroundColor: `${MENU_COLORS[4]}4D`,
              borderColor: MENU_COLORS[4],
              animationName: 'flyFromLeft',
              animationDelay: '0.29s',
            }}
            onClick={() => handleNavClick('/presupuestos')}
          >
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[4] }} strokeWidth={1.8} />
            <span style={{ padding: '0 2px' }}>Presupuestos</span>
          </button>

          {/* 12. CONFIGURACIÓN (span 6) */}
          <button
            className={`bento-btn ${location.pathname === '/configuracion' ? 'active-page' : ''}`}
            style={{
              gridColumn: 'span 6',
              padding: '4px 2px',
              backgroundColor: `${MENU_COLORS[11]}4D`,
              borderColor: MENU_COLORS[11],
              animationName: 'flyFromRight',
              animationDelay: '0.32s',
            }}
            onClick={() => handleNavClick('/configuracion')}
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: MENU_COLORS[11] }} strokeWidth={1.8} />
            <span style={{ padding: '0 2px' }}>Configuración</span>
          </button>

          {/* 13. + PRESUPUESTO */}
          <button
            key="nuevo-presupuesto"
            className="bento-btn"
            style={{
              gridColumn: 'span 6',
              backgroundColor: `${MENU_COLORS[0]}4D`,
              borderColor: MENU_COLORS[0],
              boxShadow: `0 0 15px ${MENU_COLORS[0]}, inset 0 0 10px ${MENU_COLORS[0]}`,
              animationName: 'flyFromLeft',
              animationDelay: '0.35s',
            }}
            onClick={() => handleNavClick('/presupuestos', { openForm: true })}
          >
            <span className="bento-plus" style={{ color: MENU_COLORS[0] }}>+</span>
            <span>Presupuesto</span>
          </button>

          {/* 14. + CLIENTE */}
          <button
            key="nuevo-cliente"
            className="bento-btn"
            style={{
              gridColumn: 'span 6',
              backgroundColor: `${MENU_COLORS[4]}4D`,
              borderColor: MENU_COLORS[4],
              boxShadow: `0 0 15px ${MENU_COLORS[4]}, inset 0 0 10px ${MENU_COLORS[4]}`,
              animationName: 'flyFromRight',
              animationDelay: '0.37s',
            }}
            onClick={() => handleNavClick('/clientes', { openNewModal: true })}
          >
            <span className="bento-plus" style={{ color: MENU_COLORS[4] }}>+</span>
            <span>Cliente</span>
          </button>
        </div>
      </div>
    </div>
  )
}
