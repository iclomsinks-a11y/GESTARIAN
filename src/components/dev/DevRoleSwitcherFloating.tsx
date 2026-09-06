import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../lib/ToastContext'
import type { RoleType } from '../../services/authService/types'
import { 
  Code, 
  Building2, 
  Wrench, 
  User, 
  Check, 
  ChevronUp, 
  ChevronDown, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Car, 
  Layers, 
  X,
  FileSpreadsheet,
  Inbox,
  GripVertical,
  RotateCcw
} from 'lucide-react'

export const DevRoleSwitcherFloating: React.FC = () => {
  const { rolActual, perfil, switchDevelopmentRole } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  // Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const isPointerDownRef = useRef(false)
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const elementStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize position from localStorage or default to bottom-right
  useEffect(() => {
    const saved = localStorage.getItem('dev_switcher_pos_v1')
    const buttonWidth = 240
    const buttonHeight = 48
    const margin = 20

    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const clampedX = Math.min(Math.max(margin, parsed.x), window.innerWidth - buttonWidth - margin)
          const clampedY = Math.min(Math.max(margin, parsed.y), window.innerHeight - buttonHeight - margin)
          setPosition({ x: clampedX, y: clampedY })
          return
        }
      } catch {
        // ignore parse error
      }
    }

    // Default: bottom-right corner
    const defaultX = Math.max(margin, window.innerWidth - buttonWidth - margin)
    const defaultY = Math.max(margin, window.innerHeight - buttonHeight - margin)
    setPosition({ x: defaultX, y: defaultY })
  }, [])

  // Keep button within window on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return null
        const buttonWidth = containerRef.current?.offsetWidth || 240
        const buttonHeight = 48
        const margin = 16
        const clampedX = Math.min(Math.max(margin, prev.x), window.innerWidth - buttonWidth - margin)
        const clampedY = Math.min(Math.max(margin, prev.y), window.innerHeight - buttonHeight - margin)
        return { x: clampedX, y: clampedY }
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Reset to default bottom-right position
  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation()
    const buttonWidth = containerRef.current?.offsetWidth || 240
    const buttonHeight = 48
    const margin = 20
    const defaultX = Math.max(margin, window.innerWidth - buttonWidth - margin)
    const defaultY = Math.max(margin, window.innerHeight - buttonHeight - margin)
    const newPos = { x: defaultX, y: defaultY }
    setPosition(newPos)
    localStorage.removeItem('dev_switcher_pos_v1')
    addToast('Posición del modo desarrollador restablecida a la esquina inferior', 'info')
  }

  // Pointer drag handlers (mouse & touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    // Don't start drag if clicking inside the popover menu
    if ((e.target as HTMLElement).closest('#dev-role-switcher-popover')) return

    isPointerDownRef.current = true
    hasDraggedRef.current = false
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    elementStartRef.current = position || {
      x: window.innerWidth - 240,
      y: window.innerHeight - 60
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return

    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y

    if (!hasDraggedRef.current && Math.hypot(deltaX, deltaY) > 5) {
      hasDraggedRef.current = true
      setIsDragging(true)
    }

    if (hasDraggedRef.current) {
      const buttonWidth = containerRef.current?.offsetWidth || 240
      const buttonHeight = 48
      const margin = 10

      const newX = Math.min(
        Math.max(margin, elementStartRef.current.x + deltaX),
        window.innerWidth - buttonWidth - margin
      )
      const newY = Math.min(
        Math.max(margin, elementStartRef.current.y + deltaY),
        window.innerHeight - buttonHeight - margin
      )

      setPosition({ x: newX, y: newY })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return
    isPointerDownRef.current = false

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    if (hasDraggedRef.current) {
      if (position) {
        localStorage.setItem('dev_switcher_pos_v1', JSON.stringify(position))
      }
      setTimeout(() => {
        setIsDragging(false)
        hasDraggedRef.current = false
      }, 60)
    } else {
      setIsDragging(false)
    }
  }

  // Switch role and optionally navigate
  const handleSwitchRole = async (targetRole: RoleType, targetPath?: string) => {
    if (switching) return
    try {
      setSwitching(true)
      const res = await switchDevelopmentRole(targetRole)
      if (res.success) {
        addToast(`Cambiado a Modo ${targetRole}`, 'success')
        if (targetPath) {
          navigate(targetPath)
        } else {
          // Default sensible navigation per role if not specified
          if (targetRole === 'CLIENTE' && !location.pathname.startsWith('/cliente')) {
            navigate('/cliente')
          } else if (targetRole === 'USUARIO' && location.pathname.startsWith('/cliente')) {
            navigate('/solicitudes')
          } else if (targetRole === 'DESARROLLADOR' && location.pathname.startsWith('/cliente')) {
            navigate('/dev')
          }
        }
      } else {
        addToast(res.error || `Error al cambiar a ${targetRole}`, 'error')
      }
    } catch (err: any) {
      addToast(err.message || 'Error en cambio de modo', 'error')
    } finally {
      setSwitching(false)
    }
  }

  // Quick jump helper that switches to appropriate role and navigates
  const handleQuickJump = async (path: string, requiredRole?: RoleType) => {
    if (requiredRole && rolActual !== requiredRole) {
      await switchDevelopmentRole(requiredRole)
    }
    navigate(path)
    setIsOpen(false)
  }

  // Color and labels for current role
  const getRoleConfig = (rol: RoleType) => {
    switch (rol) {
      case 'DESARROLLADOR':
        return {
          label: 'DESARROLLADOR',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dotColor: 'bg-purple-400',
          icon: Code,
          title: 'Master Developer'
        }
      case 'USUARIO':
        return {
          label: 'USUARIO (TALLER)',
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          dotColor: 'bg-sky-400',
          icon: Building2,
          title: 'Dueño / Gerente'
        }
      case 'AUTORIZADO':
        return {
          label: 'AUTORIZADO',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotColor: 'bg-amber-400',
          icon: Wrench,
          title: 'Operario de Taller'
        }
      case 'CLIENTE':
        return {
          label: 'CLIENTE',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotColor: 'bg-emerald-400',
          icon: User,
          title: 'Portal de Cliente'
        }
      default:
        return {
          label: rol,
          badgeBg: 'bg-slate-700 text-slate-300 border-slate-600',
          dotColor: 'bg-slate-400',
          icon: Layers,
          title: 'Sesión Activa'
        }
    }
  }

  const currentConfig = getRoleConfig(rolActual)
  const CurrentIcon = currentConfig.icon

  // Calculate popover positioning relative to screen coordinates
  const isTopHalf = (position?.y ?? window.innerHeight) < 380
  const isLeftHalf = (position?.x ?? window.innerWidth) < window.innerWidth / 2

  return (
    <div
      id="dev-role-switcher-floating"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        touchAction: 'none'
      }}
      className={`fixed z-[9999] font-sans select-none transition-shadow ${
        position ? '' : 'bottom-5 right-5'
      }`}
    >
      {/* Expanded Popover Card */}
      {isOpen && (
        <div
          id="dev-role-switcher-popover"
          className={`absolute w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md p-4 space-y-4 animate-in fade-in text-xs text-slate-200 cursor-default ${
            isTopHalf ? 'top-full mt-3' : 'bottom-full mb-3'
          } ${isLeftHalf ? 'left-0' : 'right-0'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-white text-xs">Entorno de Desarrollo</h3>
                <p className="text-[10px] text-slate-400">Selector rápido de modos y roles</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetPosition}
                className="p-1 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors"
                title="Restablecer posición inicial en la esquina inferior"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Minimizar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Mode Switch Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Cambiar Modo Activo:
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* 1. MODO CLIENTE */}
              <button
                id="btn-switch-mode-cliente"
                onClick={() => handleSwitchRole('CLIENTE', '/cliente')}
                disabled={switching}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  rolActual === 'CLIENTE'
                    ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/40 text-white'
                    : 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-400">
                    <User className="w-3.5 h-3.5" />
                    <span>CLIENTE</span>
                  </div>
                  {rolActual === 'CLIENTE' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Portal y peticiones de presupuesto
                </span>
              </button>

              {/* 2. MODO USUARIO (TALLER) */}
              <button
                id="btn-switch-mode-usuario"
                onClick={() => handleSwitchRole('USUARIO', '/solicitudes')}
                disabled={switching}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  rolActual === 'USUARIO'
                    ? 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-500/40 text-white'
                    : 'bg-slate-950/70 border-slate-800 hover:border-sky-500/50 hover:bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-sky-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>USUARIO (TALLER)</span>
                  </div>
                  {rolActual === 'USUARIO' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Gestión y presupuestos con IA
                </span>
              </button>

              {/* 3. MODO AUTORIZADO (EMPLEADO) */}
              <button
                id="btn-switch-mode-autorizado"
                onClick={() => handleSwitchRole('AUTORIZADO', '/expedientes')}
                disabled={switching}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  rolActual === 'AUTORIZADO'
                    ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 text-white'
                    : 'bg-slate-950/70 border-slate-800 hover:border-amber-500/50 hover:bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-400">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>AUTORIZADO</span>
                  </div>
                  {rolActual === 'AUTORIZADO' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Operario mecánico / Box
                </span>
              </button>

              {/* 4. MODO DESARROLLADOR */}
              <button
                id="btn-switch-mode-desarrollador"
                onClick={() => handleSwitchRole('DESARROLLADOR', '/dev')}
                disabled={switching}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  rolActual === 'DESARROLLADOR'
                    ? 'bg-purple-500/15 border-purple-500 ring-1 ring-purple-500/40 text-white'
                    : 'bg-slate-950/70 border-slate-800 hover:border-purple-500/50 hover:bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-purple-400">
                    <Code className="w-3.5 h-3.5" />
                    <span>DESARROLLADOR</span>
                  </div>
                  {rolActual === 'DESARROLLADOR' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Control global y licencias
                </span>
              </button>
            </div>
          </div>

          {/* Quick Flow Jump Links */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Atajos de Comprobación de Flujo:
            </span>

            <div className="space-y-1">
              {/* 1. Portal Cliente */}
              <button
                type="button"
                onClick={() => handleQuickJump('/cliente', 'CLIENTE')}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-left flex items-center justify-between text-[11px] text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <strong>1. Portal Cliente</strong> (Solicitar presupuesto)
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>

              {/* 2. Solicitudes Taller */}
              <button
                type="button"
                onClick={() => handleQuickJump('/solicitudes', 'USUARIO')}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-left flex items-center justify-between text-[11px] text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  <strong>2. Solicitudes Taller</strong> (Generar con IA y Cita)
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>

              {/* 3. Expedientes & Roadmap */}
              <button
                type="button"
                onClick={() => handleQuickJump('/expedientes', 'USUARIO')}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-left flex items-center justify-between text-[11px] text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <strong>3. Expedientes</strong> (Tarjeta y Roadmap generado)
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          </div>

          {/* User Session Details & Drag hint */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate max-w-[200px]">
              Usuario: <strong className="text-white">{perfil?.nombre || 'Sesión anónima'}</strong>
            </span>
            <span className="text-[9px] text-slate-500 italic">
              Arrastra el botón para moverlo
            </span>
          </div>
        </div>
      )}

      {/* Main Trigger Button (Draggable) */}
      <div
        id="btn-toggle-dev-switcher"
        onClick={(e) => {
          if (hasDraggedRef.current || isDragging) return
          setIsOpen(prev => !prev)
        }}
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-full shadow-2xl transition-all duration-150 border cursor-grab active:cursor-grabbing ${
          isDragging 
            ? 'ring-2 ring-sky-400 bg-slate-900 shadow-sky-500/30 scale-105 opacity-95' 
            : isOpen
              ? 'bg-slate-900 border-sky-500 text-white ring-2 ring-sky-500/30'
              : 'bg-slate-900/95 hover:bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-200 backdrop-blur-md hover:shadow-sky-900/20'
        }`}
        title="Arrastra para ubicar el botón en cualquier punto de la pantalla | Clic para abrir el selector de modos"
      >
        {/* Drag handle icon */}
        <div className="text-slate-500 group-hover:text-slate-300 transition-colors -mr-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Pulse Dot */}
        <div className="relative flex items-center justify-center">
          <span className={`w-2.5 h-2.5 rounded-full ${currentConfig.dotColor}`}></span>
          <span className={`absolute w-3.5 h-3.5 rounded-full ${currentConfig.dotColor} animate-ping opacity-75`}></span>
        </div>

        {/* Current Role Pill */}
        <div className="flex items-center gap-1.5 text-xs font-bold pointer-events-none">
          <CurrentIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Modo:</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase border ${currentConfig.badgeBg}`}>
            {currentConfig.label}
          </span>
        </div>

        {/* Toggle Icon */}
        <div className="text-slate-400 group-hover:text-white pointer-events-none ml-0.5">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>
    </div>
  )
}

