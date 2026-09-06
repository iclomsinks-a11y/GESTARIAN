import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../lib/ToastContext'
import { 
  Terminal, 
  Users, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Layers, 
  Building2, 
  ArrowRight, 
  Calendar, 
  Coins, 
  UserCheck, 
  Eye, 
  Play, 
  Sliders, 
  FileText, 
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  LogOut
} from 'lucide-react'
import type { 
  SolicitudTallerUsuario, 
  TipoLicencia, 
  RoleType, 
  EstadoUsuario 
} from '../services/authService/types'
import { EgressAuditModal } from '../components/common/EgressAuditModal'

export const DeveloperDashboardPage: React.FC = () => {
  const { 
    perfil, 
    logout, 
    startSimulation, 
    authorizeWorkshopRequest, 
    rejectWorkshopRequest, 
    updateWorkshopLicense,
    getStoredSolicitudes 
  } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [showAuditModal, setShowAuditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'simulador' | 'altas' | 'licencias' | 'telemetria'>('simulador')
  const [solicitudes, setSolicitudes] = useState<SolicitudTallerUsuario[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [selectedPlanToAssign, setSelectedPlanToAssign] = useState<Record<string, TipoLicencia>>({})

  const reloadData = () => {
    const list = getStoredSolicitudes()
    setSolicitudes([...list])
  }

  useEffect(() => {
    reloadData()
  }, [])

  const handleSimulateRole = (role: RoleType, targetPath: string = '/') => {
    const ok = startSimulation(role)
    if (ok) {
      addToast(`Simulación activada: visualizando plataforma como ${role}`, 'info')
      navigate(targetPath)
    }
  }

  const handleApprove = (solId: string) => {
    const plan = selectedPlanToAssign[solId] || 'PAGO_PRO'
    const ok = authorizeWorkshopRequest(solId, plan)
    if (ok) {
      addToast(`Taller autorizado con éxito con licencia ${plan}`, 'success')
      reloadData()
    }
  }

  const handleReject = (solId: string) => {
    const ok = rejectWorkshopRequest(solId, 'Revisión por desarrollador')
    if (ok) {
      addToast('Solicitud de alta rechazada', 'warning')
      reloadData()
    }
  }

  const handleUpdateLic = (solId: string, tipo: TipoLicencia, estado: 'activo' | 'prueba' | 'vencido') => {
    const ok = updateWorkshopLicense(solId, tipo, estado)
    if (ok) {
      addToast(`Licencia actualizada a ${tipo} (${estado})`, 'success')
      reloadData()
    }
  }

  const filteredSolicitudes = solicitudes.filter(s => {
    const matchesSearch = 
      s.nombreTaller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nombreTitular.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cif.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterEstado === 'todos') return matchesSearch
    return matchesSearch && s.estado === filterEstado
  })

  const pendientesCount = solicitudes.filter(s => s.estado === 'pendiente').length
  const activasCount = solicitudes.filter(s => s.estado === 'activo').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Developer Bar */}
      <header className="bg-slate-900 border-b border-purple-500/30 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold shadow-lg shadow-purple-900/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-wide">PORTAL MAESTRO DE DESARROLLADOR</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                ROOT DEVELOPER
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Operando como: <span className="text-purple-300 font-mono">{perfil?.email || 'iclomsinks@gmail.com'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/portal"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Portal Público</span>
          </Link>

          <Link
            to="/"
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Entrar al Taller ERP</span>
          </Link>

          <button
            onClick={() => {
              logout()
              navigate('/dev-auth')
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Cerrar sesión de desarrollador"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Rol de Ejecución</span>
              <span className="text-sm font-bold text-white">Desarrollador Maestro</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Altas Pendientes</span>
              <span className="text-lg font-black text-white">{pendientesCount} <span className="text-xs text-amber-400 font-normal">por autorizar</span></span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Talleres Autorizados</span>
              <span className="text-lg font-black text-white">{activasCount} <span className="text-xs text-emerald-400 font-normal">activos</span></span>
            </div>
          </div>

          <div 
            onClick={() => setShowAuditModal(true)}
            className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-4 flex items-center gap-3 shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Abrir informe completo de auditoría Egress"
          >
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Egress Shield & Caché</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                96% Ahorro Egress
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto gap-2 pb-px text-xs font-semibold">
          <button
            onClick={() => setActiveTab('simulador')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'simulador'
                ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-900'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Simulador de Portales en Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('altas')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'altas'
                ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Gestión y Autorización de Altas</span>
            {pendientesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {pendientesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('licencias')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'licencias'
                ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Control de Licencias y Versiones</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetria')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'telemetria'
                ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Telemetría y Estado del Sistema</span>
          </button>
        </div>

        {/* TAB 1: SIMULADOR DE ROLES Y PORTALES */}
        {activeTab === 'simulador' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Simulador Maestro de Portales y Roles
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Como desarrollador, puedes inspeccionar, auditar y simular en vivo la experiencia exacta de cada tipo de usuario sin tener que cerrar sesión.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Portal de Usuario (Dueño de Taller) */}
                <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/60 transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Rol: Usuario
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">Portal de Usuario (Dueño de Taller)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      El gerente o propietario del taller mecánico. Gestiona clientes, vehículos, presupuestos con IVA, reparaciones, facturación Veri*Factu, balances y da de alta a sus empleados.
                    </p>
                    <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                      <div>&bull; Permisos: <span className="text-emerald-300 font-semibold">Totales del taller</span></div>
                      <div>&bull; Gestión de Empleados: <span className="text-emerald-300 font-semibold">Habilitada</span></div>
                      <div>&bull; Balances y Facturación: <span className="text-emerald-300 font-semibold">Acceso completo</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSimulateRole('USUARIO', '/')}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Simular Portal Usuario</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* 2. Portal de Autorizado (Empleado de Taller) */}
                <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/60 transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Rol: Autorizado
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">Portal de Autorizado (Empleado)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      El empleado del taller (mecánico, técnico o recepcionista). Opera con permisos limitados y restringidos configurados por el Usuario del taller.
                    </p>
                    <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                      <div>&bull; Reparaciones y Fotos: <span className="text-amber-300 font-semibold">Habilitado</span></div>
                      <div>&bull; Citas y Vehículos: <span className="text-amber-300 font-semibold">Habilitado</span></div>
                      <div>&bull; Balances y Configuración: <span className="text-rose-400 font-semibold">Restringido por seguridad</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSimulateRole('AUTORIZADO', '/')}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Simular Portal Autorizado</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* 3. Portal de Cliente Final */}
                <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/60 transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        Rol: Cliente
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">Portal de Cliente (Área Clientes)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      El cliente particular o empresa que lleva sus coches al taller. Visualiza sus vehículos, presupuestos con botón de aprobación digital y sus facturas.
                    </p>
                    <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                      <div>&bull; Mis Vehículos: <span className="text-cyan-300 font-semibold">Historial completo</span></div>
                      <div>&bull; Presupuestos: <span className="text-cyan-300 font-semibold">Aprobación / Rechazo</span></div>
                      <div>&bull; Citas y Facturas: <span className="text-cyan-300 font-semibold">Descarga PDF</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSimulateRole('CLIENTE', '/cliente')}
                    className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Simular Portal Cliente</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Access to General Portal */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-purple-950/50 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Portal de Acceso General Público
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Revisa la pantalla pública inicial donde los usuarios seleccionan su tipo de ingreso (Desarrollador, Taller, Empleado o Cliente).
                </p>
              </div>

              <Link
                to="/portal"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>Abrir Portal de Acceso General</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* TAB 2: GESTIÓN Y AUTORIZACIÓN DE ALTAS */}
        {activeTab === 'altas' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por taller, titular, CIF o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-400 text-xs">Estado:</span>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes de Autorización</option>
                  <option value="activo">Autorizados / Activos</option>
                  <option value="rechazado">Rechazados</option>
                </select>

                <button
                  onClick={reloadData}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Recargar lista"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Requests list */}
            <div className="space-y-3">
              {filteredSolicitudes.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No se encontraron solicitudes con los filtros aplicados.
                </div>
              ) : (
                filteredSolicitudes.map((sol) => {
                  const isPending = sol.estado === 'pendiente'
                  const isActive = sol.estado === 'activo'
                  const isRejected = sol.estado === 'rechazado'

                  return (
                    <div
                      key={sol.id}
                      className={`bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all ${
                        isPending 
                          ? 'border-amber-500/40 bg-amber-950/10' 
                          : isActive 
                          ? 'border-slate-800' 
                          : 'border-rose-500/20 bg-rose-950/10 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Info details */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{sol.nombreTaller}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isPending ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' :
                              isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {sol.estado}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                              CIF: {sol.cif}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                              Plan: {sol.planSolicitado}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>Titular: <strong className="text-slate-200">{sol.nombreTitular}</strong></span>
                            <span>Email: <strong className="text-slate-200 font-mono">{sol.email}</strong></span>
                            <span>Teléfono: <strong className="text-slate-200">{sol.telefono}</strong></span>
                            <span>Dirección: <strong className="text-slate-200">{sol.direccion}</strong></span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                            <span>Solicitado: {new Date(sol.fechaSolicitud).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {sol.licencia?.fechaFin && (
                              <span className="text-emerald-400">
                                &bull; Vigencia hasta: {new Date(sol.licencia.fechaFin).toLocaleDateString('es-ES')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action controls */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {isPending && (
                            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                              <select
                                value={selectedPlanToAssign[sol.id] || sol.planSolicitado || 'PAGO_PRO'}
                                onChange={(e) => setSelectedPlanToAssign(prev => ({ ...prev, [sol.id]: e.target.value as TipoLicencia }))}
                                className="bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none"
                              >
                                <option value="GRATUITA_PRUEBA">Gratuita de Prueba (30 días)</option>
                                <option value="PAGO_PRO">Pago PRO (€49/mes)</option>
                                <option value="PROMOCION_VIP">Promoción VIP (1 año gratis)</option>
                              </select>

                              <button
                                onClick={() => handleApprove(sol.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Autorizar Alta</span>
                              </button>

                              <button
                                onClick={() => handleReject(sol.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {isActive && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSimulateRole('USUARIO', '/')}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                                title="Inspeccionar este taller como Usuario"
                              >
                                <Eye className="w-3.5 h-3.5 text-purple-400" />
                                <span>Inspeccionar</span>
                              </button>

                              <button
                                onClick={() => handleReject(sol.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs transition-colors"
                                title="Suspender o revocar acceso"
                              >
                                Revocar
                              </button>
                            </div>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApprove(sol.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                            >
                              Re-habilitar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CONTROL DE VERSIONES Y LICENCIAS */}
        {activeTab === 'licencias' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                Matriz Maestra de Licencias y Versiones
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Define y supervisa el tipo de suscripción de cada taller: versión gratuita de prueba, licencia comercial de pago o promociones especiales.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* 1. Gratuita */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Gratuita de Prueba</span>
                    <span className="text-xs font-black text-amber-400">0 € / 30 días</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Versión introductoria para talleres recién registrados que quieren probar el software.
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>&bull; Hasta 15 órdenes de trabajo activas</li>
                    <li>&bull; Expedientes fotográficos con WebP</li>
                    <li>&bull; Sin módulo de balances fiscales</li>
                  </ul>
                </div>

                {/* 2. De Pago PRO */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3 shadow-md shadow-purple-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Comercial de Pago (PRO)</span>
                    <span className="text-xs font-black text-purple-400">49 € / mes</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Licencia estándar completa para talleres en producción activa.
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>&bull; Órdenes, citas y presupuestos ilimitados</li>
                    <li>&bull; Veri*Factu y Balances Fiscales activos</li>
                    <li>&bull; Gestión de múltiples empleados Autorizados</li>
                    <li>&bull; Asistente METIS IA integrado</li>
                  </ul>
                </div>

                {/* 3. En Promoción VIP */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3 shadow-md shadow-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">En Promoción VIP</span>
                    <span className="text-xs font-black text-emerald-400">1 Año Bonificado</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Acuerdos con asociaciones de automoción o talleres piloto colaboradores.
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>&bull; Acceso absoluto a todas las características</li>
                    <li>&bull; Soporte preferente de ingeniería</li>
                    <li>&bull; Renovación automática acordada</li>
                  </ul>
                </div>
              </div>

              {/* Active Workshop License Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Taller / Titular</th>
                      <th className="py-3 px-3">Tipo Licencia</th>
                      <th className="py-3 px-3">Estado</th>
                      <th className="py-3 px-3">Vencimiento</th>
                      <th className="py-3 px-3 text-right">Acciones de Desarrollador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {solicitudes.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{s.nombreTaller}</span>
                          <span className="text-slate-400 text-[11px] font-mono">{s.email}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            s.planSolicitado === 'PAGO_PRO' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            s.planSolicitado === 'PROMOCION_VIP' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {s.planSolicitado}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-300 capitalize">{s.licencia?.estado || s.estado}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {s.licencia?.fechaFin ? new Date(s.licencia.fechaFin).toLocaleDateString('es-ES') : 'Indefinido'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateLic(s.id, 'PAGO_PRO', 'activo')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                              title="Asignar Pago PRO"
                            >
                              PRO
                            </button>
                            <button
                              onClick={() => handleUpdateLic(s.id, 'PROMOCION_VIP', 'activo')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px]"
                              title="Asignar Promoción VIP"
                            >
                              VIP
                            </button>
                            <button
                              onClick={() => handleUpdateLic(s.id, 'GRATUITA_PRUEBA', 'prueba')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px]"
                              title="Asignar Gratuita de Prueba"
                            >
                              Prueba
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TELEMETRÍA Y ESTADO */}
        {activeTab === 'telemetria' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-sky-400" />
                  Telemetría de la Arquitectura GESTARIAN DM CAR
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Métricas de base de datos Supabase, protección de egreso de cuota y diagnósticos en tiempo real.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-medium">Motor de Persistencia</span>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Supabase PostgreSQL + Storage</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Conexión directa blindada con fallback local transparente.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Egress Shield Supabase</span>
                    <button
                      type="button"
                      onClick={() => setShowAuditModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold transition-colors"
                    >
                      Ver Auditoría
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Caché Local Activa (TTL 10 min)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Evita lecturas y consumos innecesarios al navegar entre pestañas.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-medium">Asistente METIS IA</span>
                  <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Modo Bidireccional Activo</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Conversación continua manos libres con contexto dinámico de taller.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Identificador de Sesión de Desarrollador: <code className="text-purple-300 font-mono">DEV-ROOT-SESSION-2026</code>
                </span>

                <button
                  onClick={() => {
                    localStorage.removeItem('gestarian_talleres_solicitudes')
                    localStorage.removeItem('gestarian_empleados_autorizados')
                    reloadData()
                    addToast('Datos de talleres y autorizaciones restaurados a valores iniciales', 'info')
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restablecer Semillas de Demostración</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Auditoría Egress exclusivo de desarrollador */}
      <EgressAuditModal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} />
    </div>
  )
}
