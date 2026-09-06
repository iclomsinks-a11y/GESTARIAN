import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Presupuesto, Cliente, Vehiculo, Concepto } from '../lib/types'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useToast } from '../lib/ToastContext'
import { downloadPresupuestoPDF, sendPresupuestoByEmail } from '../lib/pdfGenerator'
import { openWhatsAppChat } from '../services/communicationService'
import { getConfiguracion } from '../services/configuracionService'
import { TarjetaVehiculoHeader } from '../components/common/TarjetaVehiculoHeader'
import { resolverNumeroExpediente, generarNuevoNumeroExpediente } from '../lib/expedienteHelper'
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Download, 
  Mail, 
  Share2, 
  Trash2, 
  Edit3, 
  X, 
  CheckCircle, 
  Clock, 
  PlusCircle, 
  MinusCircle,
  FileText,
  LayoutGrid,
  List,
  Tag,
  Car,
  Check,
  ArrowLeft
} from 'lucide-react'
import { SwipeableConceptoItem } from '../components/presupuesto/SwipeableConceptoItem'
import {
  inferirTipoCliente,
  PRECIO_PIEZA_PARTICULAR,
  PRECIO_PIEZA_EMPRESA,
  PRECIO_PINTAR_ENTERO_PARTICULAR,
  PRECIO_PINTAR_ENTERO_EMPRESA
} from '../lib/presupuestoPricingRules'

