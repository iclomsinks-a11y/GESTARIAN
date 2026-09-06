import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Vehiculo, Cliente } from '../lib/types'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useToast } from '../lib/ToastContext'
import { Car, Plus, Search, User, Calendar, Wrench, Edit3, Trash2, X, AlertCircle } from 'lucide-react'

export const VehiculosPage: React.FC = () => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)
  const [formData, setFormData] = useState({
    matricula: '',
    marca: '',
    modelo: '',
    bastidor: '',
    ano: new Date().getFullYear(),
    combustible: 'diesel',
    cliente_id: ''
  })
  const { addToast } = useToast()

  const fetchVehiculos = async () => {
    try {
      setLoading(true)
      const [vehRes, cliRes] = await Promise.all([
        supabase
          .from('vehiculos')
          .select('id, matricula, marca, modelo, bastidor, ano, combustible, cliente_id, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('clientes')
          .select('id, nombre, dni')
          .order('nombre', { ascending: true })
      ])

      if (vehRes.data && vehRes.data.length > 0) {
        setVehiculos(vehRes.data as unknown as Vehiculo[])
      } else {
        // Demo seed
        setVehiculos([
          { id: 'v1', matricula: '4829KLP', marca: 'Volkswagen', modelo: 'Golf VII 2.0 TDI', bastidor: 'WVWZZZAUZEW123456', vin: 'WVWZZZAUZEW123456', anio: 2017, ano: 2017, combustible: 'diesel', cliente_id: 'c1', created_at: new Date().toISOString() },
          { id: 'v2', matricula: '9182MBN', marca: 'Toyota', modelo: 'Yaris Hybrid 120H', bastidor: 'VNKKJ3D380A987654', vin: 'VNKKJ3D380A987654', anio: 2021, ano: 2021, combustible: 'hibrido', cliente_id: 'c2', created_at: new Date().toISOString() },
          { id: 'v3', matricula: '2049HGF', marca: 'Renault', modelo: 'Clio 1.5 dCi', bastidor: 'VF15R040A51122334', vin: 'VF15R040A51122334', anio: 2014, ano: 2014, combustible: 'diesel', cliente_id: 'c3', created_at: new Date().toISOString() }
        ])
      }

      if (cliRes.data) {
        setClientes(cliRes.data as Cliente[])
      }
    } catch (err) {
      console.warn('Error al cargar vehículos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehiculos()
  }, [])

  useRealtimeSubscription({
    table: 'vehiculos',
    onInsert: () => fetchVehiculos(),
    onUpdate: () => fetchVehiculos(),
    onDelete: () => fetchVehiculos()
  })

  const filteredVehiculos = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return vehiculos
    return vehiculos.filter(v =>
      v.matricula?.toLowerCase().includes(q) ||
      v.marca?.toLowerCase().includes(q) ||
      v.modelo?.toLowerCase().includes(q) ||
      v.bastidor?.toLowerCase().includes(q)
    )
  }, [vehiculos, searchTerm])

  const openModal = (veh?: Vehiculo) => {
    if (veh) {
      setEditingVehiculo(veh)
      setFormData({
        matricula: veh.matricula || '',
        marca: veh.marca || '',
        modelo: veh.modelo || '',
        bastidor: veh.bastidor || '',
        ano: veh.ano || new Date().getFullYear(),
        combustible: veh.combustible || 'diesel',
        cliente_id: veh.cliente_id || (clientes[0]?.id || '')
      })
    } else {
      setEditingVehiculo(null)
      setFormData({
        matricula: '',
        marca: '',
        modelo: '',
        bastidor: '',
        ano: new Date().getFullYear(),
        combustible: 'diesel',
        cliente_id: clientes[0]?.id || ''
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingVehiculo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.matricula.trim()) {
      addToast('La matrícula es obligatoria', 'warning')
      return
    }

    try {
      const cleanMatricula = formData.matricula.replace(/\s+/g, '').toUpperCase()
      const payload = { ...formData, matricula: cleanMatricula }

      if (editingVehiculo) {
        await supabase.from('vehiculos').update(payload).eq('id', editingVehiculo.id)
        setVehiculos(prev => prev.map(v => v.id === editingVehiculo.id ? { ...v, ...payload } : v))
        addToast('Vehículo actualizado con éxito', 'success')
      } else {
        const newVeh: Vehiculo = {
          id: 'veh_' + Date.now(),
          ...payload,
          anio: payload.ano,
          vin: payload.bastidor,
          created_at: new Date().toISOString()
        }
        const { data } = await supabase.from('vehiculos').insert([payload]).select().maybeSingle()
        setVehiculos(prev => [data ? (data as Vehiculo) : newVeh, ...prev])
        addToast('Vehículo registrado', 'success')
      }
      closeModal()
    } catch (err: any) {
      console.warn('Error guardando vehículo:', err)
      closeModal()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este vehículo de la base de datos?')) return
    try {
      await supabase.from('vehiculos').delete().eq('id', id)
      setVehiculos(prev => prev.filter(v => v.id !== id))
      addToast('Vehículo eliminado', 'info')
    } catch {
      setVehiculos(prev => prev.filter(v => v.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Car className="w-6 h-6 text-emerald-400" />
            Parque de Vehículos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro técnico, matrículas y asignación por propietario/cliente.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Vehículo
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por matrícula (ej. 4829KLP), marca o modelo..."
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Cargando vehículos...</div>
        ) : filteredVehiculos.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Car className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            No se encontraron vehículos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Matrícula</th>
                  <th className="p-3.5">Marca / Modelo</th>
                  <th className="p-3.5">Propietario</th>
                  <th className="p-3.5">Año / Motor</th>
                  <th className="p-3.5">Bastidor (VIN)</th>
                  <th className="p-3.5 text-right pr-5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredVehiculos.map((veh) => {
                  const owner = clientes.find(c => c.id === veh.cliente_id)
                  return (
                    <tr key={veh.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 pl-5 font-black text-white font-mono tracking-wider">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {veh.matricula}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-200">
                        {veh.marca} {veh.modelo}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-sky-400" />
                          <span>{owner ? owner.nombre : 'Cliente general'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        <span className="capitalize">{veh.combustible || 'Gasolina/Diésel'}</span>
                        {veh.ano ? ` · ${veh.ano}` : ''}
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {veh.bastidor || '—'}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(veh)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(veh.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400" />
                {editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Matrícula *</label>
                  <input
                    type="text"
                    required
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
                    placeholder="1234BCD"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Propietario / Cliente</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.dni || 'S/N'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Marca</label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Ej. Ford, Renault, BMW..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Modelo</label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Ej. Focus 1.5 EcoBlue"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Año de Fabricación</label>
                  <input
                    type="number"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Combustible</label>
                  <select
                    value={formData.combustible}
                    onChange={(e) => setFormData({ ...formData, combustible: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="diesel">Diésel</option>
                    <option value="gasolina">Gasolina</option>
                    <option value="hibrido">Híbrido (HEV / PHEV)</option>
                    <option value="electrico">100% Eléctrico (EV)</option>
                    <option value="glp">GLP / GNC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Número de Bastidor (VIN)</label>
                <input
                  type="text"
                  value={formData.bastidor}
                  onChange={(e) => setFormData({ ...formData, bastidor: e.target.value.toUpperCase() })}
                  placeholder="17 caracteres alfanuméricos"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/20 transition-all"
                >
                  {editingVehiculo ? 'Guardar Cambios' : 'Registrar Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
