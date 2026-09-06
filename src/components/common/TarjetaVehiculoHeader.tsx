import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Route, FolderGit2, User, ChevronRight, Hash } from 'lucide-react'

interface TarjetaVehiculoHeaderProps {
  matricula: string
  marca?: string | null
  modelo?: string | null
  titular?: string | null
  numeroExpediente: string
  expedienteId?: string | null
  badgeEstado?: React.ReactNode
  showRoadmapBtn?: boolean
  className?: string
  compact?: boolean
}

/**
 * Formatea una matrícula española estándar si viene sin espacios (ej. 4589KBL -> 4589 KBL)
 */
function formatMatriculaEspanola(raw: string): string {
  if (!raw) return '0000 BBB'
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  // Si tiene formato 4 dígitos y 3 letras
  const match = clean.match(/^(\d{4})([A-Z]{3})$/)
  if (match) {
    return `${match[1]} ${match[2]}`
  }
  // Si tiene guion tradicional (ej: 4589-KBL)
  return raw.toUpperCase().replace('-', ' ')
}

export const TarjetaVehiculoHeader: React.FC<TarjetaVehiculoHeaderProps> = ({
  matricula,
  marca,
  modelo,
  titular,
  numeroExpediente,
  expedienteId,
  badgeEstado,
  showRoadmapBtn = true,
  className = '',
  compact = false
}) => {
  const navigate = useNavigate()
  const displayMatricula = formatMatriculaEspanola(matricula)
  const displayMarcaModelo = [marca, modelo].filter(Boolean).join(' ') || 'Vehículo Taller'
  const displayTitular = titular || 'Titular no asignado'

  const handleIrAlRoadmap = (e: React.MouseEvent) => {
    e.stopPropagation()
    const targetQuery = expedienteId 
      ? `?id=${encodeURIComponent(expedienteId)}` 
      : `?num=${encodeURIComponent(numeroExpediente)}`
    navigate(`/expedientes${targetQuery}`)
  }

  return (
    <div className={`w-full bg-slate-950/70 border-b border-slate-800/90 p-4 rounded-t-2xl flex flex-col items-center text-center select-none ${className}`}>
      {/* ── 1. NÚMERO DE EXPEDIENTE & ESTADO ── */}
      <div className="w-full flex items-center justify-between gap-2 mb-3 px-1">
        <div 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-500/40 text-sky-300 font-mono text-[11px] font-bold shadow-xs cursor-pointer hover:bg-sky-900/60 transition-colors"
          onClick={handleIrAlRoadmap}
          title="Ver este expediente en el Roadmap"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Expediente:</span>
          <span className="text-white font-extrabold">{numeroExpediente}</span>
        </div>

        {badgeEstado && (
          <div className="shrink-0">
            {badgeEstado}
          </div>
        )}
      </div>

      {/* ── 2. MATRÍCULA ESPAÑOLA (DIBUJO AUTÉNTICO CENTRADO) ── */}
      <div className="my-1 flex justify-center">
        <div 
          className="inline-flex items-stretch bg-white border-[2.5px] border-slate-950 rounded-lg shadow-md shadow-black/40 overflow-hidden ring-1 ring-slate-400/30"
          title={`Matrícula Española: ${displayMatricula}`}
        >
          {/* Banda Azul Europea (Eurobanda 'E') */}
          <div className="bg-[#003399] px-2 py-1 flex flex-col items-center justify-between text-white select-none border-r border-slate-950/20">
            {/* Círculo de 12 estrellas de la Unión Europea */}
            <svg className="w-3.5 h-3.5 text-yellow-300 fill-current my-0.5" viewBox="0 0 100 100">
              <circle cx="50" cy="15" r="5" />
              <circle cx="67" cy="20" r="5" />
              <circle cx="80" cy="33" r="5" />
              <circle cx="85" cy="50" r="5" />
              <circle cx="80" cy="67" r="5" />
              <circle cx="67" cy="80" r="5" />
              <circle cx="50" cy="85" r="5" />
              <circle cx="33" cy="80" r="5" />
              <circle cx="20" cy="67" r="5" />
              <circle cx="15" cy="50" r="5" />
              <circle cx="20" cy="33" r="5" />
              <circle cx="33" cy="20" r="5" />
            </svg>
            {/* Letra 'E' distintivo de España */}
            <span className="font-sans font-black text-[11px] leading-tight text-white tracking-tighter">
              E
            </span>
          </div>

          {/* Placa Blanca Reflectante con Caracteres Españoles */}
          <div className="px-4 py-1 flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100">
            <span className="font-mono font-black text-slate-950 tracking-[0.22em] text-base sm:text-lg leading-none uppercase drop-shadow-[0_1px_0_rgba(0,0,0,0.15)]">
              {displayMatricula}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. JUSTO DEBAJO: MARCA Y MODELO (CENTRADO) ── */}
      <h3 className="mt-2 text-sm sm:text-base font-bold text-slate-100 tracking-wide">
        {displayMarcaModelo}
      </h3>

      {/* ── 4. DEBAJO: TITULAR DEL VEHÍCULO (CENTRADO) ── */}
      <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-300 font-medium">
        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Titular:</span>
        <span className="text-white font-semibold">{displayTitular}</span>
      </div>

      {/* ── 5. BOTÓN DE ACCESO DIRECTO AL ROADMAP ── */}
      {showRoadmapBtn && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 w-full flex justify-center">
          <button
            type="button"
            onClick={handleIrAlRoadmap}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-600/20 border border-slate-700/80 hover:border-sky-500/50 text-sky-400 hover:text-sky-300 text-xs font-semibold shadow-xs transition-all cursor-pointer group"
            title="Ir al Roadmap interactivo de este vehículo y acceder a cualquier cometido"
          >
            <Route className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform" />
            <span>Acceso directo al Roadmap</span>
            <ChevronRight className="w-3 h-3 text-sky-400/70 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  )
}