export const PresupuestosPage: React.FC = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'tarjetas' | 'tabla'>('tarjetas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPresupuesto, setEditingPresupuesto] = useState<Presupuesto | null>(null)
  const { addToast } = useToast()

  // Form State
  const [formData, setFormData] = useState<{
    numero: string
    numero_expediente?: string
    cliente_id: string
    vehiculo_id: string
    fecha: string
    estado: 'pendiente' | 'aprobado' | 'rechazado' | 'facturado'
    conceptos: Concepto[]
    observaciones: string
  }>({
    numero: '',
    numero_expediente: '',
    cliente_id: '',
    vehiculo_id: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'pendiente',
    conceptos: [{ id: '1', descripcion: 'Mano de obra taller mecánico', cantidad: 1, precio: 45.0 }],
    observaciones: 'Validez del presupuesto: 30 días.'
  })

  // CRITICAL FIX: Explicit columns, EXCLUDING any base64 photo arrays to stop high egress
  const fetchPresupuestos = async () => {
    try {
      setLoading(true)
      const [presRes, cliRes, vehRes] = await Promise.all([
        supabase
          .from('presupuestos')
          .select('id, numero, fecha, estado, total, cliente_id, vehiculo_id, conceptos, observaciones, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('clientes')
          .select('id, nombre, dni, email, telefono'),
        supabase
          .from('vehiculos')
          .select('id, matricula, marca, modelo, cliente_id')
      ])

      if (presRes.data && presRes.data.length > 0) {
        setPresupuestos(presRes.data as Presupuesto[])
      } else {
        // Demo seed if none exist yet
        setPresupuestos([
          {
            id: 'p1',
            numero: 'PRES-26001',
            fecha: new Date().toISOString().split('T')[0],
            estado: 'pendiente',
            cliente_id: 'c1',
            vehiculo_id: 'v1',
            conceptos: [
              { id: '1', descripcion: 'Cambio de aceite 5W-30 sintético + filtro', cantidad: 1, precio: 75.0 },
              { id: '2', descripcion: 'Sustitución pastillas de freno delanteras', cantidad: 1, precio: 85.0 },
              { id: '3', descripcion: 'Mano de obra (1.5 horas)', cantidad: 1.5, precio: 45.0 }
            ],
            total: 275.28,
            observaciones: 'Presupuesto para revisión y mantenimiento preventivo.',
            created_at: new Date().toISOString()
          },
          {
            id: 'p2',
            numero: 'PRES-26002',
            fecha: new Date().toISOString().split('T')[0],
            estado: 'aprobado',
            cliente_id: 'c2',
            vehiculo_id: 'v2',
            conceptos: [
              { id: '1', descripcion: 'Diagnosis electrónica y borrado averías', cantidad: 1, precio: 40.0 },
              { id: '2', descripcion: 'Batería auxiliar 12V AGM', cantidad: 1, precio: 110.0 }
            ],
            total: 181.50,
            observaciones: 'Aprobado por cliente vía WhatsApp.',
            created_at: new Date().toISOString()
          }
        ])
      }

      if (cliRes.data) setClientes(cliRes.data as Cliente[])
      if (vehRes.data) setVehiculos(vehRes.data as Vehiculo[])
    } catch (err) {
      console.warn('Error al cargar presupuestos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPresupuestos()
  }, [])

  // CENTRALIZED REALTIME HOOK: Debounced, prevents 5GB exhaustion
  useRealtimeSubscription({
    table: 'presupuestos',
    onInsert: () => fetchPresupuestos(),
    onUpdate: () => fetchPresupuestos(),
    onDelete: () => fetchPresupuestos()
  })

  // Filtered
  const filteredPresupuestos = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return presupuestos
    return presupuestos.filter(p => {
      const cli = clientes.find(c => c.id === p.cliente_id)
      const veh = vehiculos.find(v => v.id === p.vehiculo_id)
      return (
        p.numero?.toLowerCase().includes(q) ||
        cli?.nombre?.toLowerCase().includes(q) ||
        veh?.matricula?.toLowerCase().includes(q) ||
        p.estado?.toLowerCase().includes(q)
      )
    })
  }, [presupuestos, searchTerm, clientes, vehiculos])

  // Calculations
  const subtotalCalc = useMemo(() => {
    return formData.conceptos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0)
  }, [formData.conceptos])

  const ivaCalc = subtotalCalc * 0.21
  const totalCalc = subtotalCalc + ivaCalc

  const handleAddConcepto = () => {
    setFormData(prev => ({
      ...prev,
      conceptos: [
        ...prev.conceptos,
        { id: Date.now().toString(), descripcion: '', cantidad: 1, precio: 0 }
      ]
    }))
  }

  const handleAddPintarPiezas = (num: number) => {
    const clienteSeleccionado = clientes.find(c => c.id === formData.cliente_id)
    const tipo = inferirTipoCliente(clienteSeleccionado?.nombre, clienteSeleccionado?.dni)
    const precio = tipo === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR
    const cant = Math.max(1, Math.round(num))
    setFormData(prev => ({
      ...prev,
      conceptos: [
        ...prev.conceptos.filter(c => c.descripcion.trim() !== '' || c.precio > 0),
        {
          id: `c-pz-num-${Date.now()}`,
          descripcion: `Pintar ${cant} pieza${cant > 1 ? 's' : ''} de carrocería (preparación y pintura en cabina)`,
          cantidad: cant,
          precio
        }
      ]
    }))
    addToast(`Añadido: Pintar ${cant} piezas (${precio} €/ud - Tarifa ${tipo.toUpperCase()})`, 'success')
  }

  const handleAddPintarEntero = () => {
    const clienteSeleccionado = clientes.find(c => c.id === formData.cliente_id)
    const tipo = inferirTipoCliente(clienteSeleccionado?.nombre, clienteSeleccionado?.dni)
    const precio = tipo === 'empresa' ? PRECIO_PINTAR_ENTERO_EMPRESA : PRECIO_PINTAR_ENTERO_PARTICULAR
    setFormData(prev => ({
      ...prev,
      conceptos: [
        ...prev.conceptos.filter(c => c.descripcion.trim() !== '' || c.precio > 0),
        {
          id: `c-pz-entero-${Date.now()}`,
          descripcion: 'Pintar vehículo entero completo en cabina con barniz alto brillo',
          cantidad: 1,
          precio
        }
      ]
    }))
    addToast(`Añadido: Pintar coche entero (${precio} € - Tarifa ${tipo.toUpperCase()})`, 'success')
  }

  const handleRemoveConcepto = (index: number) => {
    if (formData.conceptos.length <= 1) return
    setFormData(prev => ({
      ...prev,
      conceptos: prev.conceptos.filter((_, i) => i !== index)
    }))
  }

  const handleConceptoChange = (index: number, field: keyof Concepto, val: any) => {
    const updated = [...formData.conceptos]
    updated[index] = { ...updated[index], [field]: val }
    setFormData(prev => ({ ...prev, conceptos: updated }))
  }

  const openModal = (pres?: Presupuesto) => {
    if (pres) {
      setEditingPresupuesto(pres)
      setFormData({
        numero: pres.numero || '',
        numero_expediente: pres.numero_expediente || resolverNumeroExpediente(pres),
        cliente_id: pres.cliente_id || '',
        vehiculo_id: pres.vehiculo_id || '',
        fecha: pres.fecha || new Date().toISOString().split('T')[0],
        estado: (pres.estado as any) || 'pendiente',
        conceptos: pres.conceptos && pres.conceptos.length > 0 ? pres.conceptos : [{ id: '1', descripcion: 'Trabajo taller', cantidad: 1, precio: 50 }],
        observaciones: pres.observaciones || ''
      })
    } else {
      setEditingPresupuesto(null)
      const nextNum = `PRES-26${String(presupuestos.length + 1).padStart(3, '0')}`
      const nextExp = generarNuevoNumeroExpediente(presupuestos.length + 1)
      setFormData({
        numero: nextNum,
        numero_expediente: nextExp,
        cliente_id: clientes[0]?.id || '',
        vehiculo_id: vehiculos[0]?.id || '',
        fecha: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        conceptos: [{ id: '1', descripcion: 'Mantenimiento y revisión oficial', cantidad: 1, precio: 60.0 }],
        observaciones: 'Validez del presupuesto: 30 días.'
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingPresupuesto(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const expNum = formData.numero_expediente || resolverNumeroExpediente({ numero: formData.numero })
    const payload = {
      ...formData,
      numero_expediente: expNum,
      total: totalCalc
    }

    try {
      if (editingPresupuesto) {
        await supabase.from('presupuestos').update(payload).eq('id', editingPresupuesto.id)
        setPresupuestos(prev => prev.map(p => p.id === editingPresupuesto.id ? { ...p, ...payload } : p))
        addToast('Presupuesto actualizado', 'success')
      } else {
        const newP: Presupuesto = {
          id: 'pres_' + Date.now(),
          ...payload,
          created_at: new Date().toISOString()
        }
        const { data } = await supabase.from('presupuestos').insert([payload]).select().maybeSingle()
        setPresupuestos(prev => [data ? (data as Presupuesto) : newP, ...prev])
        addToast(`Presupuesto y Expediente ${expNum} generados con éxito`, 'success')
      }
      closeModal()
    } catch (err) {
      console.warn('Error guardando presupuesto:', err)
      closeModal()
    }
  }

  const handleDownloadPDF = async (pres: Presupuesto) => {
    try {
      const cli = clientes.find(c => c.id === pres.cliente_id)
      const veh = vehiculos.find(v => v.id === pres.vehiculo_id)
      const cfg = await getConfiguracion()
      downloadPresupuestoPDF(pres, cli, veh, cfg)
      addToast('PDF de Presupuesto descargado', 'success')
    } catch (e) {
      addToast('Error al generar PDF', 'error')
    }
  }

  const handleSendWhatsApp = (pres: Presupuesto) => {
    const cli = clientes.find(c => c.id === pres.cliente_id)
    const veh = vehiculos.find(v => v.id === pres.vehiculo_id)
    const phone = cli?.telefono || ''
    const msg = `Hola ${cli?.nombre || ''}, le adjuntamos el Presupuesto ${pres.numero} para su vehículo ${veh?.matricula || ''} por importe total de ${(pres.total || 0).toFixed(2)} € (IVA incl.). Puede confirmarnos la cita de 09:00 a 18:00 h.`
    openWhatsAppChat({ phone, message: msg })
  }

  const handleSendEmail = async (pres: Presupuesto) => {
    const cli = clientes.find(c => c.id === pres.cliente_id)
    const veh = vehiculos.find(v => v.id === pres.vehiculo_id)
    const cfg = await getConfiguracion()
    const res = await sendPresupuestoByEmail(pres, cli, veh, cfg)
    if (res.success) {
      addToast('Presupuesto enviado por email', 'success')
    } else {
      addToast(res.error || 'Error al enviar email', 'warning')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-sky-400" />
            Presupuestos de Taller
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cálculo instantáneo con 21% IVA, desgloses, exportación PDF y envío por WhatsApp.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Crear Presupuesto
        </button>
      </div>

      {/* Search & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número (PRES-...), expediente (EXP-...), cliente o matrícula..."
            className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('tarjetas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'tarjetas'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tarjetas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tabla')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'tabla'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {/* Content: Cards or Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
          Cargando presupuestos...
        </div>
      ) : filteredPresupuestos.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
          <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          No hay presupuestos que coincidan.
        </div>
      ) : viewMode === 'tarjetas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPresupuestos.map((pres) => {
            const cli = clientes.find(c => c.id === pres.cliente_id)
            const veh = vehiculos.find(v => v.id === pres.vehiculo_id)
            const expNum = resolverNumeroExpediente(pres)
            const statusColors = {
              pendiente: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
              aprobado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
              rechazado: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
              facturado: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25'
            }

            return (
              <div 
                key={pres.id} 
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                {/* VEHICLE HEADER: Placa española, Marca/Modelo, Titular, Nº Expediente & Botón Roadmap */}
                <TarjetaVehiculoHeader
                  matricula={veh?.matricula || '4589 KBL'}
                  marca={veh?.marca || 'SEAT'}
                  modelo={veh?.modelo || 'León 1.6 TDI'}
                  titular={cli?.nombre || 'Titular Registrado'}
                  numeroExpediente={expNum}
                  badgeEstado={
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[pres.estado] || 'bg-slate-800 text-slate-300'}`}>
                      {pres.estado}
                    </span>
                  }
                  showRoadmapBtn={true}
                />

                {/* CONTENIDO DE LA TARJETA */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-mono font-bold text-sky-300">{pres.numero}</span>
                      </div>
                      <span className="text-slate-400">{pres.fecha}</span>
                    </div>

                    {/* LÍNEAS DE CONCEPTOS */}
                    <div className="mt-3 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conceptos:</span>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {(pres.conceptos || []).map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-850">
                            <span className="text-slate-300 truncate max-w-[190px]">{c.cantidad}x {c.descripcion}</span>
                            <span className="text-white font-mono font-semibold shrink-0">{((c.cantidad || 1) * (c.precio || 0)).toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* DESGLOSE ECONÓMICO Y ACCIONES */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Base Imponible</span>
                      <span className="font-mono">{((pres.total || 0) / 1.21).toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>IVA (21%)</span>
                      <span className="font-mono">{((pres.total || 0) - (pres.total || 0) / 1.21).toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                      <span className="text-slate-200">Total Presupuesto</span>
                      <span className="text-lg font-mono font-extrabold text-emerald-400">{(pres.total || 0).toFixed(2)} €</span>
                    </div>

                    {/* BOTONES */}
                    <div className="pt-2 grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(pres)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 border border-slate-700 transition-colors"
                        title="Descargar PDF"
                      >
                        <Download className="w-3.5 h-3.5 mb-0.5" />
                        <span className="text-[10px] font-medium">PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(pres)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5 mb-0.5" />
                        <span className="text-[10px] font-medium">WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendEmail(pres)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 border border-slate-700 transition-colors"
                        title="Enviar Email"
                      >
                        <Mail className="w-3.5 h-3.5 mb-0.5" />
                        <span className="text-[10px] font-medium">Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal(pres)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5 mb-0.5" />
                        <span className="text-[10px] font-medium">Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Nº Expediente</th>
                  <th className="p-3.5">Nº Presupuesto</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Vehículo</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Total (21% IVA)</th>
                  <th className="p-3.5 text-right pr-5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPresupuestos.map((pres) => {
                  const cli = clientes.find(c => c.id === pres.cliente_id)
                  const veh = vehiculos.find(v => v.id === pres.vehiculo_id)
                  const expNum = resolverNumeroExpediente(pres)
                  const statusColors = {
                    pendiente: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
                    aprobado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
                    rechazado: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
                    facturado: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25'
                  }
                  return (
                    <tr key={pres.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 pl-5 font-bold text-sky-400 font-mono">
                        {expNum}
                      </td>
                      <td className="p-3.5 font-bold text-white font-mono">
                        {pres.numero}
                      </td>
                      <td className="p-3.5 font-medium text-slate-200">
                        {cli ? cli.nombre : 'Cliente'}
                      </td>
                      <td className="p-3.5">
                        {veh ? (
                          <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                            {veh.matricula}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {pres.fecha}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${statusColors[pres.estado] || 'bg-slate-800 text-slate-300'}`}>
                          {pres.estado}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black text-white text-sm">
                        {(pres.total || 0).toFixed(2)} €
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownloadPDF(pres)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(pres)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Enviar por WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendEmail(pres)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            title="Enviar por Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(pres)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                {editingPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-sky-300 block">Nº de Expediente Asociado</span>
                  <span className="text-[10px] text-slate-400">
                    Acompañará a todas las tarjetas del ciclo: Citas, Reparación, Notificación de finalización, Factura y Cobro.
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-sky-900/60 border border-sky-400/40 text-sky-200 font-mono font-bold text-xs shrink-0">
                  {formData.numero_expediente || 'EXP-26001'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nº Presupuesto</label>
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                    <option value="facturado">Facturado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cliente</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.dni || 'S/N'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Vehículo</label>
                  <select
                    value={formData.vehiculo_id}
                    onChange={(e) => setFormData({ ...formData, vehiculo_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.matricula} - {v.marca} {v.modelo}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Actions / Tarifas Bar */}
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-600/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-sky-200">
                    <Tag className="w-3.5 h-3.5 text-sky-400" />
                    <span>Pintar número de piezas (número entero rápido):</span>
                  </div>
                  <a
                    href="#/tarifas"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span>Ver Listado Oficial de Precios</span>
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleAddPintarPiezas(num)}
                      className="px-2 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-800 border border-sky-600/50 text-xs font-bold text-white transition-all flex items-center gap-1"
                    >
                      <span>+ {num} {num === 1 ? 'pieza' : 'piezas'}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddPintarEntero}
                    className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-600/50 text-xs font-bold text-indigo-200 transition-all flex items-center gap-1 ml-auto"
                  >
                    <Car className="w-3 h-3 text-indigo-300" />
                    <span>Pintar coche entero</span>
                  </button>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300 font-bold">Líneas de Trabajo y Materiales</label>
                    <span className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                      <ArrowLeft className="w-2.5 h-2.5" /> Scroll lateral dcha. a izq. para eliminar
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddConcepto}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Añadir Concepto
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.conceptos.map((concepto, idx) => (
                    <SwipeableConceptoItem
                      key={concepto.id || idx}
                      index={idx}
                      onDelete={() => {
                        handleRemoveConcepto(idx)
                        addToast('Línea de concepto eliminada', 'info')
                      }}
                      disabled={formData.conceptos.length <= 1}
                      className="bg-slate-800/90 border border-slate-700/60 shadow-xs"
                    >
                      <div className="flex items-center gap-2 p-2">
                        <input
                          type="text"
                          placeholder="Descripción del trabajo o recambio"
                          value={concepto.descripcion}
                          onChange={(e) => handleConceptoChange(idx, 'descripcion', e.target.value)}
                          className="flex-1 bg-transparent border-none text-white focus:outline-none"
                        />
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={concepto.cantidad}
                          onChange={(e) => handleConceptoChange(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-center text-white text-xs font-mono"
                          title="Cantidad"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={concepto.precio}
                          onChange={(e) => handleConceptoChange(idx, 'precio', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-white text-xs font-mono"
                          title="Precio unitario (€)"
                        />
                        <span className="w-20 text-right font-semibold text-slate-300 text-xs font-mono">
                          {(concepto.cantidad * concepto.precio).toFixed(2)} €
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveConcepto(idx)}
                          disabled={formData.conceptos.length <= 1}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-20 p-1"
                          title="Eliminar línea (o desliza hacia la izquierda)"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </SwipeableConceptoItem>
                  ))}
                </div>
              </div>

              {/* Total breakdown */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1 text-right">
                <div className="flex justify-between text-slate-400">
                  <span>Base Imponible:</span>
                  <span>{subtotalCalc.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>IVA (21%):</span>
                  <span>{ivaCalc.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-700">
                  <span>TOTAL:</span>
                  <span className="text-emerald-400">{totalCalc.toFixed(2)} €</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Observaciones / Condiciones</label>
                <textarea
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-md shadow-sky-600/20 transition-all"
                >
                  {editingPresupuesto ? 'Actualizar Presupuesto' : 'Guardar Presupuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
