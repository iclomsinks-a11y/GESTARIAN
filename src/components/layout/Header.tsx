import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Sparkles, 
  Headphones,
  Menu, 
  Wrench, 
  Building2, 
  Search,
  Bell,
  Terminal,
  LogOut,
  Users,
  Car,
  Key,
  Layers,
  ArrowLeft
} from 'lucide-react'
import { useVoice } from '../../hooks/useVoice'
import { useAuth } from '../../hooks/useAuth'
import { sectorService } from '../../services/sectorService'
import { getSolicitudesPendientes, subscribeNotificaciones } from '../../services/tallerNotificacionesService'
import { getConfiguracion } from '../../services/configuracionService'

interface HeaderProps {
  onToggleSidebar: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { startListening, setIsOpen, startBidirectionalMode, desbloquearAltavoz, isBidirectional } = useVoice()
  const { perfil, rolActual, esDev, logout } = useAuth()
  const navigate = useNavigate()
  const currentSector = sectorService.getCurrentSector()
  const sectorConfig = sectorService.getConfig(currentSector)

  const [pendientesCount, setPendientesCount] = useState<number>(0)
  const [customAppLogo, setCustomAppLogo] = useState<string | null>(null)

  useEffect(() => {
    const updateCount = () => {
      setPendientesCount(getSolicitudesPendientes().length)
    }
    updateCount()
    const unsub = subscribeNotificaciones(updateCount)

    // Load custom logo B/N for application top left
    const loadLogo = async () => {
      try {
        const cfg = await getConfiguracion()
        if (cfg.logo_app_bn) {
          setCustomAppLogo(cfg.logo_app_bn)
        } else {
          setCustomAppLogo(null)
        }
      } catch (e) {}
    }
    loadLogo()

    const onConfigUpdate = () => loadLogo()
    window.addEventListener('gestarian-config-updated', onConfigUpdate)
    window.addEventListener('storage', onConfigUpdate)

    return () => {
      unsub()
      window.removeEventListener('gestarian-config-updated', onConfigUpdate)
      window.removeEventListener('storage', onConfigUpdate)
    }
  }, [])

  const getRoleBadge = () => {
    switch (rolActual) {
      case 'DESARROLLADOR':
        return {
          label: 'Desarrollador (Tú)',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: Terminal
        }
      case 'USUARIO':
        return {
          label: 'Usuario (Taller)',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: Building2
        }
      case 'AUTORIZADO':
        return {
          label: 'Autorizado (Empleado)',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: Users
        }
      case 'CLIENTE':
        return {
          label: 'Cliente Final',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: Car
        }
      default:
        return {
          label: rolActual,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Key
        }
    }
  }

  const roleInfo = getRoleBadge()
  const RoleIcon = roleInfo.icon

  return (
    <>
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5" title="Ir a la página de inicio">
            {customAppLogo ? (
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center overflow-hidden shadow-md p-1">
                <img
                  src={customAppLogo}
                  alt="Logo Personalizado"
                  className="w-full h-full object-contain filter grayscale"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
                <Wrench className="w-5 h-5" />
              </div>
            )}
            <div>
              <span className="font-black text-base text-white tracking-wide flex items-center gap-1.5">
                GESTARIAN
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  DM CAR
                </span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium truncate max-w-[140px] sm:max-w-xs">
                {perfil?.tallerNombre || sectorConfig.nombre}
              </span>
            </div>
          </Link>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* User Role Badge */}
          <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-800">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${roleInfo.color}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{roleInfo.label}</span>
            </span>
          </div>

          {/* If Master Developer, shortcut to Developer Dashboard */}
          {esDev && (
            <Link
              to="/dev"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all shadow-sm"
              title="Ir al Portal Maestro de Desarrollador"
            >
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Panel Dev</span>
            </Link>
          )}

          {/* Workshop Internal Notification Bell */}
          <button
            onClick={() => navigate('/reparaciones')}
            className={`relative p-2 rounded-xl border transition-all ${
              pendientesCount > 0
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title={
              pendientesCount > 0
                ? `${pendientesCount} solicitud(es) de confirmación de reparación pendientes`
                : 'Notificaciones internas de taller'
            }
          >
            <Bell className="w-4 h-4" />
            {pendientesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center animate-pulse">
                {pendientesCount}
              </span>
            )}
          </button>

          {/* Voice Assistant METIS button */}
          <button
            onClick={() => {
              desbloquearAltavoz()
              setIsOpen(true)
              startListening()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Activar Asistente de Voz METIS"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>METIS IA</span>
          </button>

          {/* Bidirectional Voice Mode button */}
          <button
            onClick={() => {
              desbloquearAltavoz()
              setIsOpen(true)
              startBidirectionalMode()
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isBidirectional
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-400/40 shadow-emerald-500/25'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
            title="Modo Conversación Bidireccional Continua (de tú a tú)"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Voz Continua</span>
          </button>

          {/* Switch Portal or Logout */}
          <button
            onClick={() => {
              logout()
              navigate('/portal')
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Cerrar sesión o cambiar de portal"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Botón Volver arriba a la derecha en todas las páginas */}
          <button
            id="btn-global-volver"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/')
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Volver a la página inmediatamente anterior"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Volver</span>
          </button>
        </div>
      </header>
    </>
  )
}
