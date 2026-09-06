import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../lib/ToastContext'
import { Car, Phone, ShieldCheck, ArrowRight, Wrench, Lock } from 'lucide-react'

export const ClientePortalAuthPage: React.FC = () => {
  const [matricula, setMatricula] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginAsCliente } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matricula || !telefono) {
      addToast('Por favor introduce matrícula y teléfono de contacto', 'warning')
      return
    }

    try {
      setLoading(true)
      const res = await loginAsCliente(matricula.trim().toUpperCase(), telefono.trim())

      if (res.success) {
        addToast('Bienvenido a tu Portal de Cliente', 'success')
        navigate('/cliente')
      } else {
        addToast(res.error || 'Credenciales no encontradas', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAccess = async () => {
    setLoading(true)
    const res = await loginAsCliente('1234-KMT', '600 123 456')
    if (res.success) {
      navigate('/cliente')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              PORTAL CLIENTE
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                DM CAR
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Accede a tus presupuestos, citas y seguimiento en vivo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Matrícula del Vehículo
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                placeholder="Ej: 1234-KMT"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:border-sky-500 focus:outline-none"
              />
              <Car className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Teléfono de Contacto o DNI
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 600 123 456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
              />
              <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Verificando...' : 'Entrar a mi Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-3">
          <button
            onClick={handleDemoAccess}
            type="button"
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4"
          >
            Entrar con vehículo demo (1234-KMT)
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Conexión cifrada y acceso seguro para clientes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
