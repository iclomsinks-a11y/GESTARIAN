import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ShieldAlert, ArrowLeftRight, X, ExternalLink } from 'lucide-react'
import type { RoleType } from '../../services/authService/types'

export const DevSimulationBanner: React.FC = () => {
  const { isSimulating, simulatedRole, stopSimulation, startSimulation } = useAuth()
  const navigate = useNavigate()

  if (!isSimulating || !simulatedRole) return null

  const getRoleLabel = (r: RoleType) => {
    switch (r) {
      case 'USUARIO':
        return 'Usuario (Dueño / Gerente de Taller)'
      case 'AUTORIZADO':
        return 'Autorizado (Empleado Operativo del Taller)'
      case 'CLIENTE':
        return 'Cliente Final (Portal de Clientes)'
      default:
        return r
    }
  }

  const getRoleColor = (r: RoleType) => {
    switch (r) {
      case 'USUARIO':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      case 'AUTORIZADO':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      case 'CLIENTE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    }
  }

  const handleReturnToDev = () => {
    stopSimulation()
    navigate('/dev')
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-purple-500/40 px-3 py-2 text-xs shadow-lg flex flex-wrap items-center justify-between gap-2 text-slate-200">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
        </span>
        <span className="font-semibold text-purple-200">MODO SIMULACIÓN DE DESARROLLADOR:</span>
        <span className={`px-2 py-0.5 rounded-full font-bold border ${getRoleColor(simulatedRole)}`}>
          {getRoleLabel(simulatedRole)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick switcher to other roles */}
        <div className="hidden md:flex items-center gap-1 text-[11px]">
          <span className="text-slate-400">Cambiar a:</span>
          {simulatedRole !== 'USUARIO' && (
            <button
              onClick={() => {
                startSimulation('USUARIO')
                navigate('/')
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Usuario
            </button>
          )}
          {simulatedRole !== 'AUTORIZADO' && (
            <button
              onClick={() => {
                startSimulation('AUTORIZADO')
                navigate('/')
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Autorizado
            </button>
          )}
          {simulatedRole !== 'CLIENTE' && (
            <button
              onClick={() => {
                startSimulation('CLIENTE')
                navigate('/cliente')
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Cliente
            </button>
          )}
        </div>

        <button
          onClick={handleReturnToDev}
          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          title="Salir de la simulación y regresar al Portal Maestro de Desarrollador"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Volver al Portal Desarrollador</span>
        </button>
      </div>
    </div>
  )
}
