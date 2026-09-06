import React, { useState, useEffect } from 'react'
import { PageHeader, Card, Button } from '../components/UI'
import { Clock, Calendar, CheckCircle2, AlertCircle, Phone, Mail, Car, User, Plus, FileText, Check, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/ToastContext'
import { DateTimePickerCard } from '../components/UI/DateTimePickerCard'
import { useNavigate } from 'react-router-dom'

export interface Solicitud {
  id: string
  cliente_nombre: string
  telefono: string
  email: string
  descripcion: string
  fecha_prevista: string
  hora_prevista?: string
  estado: 'activa' | 'presupuestado' | 'desestimada'
  created_at: string
  presupuesto_id?: string
}

export function SolicitudCard({ 
  solicitud, 
  onCrearPresupuesto, 
  onCambiarFechaHora 
}: { 
  solicitud: Solicitud
  onCrearPresupuesto: (sol: Solicitud) => void
  onCambiarFechaHora: (sol: Solicitud, fecha: string, hora: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <Card className="p-5 rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">{solicitud.cliente_nombre}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              {solicitud.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{solicitud.telefono}</span>}
              {solicitud.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{solicitud.email}</span>}
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
          solicitud.estado === 'presupuestado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
          solicitud.estado === 'activa' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-100 text-gray-700'
        }`}>
          {solicitud.estado === 'presupuestado' ? 'Presupuestada' : 'Activa'}
        </span>
      </div>

      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-sm text-slate-700 font-medium">
        <strong className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descripción del Cliente:</strong>
        {solicitud.descripcion || 'Sin descripción detallada.'}
      </div>

      {/* Propuesta de Fecha de Entrega */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-900 block">Proponga fecha de entrega:</span>
          <span className="text-sm font-black text-blue-700 flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            {solicitud.fecha_prevista || 'Sin fecha asignada'} {solicitud.hora_prevista ? `a las ${solicitud.hora_prevista}` : ''}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setShowPicker(!showPicker)}
          className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100 font-bold"
        >
          {showPicker ? 'Cerrar Reloj' : 'Asignar Fecha / Hora'}
        </Button>
      </div>

      {showPicker && (
        <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl animate-in fade-in duration-200">
          <DateTimePickerCard 
            initialDate={solicitud.fecha_prevista}
            initialTime={solicitud.hora_prevista || '09:00'}
            onSelect={(fecha, hora) => {
              onCambiarFechaHora(solicitud, fecha, hora)
              setShowPicker(false)
            }}
            onClose={() => setShowPicker(false)}
          />
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <Button 
          className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md"
          onClick={() => onCrearPresupuesto(solicitud)}
        >
          <FileText className="w-4 h-4" /> Generar Presupuesto
        </Button>
      </div>
    </Card>
  )
}

export function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadSolicitudes()
  }, [])

  async function loadSolicitudes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSolicitudes(data)
      } else {
        // Datos mock de ejemplo si la tabla no existe aún
        setSolicitudes([
          {
            id: '1',
            cliente_nombre: 'Juan Pérez',
            telefono: '600112233',
            email: 'juan@example.com',
            descripcion: 'Revisión periódica de 60.000 km y cambio de pastillas de freno delanteras.',
            fecha_prevista: new Date().toISOString().split('T')[0],
            hora_prevista: '10:30',
            estado: 'activa',
            created_at: new Date().toISOString()
          }
        ])
      }
    } catch (e) {
      console.warn('Error cargando solicitudes:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCambiarFechaHora(sol: Solicitud, fecha: string, hora: string) {
    try {
      await supabase
        .from('solicitudes')
        .update({ fecha_prevista: fecha, hora_prevista: hora })
        .eq('id', sol.id)

      setSolicitudes(prev => prev.map(s => s.id === sol.id ? { ...s, fecha_prevista: fecha, hora_prevista: hora } : s))
      showToast('Fecha y hora de entrega actualizadas correctamente', 'success')
    } catch (e) {
      showToast('Error al actualizar fecha', 'error')
    }
  }

  function handleCrearPresupuesto(sol: Solicitud) {
    // Redirigir a presupuestos pasando los datos literales del cliente
    navigate('/presupuestos', { 
      state: { 
        solicitudId: sol.id,
        clienteNombre: sol.cliente_nombre,
        descripcionCliente: sol.descripcion,
        fechaEntrega: sol.fecha_prevista,
        horaEntrega: sol.hora_prevista
      } 
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader 
        title="Solicitudes de Presupuesto" 
        subtitle="Gestión de peticiones activas de clientes y propuesta de fechas de entrega" 
      />

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">Cargando solicitudes...</div>
      ) : solicitudes.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No hay solicitudes activas</h3>
          <p className="text-xs text-gray-500">Las solicitudes generadas por clientes aparecerán aquí automáticamente.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {solicitudes.map(sol => (
            <SolicitudCard 
              key={sol.id} 
              solicitud={sol} 
              onCrearPresupuesto={handleCrearPresupuesto}
              onCambiarFechaHora={handleCambiarFechaHora}
            />
          ))}
        </div>
      )}
    </div>
  )
}
