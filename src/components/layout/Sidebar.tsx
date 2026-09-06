import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Inbox,
  FileSpreadsheet, 
  Calendar, 
  Wrench, 
  Camera, 
  Receipt, 
  TrendingUp, 
  Settings, 
  Sparkles, 
  ShieldCheck, 
  UserCheck,
  Terminal,
  Tag,
  X 
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { perfil, rolActual, esDev } = useAuth()

  // Base list of items
  const allNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard' },
    { to: '/clientes', label: 'Clientes', icon: Users, perm: 'clientes' },
    { to: '/vehiculos', label: 'Vehículos', icon: Car, perm: 'vehiculos' },
    { to: '/solicitudes', label: 'Solicitudes de presupuesto', icon: Inbox, perm: 'solicitudes' },
    { to: '/presupuestos', label: 'Presupuestos', icon: FileSpreadsheet, perm: 'presupuestos' },
    { to: '/tarifas', label: 'Listado de Precios', icon: Tag, perm: 'tarifas' },
    { to: '/expedientes', label: 'Expedientes', icon: Camera, perm: 'expedientes' },
    { to: '/citas', label: 'Citas y Calendario', icon: Calendar, perm: 'citas' },
    { to: '/reparaciones', label: 'Órdenes de Trabajo', icon: Wrench, perm: 'reparaciones' },
    { to: '/facturas', label: 'Facturas y Veri*Factu', icon: Receipt, perm: 'facturas' },
    { to: '/balances', label: 'Balances y Fiscal', icon: TrendingUp, perm: 'balances' },
    { to: '/empleados', label: 'Gestión Empleados', icon: UserCheck, perm: 'empleados' },
    { to: '/metis', label: 'METIS IA', icon: Sparkles, perm: 'metis' },
    { to: '/configuracion', label: 'Configuración', icon: Settings, perm: 'configuracion' },
  ]

  // Filter based on role & permissions
  const visibleNavItems = allNavItems.filter((item) => {
    // Master Developer sees all
    if (esDev || rolActual === 'DESARROLLADOR') return true

    // Usuario (Dueño) sees all workshop items including employees
    if (rolActual === 'USUARIO') return true

    // Autorizado (Empleado) has granular restrictions
    if (rolActual === 'AUTORIZADO') {
      const empPerms = perfil?.permisosEmpleado
      if (item.perm === 'empleados') return false // Only Usuario manages employees
      if (item.perm === 'balances') return !!empPerms?.balancesVer
      if (item.perm === 'facturas') return !!empPerms?.facturasVer
      if (item.perm === 'configuracion') return !!empPerms?.configuracionVer
      if (item.perm === 'clientes') return !!empPerms?.clientes
      if (item.perm === 'vehiculos') return !!empPerms?.vehiculos
      if (item.perm === 'solicitudes') return !!empPerms?.presupuestosCrear || !!empPerms?.clientes || true
      if (item.perm === 'citas') return !!empPerms?.citas
      if (item.perm === 'expedientes') return !!empPerms?.expedientes
      if (item.perm === 'reparaciones') return !!empPerms?.reparaciones
      if (item.perm === 'presupuestos') return !!empPerms?.presupuestosCrear
      return true
    }

    return true
  })

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs animate-in fade-in"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/95 lg:bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header in sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-white text-sm">Menú Principal</span>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Quick link to Developer Portal if user is Master Dev */}
          {esDev && (
            <NavLink
              to="/dev"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 text-xs font-bold transition-colors"
            >
              <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Portal Desarrollador</span>
            </NavLink>
          )}

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="block font-medium text-white truncate text-[11px]">
                {perfil?.tallerNombre || 'GESTARIAN DM CAR'}
              </span>
              <span className="block text-[10px] text-emerald-400 truncate">
                Rol: {rolActual}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
