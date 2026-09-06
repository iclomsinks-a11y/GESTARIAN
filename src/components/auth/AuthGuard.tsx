import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ShieldX, AlertTriangle, ArrowLeft, Lock } from 'lucide-react'
import type { RoleType } from '../../services/authService/types'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: RoleType[]
  requiredPermission?: string
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  allowedRoles, 
  requiredPermission 
}) => {
  const { perfil, rolActual, esDev, isSimulating } = useAuth()
  const location = useLocation()

  // If no user is logged in
  if (!perfil) {
    // In dev mode or when accessing developer areas, default to developer auth
    if (location.pathname.startsWith('/dev')) {
      return <Navigate to="/dev-auth" state={{ from: location }} replace />
    }
    // For client portal
    if (location.pathname.startsWith('/cliente')) {
      return <Navigate to="/portal?tab=cliente" state={{ from: location }} replace />
    }
    // General fallback to public access portal
    return <Navigate to="/portal" state={{ from: location }} replace />
  }

  // Master Developer has universal bypass unless simulating
  if (esDev && !isSimulating) {
    return <>{children}</>
  }

  // Check role restrictions
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(rolActual)

    if (!hasRole) {
      // If user is CLIENTE trying to access ERP, redirect to their client area
      if (rolActual === 'CLIENTE') {
        return <Navigate to="/cliente" replace />
      }

      // If user is AUTORIZADO trying to access manager-only sections
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Acceso Restringido</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Este módulo requiere permisos del rol <span className="text-sky-400 font-semibold">{allowedRoles.join(' o ')}</span>.
                Tu rol actual es <span className="text-amber-400 font-semibold">{rolActual}</span>.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Panel Principal
              </Link>
            </div>
          </div>
        </div>
      )
    }
  }

  // Check specific permission if specified (for Autorizados)
  if (requiredPermission && rolActual === 'AUTORIZADO') {
    const hasPerm = perfil.permisos?.includes(requiredPermission) || perfil.permisos?.includes('*')
    if (!hasPerm) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center space-y-3 shadow-xl">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Permiso No Concedido</h3>
            <p className="text-xs text-slate-400">
              Tu Jefe de Taller (Usuario) no ha habilitado el permiso <code className="text-amber-400">{requiredPermission}</code> para tu cuenta de empleado.
            </p>
            <Link
              to="/"
              className="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Regresar al Inicio
            </Link>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
