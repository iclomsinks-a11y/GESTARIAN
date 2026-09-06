import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Cita, Cliente, Vehiculo } from '../lib/types'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useToast } from '../lib/ToastContext'
import { openWhatsAppChat } from '../services/communicationService'
import { TarjetaVehiculoHeader } from '../components/common/TarjetaVehiculoHeader'
import { resolverNumeroExpediente, generarNuevoNumeroExpediente } from '../lib/expedienteHelper'
import { Calendar, Plus, Search, Clock, User, Car, Share2, CheckCircle2, XCircle, X, MapPin } from 'lucide-react'

export const CitasPage: React.FC = () => {
  const [citas, setCitas] = useState<Cita[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [modalOpen, setModalOpen] = useState(false)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    cliente_id: '',
    vehiculo_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '10:00',
    motivo: '',
    estado: 'confirmada' as const
  })

  const fetchCitas = async () => {
    try {
      setLoading(true)
      const [citasRes, cliRes, vehRes] = await Promise.all([
        supabase
          .from('citas')
          .select('id, cliente_id, vehiculo_id, fecha, hora, motivo, estado, created_at')
          .order('hora', { ascending: true }),
        supabase.from('clientes').select('id, nombre, telefono'),
        supabase.from('vehiculos').select('id, matricula, marca, modelo')
      ])

      if (citasRes.data && citasRes.data.length > 0) {
        setCitas(citasRes.data as Cita[])
      } else {
        const todayStr = new Date().toISOString().split('T')[0]
        setCitas([
          {
            id: 'cit-1',
            numero_expediente: 'EXP-26001',
            cliente_id: 'c1',
            vehiculo_id: 'v1',
            fecha: todayStr,
            hora: '09:30',
            motivo: 'Entrega vehículo para revisión pre-ITV y cambio de aceite',
            estado: 'confirmada',
            created_at: new Date().toISOString()
          },
          {
            id: 'cit-2',
            numero_expediente: 'EXP-26002',
            cliente_id: 'c2',
            vehiculo_id: 'v2',
            fecha: todayStr,
            hora: '11:00',
            motivo: 'Diagnosis testigo motor encendido en cuadro',
            estado: 'confirmada',
            created_at: new Date().toISOString()
          },
          {
            id: 'cit-3',
            numero_expediente: 'EXP-26003',
            cliente_id: 'c3',
            vehiculo_id: 'v3',
            fecha: todayStr,
            hora: '16:00',
            motivo: 'Presupuesto y revisión de frenos y neumáticos',
            estado: 'pendiente',
            created_at: new Date().toISOString()
          }
        ])
      }

      if (cliRes.data) setClientes(cliRes.data as Cliente[])
      if (vehRes.data) setVehiculos(vehRes.data as Vehiculo[])
    } catch (err) {
      console.warn('Error cargando citas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCitas()
  }, [])

  useRealtimeSubscription({
    table: 'citas',
    onInsert: () => fetchCitas(),
    onUpdate: () => fetchCitas(),
    onDelete: () => fetchCitas()
  })

  const dayCitas = useMemo(() => {
    return citas.filter(c => c.fecha === selectedDate)
  }, [citas, selectedDate])

  const openModal = () => {
    const nextExp = generarNuevoNumeroExpediente(citas.length + 1)
    setFormData({
      cliente_id: clientes[0]?.id || '',
      vehiculo_id: vehiculos[0]?.id || '',
      fecha: selectedDate,
      hora: '09:00',
      motivo: '',
      estado: 'confirmada',
      numero_expediente: nextExp
    } as any)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const expNum = (formData as any).numero_expediente || resolverNumeroExpediente({ id: 'cit_' + Date.now() })
      const newCita: Cita = {
        id: 'cit_' + Date.now(),
        ...formData,
        numero_expediente: expNum,
        created_at: new Date().toISOString()
      }

      const { data } = await supabase.from('citas').insert([{ ...formData, numero_expediente: expNum }]).select().maybeSingle()
      setCitas(prev => [...prev, data ? (data as Cita) : newCita])
      addToast(`Cita agendada vinculada al Expediente ${expNum}`, 'success')
      setModalOpen(false)
    } catch {
      setModalOpen(false)
    }
  }

  const handleWhatsAppConfirm = (cita: Cita) => {
    const cli = clientes.find(c => c.id === cita.cliente_id)
    const veh = vehiculos.find(v => v.id === cita.vehiculo_id)
    const msg = `Hola ${cli?.nombre || ''}, confirmamos su cita en GESTARIAN DM CAR para el día ${cita.fecha} a las ${cita.hora} h con su vehículo ${veh?.matricula || ''}. Motivo: ${cita.motivo}. Le esperamos.`
    openWhatsAppChat({ phone: cli?.telefono || '', message: msg })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Agenda y Citas de Taller
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Horario continuo de recepción y entregas de 09:00 a 18:00 h con recordatorios por WhatsApp.
          </p>
        </div>

        <button
          onClick={openModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Cita
        </button>
      </div>

      {/* Date selector bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <Clock className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />
        <span className="text-xs text-slate-400 font-medium">Seleccionar Fecha:</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
        />
        <span className="text-xs text-slate-400 ml-auto font-medium">
          {dayCitas.length} citas programadas para este día
        </span>
      </div>

      {/* Citas list as cards with authentic vehicle headers */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
            Cargando citas del taller...
          </div>
        ) : dayCitas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 rounded-2xl border border-slate-800">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            No hay citas agendadas para el {selectedDate}.
            <p className="text-slate-400 mt-1">Usa el botón "Nueva Cita" para programar una recepción.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dayCitas.map((cita) => {
              const cli = clientes.find(c => c.id === cita.cliente_id)
              const veh = vehiculos.find(v => v.id === cita.vehiculo_id)
              const expNum = cita.numero_expediente || resolverNumeroExpediente(cita)

              return (
                <div
                  key={cita.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between hover:border-slate-700 transition-all"
                >
                  {/* VEHICLE HEADER: Matrícula española, Marca/Modelo, Titular, Nº Expediente y Botón de Roadmap */}
                  <TarjetaVehiculoHeader
                    matricula={veh?.matricula || '7892 MNP'}
                    marca={veh?.marca || 'Toyota'}
                    modelo={veh?.modelo || 'Corolla Hybrid'}
                    titular={cli?.nombre || 'Titular Registrado'}
                    numeroExpediente={expNum}
                    badgeEstado={
                      <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        {cita.estado}
                      </span>
                    }
                    showRoadmapBtn={true}
                  />

                  {/* CONTENIDO DE LA TARJETA DE CITA */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* HORA Y FECHA */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-black text-xs">
                            {cita.hora} h
                          </div>
                          <span className="text-slate-400">{cita.fecha}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">Recepción programada</span>
                      </div>

                      {/* MOTIVO */}
                      <div className="mt-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Motivo de intervención:</span>
                        <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                          {cita.motivo}
                        </p>
                      </div>
                    </div>

                    {/* ACCIONES DE LA TARJETA */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleWhatsAppConfirm(cita)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Recordatorio WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Agendar Cita en Taller
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-indigo-300 block">Nº de Expediente</span>
                  <span className="text-[10px] text-slate-400">
                    Acompaña a la recepción del vehículo en el taller.
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-indigo-900/60 border border-indigo-400/40 text-indigo-200 font-mono font-bold text-xs shrink-0">
                  {(formData as any).numero_expediente || 'EXP-26001'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Hora (09:00 - 18:00)</label>
                  <input
                    type="time"
                    required
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Cliente</label>
                <select
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || 'Sin telf.'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Vehículo</label>
                <select
                  value={formData.vehiculo_id}
                  onChange={(e) => setFormData({ ...formData, vehiculo_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.matricula} - {v.marca} {v.modelo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Motivo de la Cita</label>
                <textarea
                  rows={2}
                  required
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ej. Revisión ITV, cambio de pastillas, diagnosis..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20 transition-all"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
