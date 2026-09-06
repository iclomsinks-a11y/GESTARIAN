import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../lib/ToastContext'
import { 
  Key, 
  Building2, 
  Users, 
  FileText, 
  ArrowRight, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Car, 
  PlusCircle, 
  X,
  Lock,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import type { RoleType, TipoLicencia } from '../services/authService/types'

export const GeneralAccessPortalPage: React.FC = () => {
  const { 
    loginAsDeveloper, 
    loginAsUsuario, 
    loginAsAutorizado, 
    loginAsCliente, 
    registerWorkshopRequest,
    getStoredEmpleados 
  } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const defaultTab = (searchParams.get('tab') as RoleType) || 'USUARIO'
  const [activeTab, setActiveTab] = useState<RoleType>(defaultTab)

  // Login form states
  const [usuarioEmail, setUsuarioEmail] = useState('gestion@talleresdmcar.es')
  const [autorizadoInput, setAutorizadoInput] = useState('1234')
  const [clienteMatricula, setClienteMatricula] = useState('1234-KMT')
  const [clienteDoc, setClienteDoc] = useState('600 123 456')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Modal for new workshop registration
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [regForm, setRegForm] = useState({
    email: '',
    nombreTitular: '',
    nombreTaller: '',
    cif: '',
    telefono: '',
    direccion: '',
    planSolicitado: 'PAGO_PRO' as TipoLicencia
  })

  const handleUsuarioLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await loginAsUsuario(usuarioEmail)
      if (res.success) {
        addToast(`Bienvenido a ${res.user?.tallerNombre || 'GESTARIAN'}`, 'success')
        navigate('/')
      } else {
        setErrorMsg(res.error || 'Error al iniciar sesión')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleAutorizadoLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await loginAsAutorizado(autorizadoInput)
      if (res.success) {
        addToast(`Bienvenido/a, ${res.empleado?.nombre} (${res.empleado?.cargo})`, 'success')
        navigate('/')
      } else {
        setErrorMsg(res.error || 'PIN o empleado no válido')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de acceso')
    } finally {
      setLoading(false)
    }
  }

  const handleClienteLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await loginAsCliente(clienteMatricula, clienteDoc)
      if (res.success) {
        addToast(`Bienvenido a tu Área de Cliente`, 'success')
        navigate('/cliente')
      } else {
        setErrorMsg(res.error || 'No se pudo acceder con estos datos')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de acceso')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSolicitud = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regForm.email || !regForm.nombreTaller || !regForm.cif) {
      addToast('Por favor completa los campos obligatorios', 'warning')
      return
    }

    registerWorkshopRequest(regForm)
    addToast('Solicitud de alta enviada. El Desarrollador Maestro la revisará y autorizará.', 'success')
    setShowRegisterModal(false)
    setUsuarioEmail(regForm.email)
  }

  const empleados = getStoredEmpleados()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-sky-500 selection:text-white relative">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-8 py-4 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/20 font-black">
            DM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-base tracking-wide">GESTARIAN</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                DM CAR
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Portal Unificado de Acceso por Roles</p>
          </div>
        </div>

        {/* Direct Link to Developer Gateway */}
        <Link
          to="/dev-auth"
          className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          title="Acceso exclusivo para el Desarrollador Maestro"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>Acceso Desarrollador</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Portal de Acceso al Sistema
          </h1>
          <p className="text-xs text-slate-400">
            Selecciona tu perfil de usuario para ingresar al módulo correspondiente según la jerarquía de permisos.
          </p>
        </div>

        {/* 4 Role Cards Navigation Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-3xl mb-6">
          {/* Card 1: Desarrollador */}
          <button
            onClick={() => navigate('/dev-auth')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeTab === 'DESARROLLADOR'
                ? 'bg-purple-600/20 border-purple-500 text-white ring-2 ring-purple-500/30'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-purple-500/40 hover:text-white'
            }`}
          >
            <div className="p-2 w-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-purple-400 block uppercase font-bold">Rol Maestro</span>
              <span className="text-xs font-bold text-white block">Desarrollador</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Control global & altas</span>
            </div>
          </button>

          {/* Card 2: Usuario */}
          <button
            onClick={() => { setActiveTab('USUARIO'); setErrorMsg('') }}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeTab === 'USUARIO'
                ? 'bg-emerald-600/20 border-emerald-500 text-white ring-2 ring-emerald-500/30'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-white'
            }`}
          >
            <div className="p-2 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-emerald-400 block uppercase font-bold">Dueño / Gerente</span>
              <span className="text-xs font-bold text-white block">Usuario (Taller)</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Gestión de negocio</span>
            </div>
          </button>

          {/* Card 3: Autorizado */}
          <button
            onClick={() => { setActiveTab('AUTORIZADO'); setErrorMsg('') }}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeTab === 'AUTORIZADO'
                ? 'bg-amber-600/20 border-amber-500 text-white ring-2 ring-amber-500/30'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-amber-500/40 hover:text-white'
            }`}
          >
            <div className="p-2 w-fit rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-400 block uppercase font-bold">Empleado Taller</span>
              <span className="text-xs font-bold text-white block">Autorizado</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Mecánico u operario</span>
            </div>
          </button>

          {/* Card 4: Cliente */}
          <button
            onClick={() => { setActiveTab('CLIENTE'); setErrorMsg('') }}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeTab === 'CLIENTE'
                ? 'bg-cyan-600/20 border-cyan-500 text-white ring-2 ring-cyan-500/30'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-cyan-500/40 hover:text-white'
            }`}
          >
            <div className="p-2 w-fit rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 block uppercase font-bold">Cliente Final</span>
              <span className="text-xs font-bold text-white block">Área Cliente</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Vehículos & facturas</span>
            </div>
          </button>
        </div>

        {/* Selected Form Container */}
        <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB CONTENT: USUARIO (DUEÑO DE TALLER) */}
          {activeTab === 'USUARIO' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-4">
                <div className="inline-block p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white">Acceso para Titulares de Taller</h2>
                <p className="text-xs text-slate-400">
                  Controla reparaciones, órdenes de trabajo, facturas Veri*Factu y gestiona a tus empleados.
                </p>
              </div>

              <form onSubmit={handleUsuarioLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Email del Taller / Titular</label>
                  <input
                    type="email"
                    required
                    value={usuarioEmail}
                    onChange={(e) => setUsuarioEmail(e.target.value)}
                    placeholder="gestion@talleresdmcar.es"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Contraseña de Acceso</label>
                  <input
                    type="password"
                    defaultValue="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Entrar al Taller</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-slate-800 space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center justify-center gap-1.5 mx-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>¿No tienes cuenta? Solicitar Alta de Taller</span>
                </button>
                <p className="text-[11px] text-slate-500">
                  Las nuevas altas requieren la autorización del Desarrollador Maestro.
                </p>
              </div>
            </div>
          )}

          {/* TAB CONTENT: AUTORIZADO (EMPLEADO) */}
          {activeTab === 'AUTORIZADO' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-4">
                <div className="inline-block p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white">Acceso para Personal del Taller</h2>
                <p className="text-xs text-slate-400">
                  Acceso directo mediante tu código PIN de operario o tu email de empleado.
                </p>
              </div>

              <form onSubmit={handleAutorizadoLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Código PIN de Operario o Email</label>
                  <input
                    type="text"
                    required
                    value={autorizadoInput}
                    onChange={(e) => setAutorizadoInput(e.target.value)}
                    placeholder="Ej. 1234 (Marcos) o 4321 (Lucía)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Validar Empleado y Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo quick access chips */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400 block font-medium">Acceso rápido con empleados de demostración:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {empleados.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setAutorizadoInput(emp.pinAcceso)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
                    >
                      <span className="font-bold text-white block truncate">{emp.nombre}</span>
                      <span className="text-amber-400 block text-[10px]">PIN: {emp.pinAcceso} ({emp.cargo.split('/')[0]})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: CLIENTE */}
          {activeTab === 'CLIENTE' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-4">
                <div className="inline-block p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-1">
                  <Car className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white">Área de Clientes del Taller</h2>
                <p className="text-xs text-slate-400">
                  Consulta el estado de tu coche, presupuestos pendientes de aprobación y facturas.
                </p>
              </div>

              <form onSubmit={handleClienteLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Matrícula del Vehículo</label>
                  <input
                    type="text"
                    required
                    value={clienteMatricula}
                    onChange={(e) => setClienteMatricula(e.target.value.toUpperCase())}
                    placeholder="Ej. 1234-KMT"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Teléfono o DNI de Identificación</label>
                  <input
                    type="text"
                    required
                    value={clienteDoc}
                    onChange={(e) => setClienteDoc(e.target.value)}
                    placeholder="Ej. 600 123 456 o DNI"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-cyan-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Acceder a Mi Vehículo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Solicitar Alta de Taller (Usuario) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  Solicitud de Alta de Taller (Usuario)
                </h3>
                <p className="text-xs text-slate-400">
                  Tu solicitud quedará pendiente de autorización por parte del Desarrollador Maestro.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSolicitud} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nombre Comercial del Taller *</label>
                  <input
                    type="text"
                    required
                    value={regForm.nombreTaller}
                    onChange={(e) => setRegForm({ ...regForm, nombreTaller: e.target.value })}
                    placeholder="Ej. Taller Mecánico San Juan"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nombre y Apellidos del Titular *</label>
                  <input
                    type="text"
                    required
                    value={regForm.nombreTitular}
                    onChange={(e) => setRegForm({ ...regForm, nombreTitular: e.target.value })}
                    placeholder="Ej. Juan Gómez Pérez"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Email Oficial de Taller *</label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="contacto@taller.es"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">CIF / NIF del Taller *</label>
                  <input
                    type="text"
                    required
                    value={regForm.cif}
                    onChange={(e) => setRegForm({ ...regForm, cif: e.target.value.toUpperCase() })}
                    placeholder="B12345678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={regForm.telefono}
                    onChange={(e) => setRegForm({ ...regForm, telefono: e.target.value })}
                    placeholder="912 345 678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Plan Deseado</label>
                  <select
                    value={regForm.planSolicitado}
                    onChange={(e) => setRegForm({ ...regForm, planSolicitado: e.target.value as TipoLicencia })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="GRATUITA_PRUEBA">Prueba Gratuita (30 días)</option>
                    <option value="PAGO_PRO">Comercial PRO (€49/mes)</option>
                    <option value="PROMOCION_VIP">Promoción Especial Taller</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Dirección del Taller</label>
                <input
                  type="text"
                  value={regForm.direccion}
                  onChange={(e) => setRegForm({ ...regForm, direccion: e.target.value })}
                  placeholder="Calle, Polígono o Avenida, Localidad"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Enviar Solicitud al Desarrollador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-8 py-4 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>GESTARIAN DM CAR &bull; Gestión Integral de Taller con IA</span>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <Link to="/dev-auth" className="text-purple-400 hover:underline">Acceso Desarrollador</Link>
        </div>
      </footer>
    </div>
  )
}
