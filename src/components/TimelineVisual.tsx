import React, { useState, useEffect, useRef } from 'react'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown,
  ArrowDown,
  FileSpreadsheet, 
  Calendar, 
  Wrench, 
  Receipt, 
  CreditCard,
  UserCheck,
  Columns,
  Rows
} from 'lucide-react'
import type { TimelineStep } from '../lib/roadmapEngine'

interface TimelineVisualProps {
  steps: TimelineStep[]
  className?: string
  showLabels?: boolean
  compact?: boolean
  layout?: 'auto' | 'cascade' | 'horizontal'
}

export const TimelineVisual: React.FC<TimelineVisualProps> = ({ 
  steps, 
  className = '', 
  layout = 'auto' 
}) => {
  const [activeLayout, setActiveLayout] = useState<'cascade' | 'horizontal'>('cascade')
  const [isMobileOrTabletPortrait, setIsMobileOrTabletPortrait] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  // Detect mobile & tablet portrait dynamically
  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches
      const isSmallScreen = window.innerWidth < 1024
      const isMobileTabletPortrait = isSmallScreen || isPortrait
      setIsMobileOrTabletPortrait(isMobileTabletPortrait)

      if (layout === 'auto') {
        setActiveLayout(isMobileTabletPortrait ? 'cascade' : 'horizontal')
      } else {
        setActiveLayout(layout)
      }
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [layout])

  // Track scroll position in cascade mode to inform user to scroll down
  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 20)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el && activeLayout === 'cascade') {
      checkScroll()
      el.addEventListener('scroll', checkScroll)
      return () => el.removeEventListener('scroll', checkScroll)
    }
  }, [steps, activeLayout])

  const scrollToNextStop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: 140, behavior: 'smooth' })
    }
  }

  const getColorClasses = (color: string, isAnimated?: boolean) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
          badge: 'bg-emerald-500 text-slate-950',
          line: 'bg-emerald-500/60',
          ring: isAnimated ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 animate-pulse' : '',
          glow: 'shadow-emerald-500/20'
        }
      case 'amber':
      case 'yellow':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          badge: 'bg-amber-500 text-slate-950',
          line: 'bg-amber-500/60',
          ring: isAnimated ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 animate-pulse' : '',
          glow: 'shadow-amber-500/20'
        }
      case 'blue':
        return {
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
          badge: 'bg-sky-500 text-slate-950',
          line: 'bg-sky-500/60',
          ring: isAnimated ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 animate-pulse' : '',
          glow: 'shadow-sky-500/20'
        }
      case 'red':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          badge: 'bg-rose-500 text-white',
          line: 'bg-rose-500/60',
          ring: isAnimated ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-950 animate-pulse' : '',
          glow: 'shadow-rose-500/20'
        }
      case 'slate':
      default:
        return {
          bg: 'bg-slate-800/60 text-slate-500 border-slate-700/60',
          badge: 'bg-slate-700 text-slate-400',
          line: 'bg-slate-800',
          ring: '',
          glow: ''
        }
    }
  }

  const getStepIcon = (id: string, color: string) => {
    switch (id) {
      case 'recepcion':
        return UserCheck
      case 'presupuesto':
        return FileSpreadsheet
      case 'cita':
        return Calendar
      case 'reparacion':
        return Wrench
      case 'factura':
        return Receipt
      case 'cobro':
        return CreditCard
      default:
        return color === 'emerald' ? CheckCircle2 : color === 'red' ? AlertCircle : Clock
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* View layout selector for user convenience */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <span className="text-[10px] text-slate-400 font-medium">
          {activeLayout === 'cascade' 
            ? 'Vista Cascada (Desliza hacia abajo para consultar el flujo)' 
            : 'Vista Horizontal (Flujo continuo del expediente)'}
        </span>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setActiveLayout('cascade')}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all ${
              activeLayout === 'cascade' 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ver flujo en cascada vertical con scroll"
          >
            <Rows className="w-3 h-3" />
            <span>Cascada</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayout('horizontal')}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all ${
              activeLayout === 'horizontal' 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ver flujo en línea horizontal"
          >
            <Columns className="w-3 h-3" />
            <span>Horizontal</span>
          </button>
        </div>
      </div>

      {/* ── 1. CASCADING VIEW (Mobile & Tablet Portrait, or when selected) ── */}
      {activeLayout === 'cascade' ? (
        <div className="relative">
          <div 
            ref={scrollRef}
            className="max-h-[380px] sm:max-h-[440px] overflow-y-auto scroll-smooth pr-1 space-y-1 focus:outline-hidden"
          >
            {steps.map((step, idx) => {
              const classes = getColorClasses(step.color, step.animatedBorder)
              const Icon = getStepIcon(step.id, step.color)
              const isClickable = !!step.action?.onClick
              const isLast = idx === steps.length - 1

              return (
                <div key={step.id || idx} className="relative flex items-start gap-3 group">
                  {/* Left Column: Parada Icon & Vertical Connecting Line */}
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <button
                      type="button"
                      disabled={!isClickable}
                      onClick={step.action?.onClick}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all shadow-md ${classes.bg} ${classes.ring} ${classes.glow} ${
                        isClickable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                      }`}
                      title={step.action ? `Acción: ${step.title}` : step.title}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Vertical connecting line to next parada in cascade */}
                    {!isLast && (
                      <div className="flex flex-col items-center my-1">
                        <div className={`w-0.5 h-5 sm:h-6 rounded-full transition-colors ${classes.line}`} />
                        <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-slate-950 border border-slate-800 my-0.5 shadow-xs">
                          <ChevronDown className={`w-2.5 h-2.5 ${
                            step.color === 'emerald' ? 'text-emerald-400' : 'text-slate-500'
                          }`} />
                        </div>
                        <div className={`w-0.5 h-5 sm:h-6 rounded-full transition-colors ${classes.line}`} />
                      </div>
                    )}
                  </div>

                  {/* Right Column: Parada Card */}
                  <div 
                    onClick={isClickable ? step.action?.onClick : undefined}
                    className={`flex-1 rounded-xl p-3 border transition-all mb-1 ${
                      step.animatedBorder 
                        ? 'bg-slate-900/95 border-amber-500/40 ring-1 ring-amber-500/25 shadow-md shadow-amber-500/5' 
                        : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700/90'
                    } ${isClickable ? 'cursor-pointer hover:bg-slate-850' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-sky-300">
                            {step.functionName || step.title}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${classes.bg}`}>
                            {step.color === 'emerald' 
                              ? 'Completada' 
                              : step.color === 'amber' || step.color === 'yellow' 
                              ? 'Pendiente' 
                              : step.color === 'blue' 
                              ? 'En proceso' 
                              : step.color === 'red' 
                              ? 'Atención requerida' 
                              : 'Por iniciar'}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                          {step.title}
                        </h4>

                        {step.subtitle && (
                          <p className="text-[11px] text-slate-400 font-medium">
                            {step.subtitle}
                          </p>
                        )}
                      </div>

                      {step.action?.label && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            step.action?.onClick()
                          }}
                          className="self-start sm:self-center px-3 py-2 min-h-[40px] rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
                        >
                          <span>{step.action.label}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Prompt / button to scroll to next functions in cascade */}
          {canScrollDown && (
            <button
              type="button"
              onClick={scrollToNextStop}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-sky-400 hover:text-sky-300 text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-all animate-pulse cursor-pointer"
            >
              <span>Desliza para consultar las siguientes funciones</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* ── 2. HORIZONTAL VIEW (Desktop landscape or when selected) ── */
        <div className="w-full overflow-x-auto py-2 px-1">
          <div className="flex items-center min-w-[620px] justify-between relative">
            {steps.map((step, idx) => {
              const classes = getColorClasses(step.color, step.animatedBorder)
              const Icon = getStepIcon(step.id, step.color)
              const isClickable = !!step.action?.onClick

              return (
                <React.Fragment key={step.id || idx}>
                  {/* Node Card */}
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={step.action?.onClick}
                    className={`flex flex-col items-center group relative text-left transition-all ${
                      isClickable 
                        ? 'cursor-pointer hover:scale-105 active:scale-95 focus:outline-hidden' 
                        : 'cursor-default opacity-90'
                    }`}
                    title={step.action ? `Acción: ${step.title}` : step.title}
                  >
                    {/* Visual Icon / Bubble */}
                    <div 
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all shadow-md ${classes.bg} ${classes.ring} ${classes.glow}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Step Content */}
                    <div className="mt-2 text-center max-w-[115px]">
                      <span className="block text-[9px] font-mono text-sky-400 font-bold uppercase truncate">
                        {step.functionName || 'Fase'}
                      </span>
                      <span className={`block font-bold text-[11px] leading-tight truncate ${
                        step.color === 'slate' ? 'text-slate-500' : 'text-slate-200 group-hover:text-white'
                      }`}>
                        {step.title}
                      </span>
                      {step.subtitle && (
                        <span className="block text-[10px] text-amber-400 font-medium truncate mt-0.5">
                          {step.subtitle}
                        </span>
                      )}
                      {step.action?.label && (
                        <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                          {step.action.label}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Connecting line between steps */}
                  {idx < steps.length - 1 && (
                    <div className="flex-1 mx-2 flex items-center justify-center">
                      <div className={`h-1 w-full rounded-full transition-colors ${classes.line}`} />
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 -ml-1 ${
                        step.color === 'emerald' ? 'text-emerald-500' : 'text-slate-600'
                      }`} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
