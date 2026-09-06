import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../lib/ToastContext'
import { 
  ShieldCheck, 
  Terminal, 
  Lock, 
  Key, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Eye, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { MASTER_DEVELOPER_EMAIL, MASTER_DEVELOPER_KEY } from '../services/authService'

export const DeveloperAuthPage: React.FC = () => {
  const { loginAsDeveloper, esDev } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [devEmail, setDevEmail] = useState(MASTER_DEVELOPER_EMAIL)
  const [devKey, setDevKey] = useState(MASTER_DEVELOPER_KEY)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleDevLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const res = await loginAsDeveloper(devKey, devEmail)
      if (res.success) {
        addToast('Sesión de Desarrollador Maestro iniciada con privilegios totales', 'success')
        navigate('/dev')
      } else {
        setErrorMsg(res.error || 'Clave de desarrollador no autorizada')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al autenticar desarrollador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Decorative background grid and glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-sky-600/10 blur-3xl rounded-full pointer-events-none" />

      {/* Top Bar with System Status */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold shadow-lg shadow-purple-900/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-white">GESTARIAN DM CAR</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                ROOT_ACCESS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Control Maestro de Plataforma y Licencias</p>
          </div>
        </div>

        <Link
          to="/portal"
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Portal Público General</span>
        </Link>
      </header>

      {/* Main Form Center */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-purple-500/30 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md relative">
          <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-purple-600 text-[10px] font-black uppercase tracking-widest text-white shadow-md">
            Área Exclusiva de Desarrollador
          </div>

          <div className="text-center mb-6 pt-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white">Autenticación de Desarrollador</h1>
            <p className="text-xs text-slate-400 mt-1">
              Acceso seguro con permisos maestros para gestionar usuarios, licencias y simulación en vivo de portales.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleDevLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                Email Maestro de Desarrollador
              </label>
              <input
                type="email"
                required
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="iclomsinks@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-purple-400/80 mt-1 block">
                Cuenta de ingeniería reconocida: {MASTER_DEVELOPER_EMAIL}
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                Clave Maestra de Seguridad (Dev Token / PIN)
              </label>
              <input
                type="text"
                required
                value={devKey}
                onChange={(e) => setDevKey(e.target.value)}
                placeholder="Clave maestra de desarrollador"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500 tracking-wider"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Desbloquear Portal de Desarrollador</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick preset credentials info for dev convenience */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Credencial de Ingeniería Integrada</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Token maestro por defecto: <code className="text-purple-300 font-mono">{MASTER_DEVELOPER_KEY}</code> (o tu email autorizado).
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>¿Quieres probar otros accesos?</span>
              <Link to="/portal" className="text-sky-400 hover:underline font-medium">
                Ir a Selección de Portales →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        GESTARIAN DM CAR &bull; Plataforma Multi-Taller Cloud &bull; Acceso Maestro Auditado
      </footer>
    </div>
  )
}
