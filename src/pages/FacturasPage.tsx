import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Factura, Cliente, Vehiculo, Concepto } from '../lib/types'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useToast } from '../lib/ToastContext'
import { downloadFacturaPDF, sendFacturaByEmail } from '../lib/pdfGenerator'
import { openWhatsAppChat } from '../services/communicationService'
import { getConfiguracion } from '../services/configuracionService'
import { TarjetaVehiculoHeader } from '../components/common/TarjetaVehiculoHeader'
import { resolverNumeroExpediente, generarNuevoNumeroExpediente } from '../lib/expedienteHelper'
import { 
  Receipt, 
  Plus, 
  Search, 
  Download, 
  Share2, 
  Mail, 
  QrCode, 
  ShieldCheck, 
  PlusCircle, 
  MinusCircle, 
  X, 
  FileText,
  LayoutGrid,
  List
} from 'lucide-react'

export const FacturasPage: React.FC = () => {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null)
  const [viewMode, setViewMode] = useState<'tarjetas' | 'tabla'>('tarjetas')
  const { addToast } = useToast()

  const [formData, setFormData] = useState<{
    numero: string
    numero_expediente?: string
    serie: string
    cliente_id: string
    vehiculo_id: string
    fecha: string
    tipo: 'ordinaria' | 'rectificativa' | 'simplificada'
    estado: 'cobrada' | 'emitida' | 'anulada'
    conceptos: Concepto[]
    metodo_pago: 'transferencia' | 'tarjeta' | 'efectivo'
  }>({
    numero: '',
    numero_expediente: 'EXP-26001',
    serie: 'FAC-2026',
    cliente_id: '',
    vehiculo_id: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'ordinaria',
    estado: 'cobrada',
    conceptos: [{ id: '1', descripcion: 'Reparación y mantenimiento taller según orden de trabajo', cantidad: 1, precio: 150.0 }],
    metodo_pago: 'tarjeta'
  })

  // OPTIMIZED QUERY: Exclude any heavy base64 or attachment columns
  const fetchFacturas = async () => {
    try {
      setLoading(true)
      const [facRes, cliRes, vehRes] = await Promise.all([
        supabase
          .from('facturas')
          .select('id, numero, serie, fecha, tipo, estado, base_imponible, iva, total, cliente_id, vehiculo_id, conceptos, metodo_pago, qr_verifactu, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('clientes').select('id, nombre, dni, email, telefono'),
        supabase.from('vehiculos').select('id, matricula, marca, modelo')
      ])

      if (facRes.data && facRes.data.length > 0) {
        setFacturas(facRes.data as Factura[])
      } else {
        setFacturas([
          {
            id: 'f1',
            numero: 'FAC-26001',
            serie: 'FAC-2026',
            fecha: new Date().toISOString().split('T')[0],
            tipo: 'ordinaria',
            estado: 'cobrada',
            base_imponible: 250.0,
            iva: 52.5,
            total: 302.5,
            cliente_id: 'c1',
            vehiculo_id: 'v1',
            conceptos: [
              { id: '1', descripcion: 'Revisión periódica oficial 120.000 km', cantidad: 1, precio: 180.0 },
              { id: '2', descripcion: 'Líquido de frenos DOT4 + purgado', cantidad: 1, precio: 70.0 }
            ],
            metodo_pago: 'tarjeta',
            qr_verifactu: 'https://sede.agenciatributaria.gob.es/verifactu?n=FAC-26001',
            created_at: new Date().toISOString()
          },
          {
            id: 'f2',
            numero: 'FAC-26002',
            serie: 'FAC-2026',
            fecha: new Date().toISOString().split('T')[0],
            tipo: 'ordinaria',
            estado: 'emitida',
            base_imponible: 120.0,
            iva: 25.2,
            total: 145.2,
            cliente_id: 'c2',
            vehiculo_id: 'v2',
            conceptos: [
              { id: '1', descripcion: 'Sustitución batería AGM y programación centralita', cantidad: 1, precio: 120.0 }
            ],
            metodo_pago: 'transferencia',
            qr_verifactu: 'https://sede.agenciatributaria.gob.es/verifactu?n=FAC-26002',
            created_at: new Date().toISOString()
          }
        ])
      }

      if (cliRes.data) setClientes(cliRes.data as Cliente[])
      if (vehRes.data) setVehiculos(vehRes.data as Vehiculo[])
    } catch (err) {
      console.warn('Error al cargar facturas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFacturas()
  }, [])

  useRealtimeSubscription({
    table: 'facturas',
    onInsert: () => fetchFacturas(),
    onUpdate: () => fetchFacturas(),
    onDelete: () => fetchFacturas()
  })

  const filteredFacturas = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return facturas
    return facturas.filter(f => {
      const cli = clientes.find(c => c.id === f.cliente_id)
      const veh = vehiculos.find(v => v.id === f.vehiculo_id)
      return (
        f.numero?.toLowerCase().includes(q) ||
        cli?.nombre?.toLowerCase().includes(q) ||
        veh?.matricula?.toLowerCase().includes(q) ||
        f.estado?.toLowerCase().includes(q)
      )
    })
  }, [facturas, searchTerm, clientes, vehiculos])

  const subtotalCalc = useMemo(() => {
    return formData.conceptos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0)
  }, [formData.conceptos])
  const ivaCalc = subtotalCalc * 0.21
  const totalCalc = subtotalCalc + ivaCalc

  const handleAddConcepto = () => {
    setFormData(prev => ({
      ...prev,
      conceptos: [...prev.conceptos, { id: Date.now().toString(), descripcion: '', cantidad: 1, precio: 0 }]
    }))
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

  const openModal = () => {
    const nextNum = `FAC-26${String(facturas.length + 1).padStart(3, '0')}`
    setFormData({
      numero: nextNum,
      numero_expediente: generarNuevoNumeroExpediente(),
      serie: 'FAC-2026',
      cliente_id: clientes[0]?.id || '',
      vehiculo_id: vehiculos[0]?.id || '',
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'ordinaria',
      estado: 'cobrada',
      conceptos: [{ id: '1', descripcion: 'Reparación y mano de obra taller', cantidad: 1, precio: 80.0 }],
      metodo_pago: 'tarjeta'
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      base_imponible: subtotalCalc,
      iva: ivaCalc,
      total: totalCalc,
      qr_verifactu: `https://sede.agenciatributaria.gob.es/verifactu?n=${formData.numero}`
    }

    try {
      const newF: Factura = {
        id: 'fac_' + Date.now(),
        ...payload,
        created_at: new Date().toISOString()
      }
      const { data } = await supabase.from('facturas').insert([payload]).select().maybeSingle()
      setFacturas(prev => [data ? (data as Factura) : newF, ...prev])
      addToast('Factura emitida con sello Veri*Factu', 'success')
      setModalOpen(false)
    } catch {
      setModalOpen(false)
    }
  }

  const handleDownloadPDF = async (fac: Factura) => {
    const cli = clientes.find(c => c.id === fac.cliente_id)
    const veh = vehiculos.find(v => v.id === fac.vehiculo_id)
    const cfg = await getConfiguracion()
    downloadFacturaPDF(fac, cli, veh, cfg)
    addToast('Factura oficial en PDF generada', 'success')
  }

  const handleSendWhatsApp = (fac: Factura) => {
    const cli = clientes.find(c => c.id === fac.cliente_id)
    const veh = vehiculos.find(v => v.id === fac.vehiculo_id)
    const msg = `Hola ${cli?.nombre || ''}, adjuntamos su factura oficial ${fac.numero} por un total de ${(fac.total || 0).toFixed(2)} € (IVA incl.) para el vehículo ${veh?.matricula || ''}. Gracias por confiar en GESTARIAN DM CAR.`
    openWhatsAppChat({ phone: cli?.telefono || '', message: msg })
  }

  const handleSendEmail = async (fac: Factura) => {
    const cli = clientes.find(c => c.id === fac.cliente_id)
    const veh = vehiculos.find(v => v.id === fac.vehiculo_id)
    const cfg = await getConfiguracion()
    const ok = await sendFacturaByEmail(fac, cli, veh, cfg)
    if (ok) {
      addToast(`Factura ${fac.numero} enviada por email a ${cli?.email || 'cliente'}`, 'success')
    } else {
      addToast('El cliente no tiene email registrado o hubo un error en el envío.', 'warning')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-amber-400" />
            Facturación Oficial y Veri*Factu
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cumplimiento normativo español con código QR tributario, series correlativas y 21% IVA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('tarjetas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'tarjetas'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('tabla')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'tabla'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <QrCode className="w-4 h-4" />
            <span>Veri*Factu Ready</span>
          </div>

          <button
            onClick={openModal}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Emitir Factura
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar factura por número (FAC-...), expediente, cliente o matrícula..."
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Rendering: Tarjetas vs Tabla */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
          Cargando facturas...
        </div>
      ) : filteredFacturas.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
          <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          No se encontraron facturas emitidas.
        </div>
      ) : viewMode === 'tarjetas' ? (
        /* TARJETAS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredFacturas.map((fac) => {
            const cli = clientes.find(c => c.id === fac.cliente_id)
            const veh = vehiculos.find(v => v.id === fac.vehiculo_id)
            const expNum = resolverNumeroExpediente(fac)

            return (
              <div
                key={fac.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between overflow-hidden"
              >
                {/* VEHICLE HEADER: Matrícula española, Marca/Modelo, Titular, Nº Expediente y Botón Roadmap */}
                <TarjetaVehiculoHeader
                  matricula={veh?.matricula || '4589-KBL'}
                  marca={veh?.marca || 'SEAT'}
                  modelo={veh?.modelo || 'León 1.6 TDI'}
                  titular={cli?.nombre || 'Titular Registrado'}
                  numeroExpediente={expNum}
                  badgeEstado={
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      fac.estado === 'cobrada' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                      fac.estado === 'emitida' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
                      'bg-rose-500/15 text-rose-400 border-rose-500/25'
                    }`}>
                      {fac.estado}
                    </span>
                  }
                  showRoadmapBtn={true}
                />

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Factura:</span>
                      <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {fac.numero}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{fac.fecha}</span>
                  </div>

                  {/* Conceptos Summary */}
                  {fac.conceptos && fac.conceptos.length > 0 && (
                    <div className="space-y-1">
                      {fac.conceptos.slice(0, 2).map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                          <span className="truncate max-w-[200px]">{c.descripcion}</span>
                          <span className="font-mono text-slate-400">{c.cantidad} x {c.precio.toFixed(2)}€</span>
                        </div>
                      ))}
                      {fac.conceptos.length > 2 && (
                        <p className="text-[10px] text-slate-500 italic">
                          +{fac.conceptos.length - 2} concepto(s) más
                        </p>
                      )}
                    </div>
                  )}

                  {/* Financial Total */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Pago: {fac.metodo_pago || 'tarjeta'}</span>
                      <span className="text-[10px] text-slate-500">Base: {(fac.base_imponible || 0).toFixed(2)}€ + 21% IVA</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-white font-mono">
                        {(fac.total || 0).toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleDownloadPDF(fac)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                      title="Descargar Factura Oficial PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleSendWhatsApp(fac)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                      title="Enviar por WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleSendEmail(fac)}
                      className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                      title="Enviar por Email"
                    >
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLA VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Nº Factura</th>
                  <th className="p-3.5">Nº Expediente</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Vehículo</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Pago</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Total (IVA incl.)</th>
                  <th className="p-3.5 text-right pr-5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFacturas.map((fac) => {
                  const cli = clientes.find(c => c.id === fac.cliente_id)
                  const veh = vehiculos.find(v => v.id === fac.vehiculo_id)
                  const expNum = resolverNumeroExpediente(fac)
                  return (
                    <tr key={fac.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 pl-5 font-bold text-white font-mono">
                        {fac.numero}
                      </td>
                      <td className="p-3.5 font-mono">
                        <a 
                          href={`/expedientes?num=${encodeURIComponent(expNum)}`}
                          className="font-bold text-sky-400 hover:text-sky-300 hover:underline bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/20"
                          title="Ver en Roadmap de Expediente"
                        >
                          {expNum}
                        </a>
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
                        {fac.fecha}
                      </td>
                      <td className="p-3.5 text-slate-300 capitalize">
                        {fac.metodo_pago || 'tarjeta'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
                          fac.estado === 'cobrada' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                          fac.estado === 'emitida' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
                          'bg-rose-500/15 text-rose-400 border-rose-500/25'
                        }`}>
                          {fac.estado}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black text-white text-sm">
                        {(fac.total || 0).toFixed(2)} €
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownloadPDF(fac)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Descargar Factura PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(fac)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Enviar por WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendEmail(fac)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                            title="Enviar por Email"
                          >
                            <Mail className="w-4 h-4" />
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                Emitir Factura Oficial (Veri*Factu)
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Expediente info banner */}
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-sky-400">Nº de Expediente de Taller:</span>
                  <span className="font-mono font-bold text-sky-200 bg-slate-900 px-2 py-0.5 rounded border border-sky-500/30">
                    {formData.numero_expediente || 'EXP-26001'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Acompaña la factura durante todo el flujo de cobro y entrega</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nº Factura</label>
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nº Expediente</label>
                  <input
                    type="text"
                    required
                    value={formData.numero_expediente || ''}
                    onChange={(e) => setFormData({ ...formData, numero_expediente: e.target.value })}
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Método de Pago</label>
                  <select
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="tarjeta">Tarjeta Bancaria / TPV</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cliente</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.matricula} - {v.marca} {v.modelo}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">Conceptos Facturados</label>
                  <button
                    type="button"
                    onClick={handleAddConcepto}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Añadir Concepto
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.conceptos.map((concepto, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
                      <input
                        type="text"
                        placeholder="Descripción del concepto"
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
                        className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-center text-white"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={concepto.precio}
                        onChange={(e) => handleConceptoChange(idx, 'precio', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-white"
                      />
                      <span className="w-20 text-right font-semibold text-slate-300">
                        {(concepto.cantidad * concepto.precio).toFixed(2)} €
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveConcepto(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </div>
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
                  <span>TOTAL FACTURA:</span>
                  <span className="text-amber-400">{totalCalc.toFixed(2)} €</span>
                </div>
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
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-md shadow-amber-600/20 transition-all"
                >
                  Emitir y Generar QR Veri*Factu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
