import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Cliente } from '../lib/types'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useToast } from '../lib/ToastContext'
import { getOfflineClientes, saveOfflineClientes } from '../lib/offlineStorage'
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Car,
  AlertCircle
} from 'lucide-react'

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    cp: '',
    localidad: ''
  })
  const { addToast } = useToast()

  // Load clients with OPTIMIZED column selection to eliminate egress bloat
  const fetchClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, dni, email, telefono, direccion, cp, localidad, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      if (data && data.length > 0) {
        setClientes(data as Cliente[])
        saveOfflineClientes(data as Cliente[])
      } else {
        const offline = getOfflineClientes()
        if (offline && offline.length > 0) {
          setClientes(offline)
        } else {
          // Demo fallback seed
          const demoClientes: Cliente[] = [
            { id: 'c1', nombre: 'Talleres Norte S.L.', dni: 'B82910291', email: 'contacto@talleresnorte.com', telefono: '612345678', direccion: 'Pol. Ind. Las Eras, 4', cp: '28040', localidad: 'Madrid', created_at: new Date().toISOString() },
            { id: 'c2', nombre: 'Carlos Mendoza Gómez', dni: '47281920X', email: 'carlos.mendoza@email.es', telefono: '654987321', direccion: 'Calle Mayor, 15 2ºB', cp: '28013', localidad: 'Madrid', created_at: new Date().toISOString() },
            { id: 'c3', nombre: 'Elena Vega Serrano', dni: '05928172Z', email: 'elena.vega@gmail.com', telefono: '622114477', direccion: 'Avenida de la Albufera, 88', cp: '28038', localidad: 'Madrid', created_at: new Date().toISOString() }
          ]
          setClientes(demoClientes)
          saveOfflineClientes(demoClientes)
        }
      }
    } catch (err: any) {
      console.warn('Error fetching clientes:', err)
      const offline = getOfflineClientes()
      if (offline.length > 0) {
        setClientes(offline)
        addToast('Clientes cargados desde caché offline', 'info')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  // CENTRALIZED REALTIME HOOK: Debounced, auto-unsubscribed, prevents 5GB exhaustion
  useRealtimeSubscription({
    table: 'clientes',
    onInsert: () => fetchClientes(),
    onUpdate: () => fetchClientes(),
    onDelete: () => fetchClientes()
  })

  const filteredClientes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return clientes
    return clientes.filter(c =>
      c.nombre?.toLowerCase().includes(q) ||
      c.dni?.toLowerCase().includes(q) ||
      c.telefono?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  }, [clientes, searchTerm])

  const openModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        nombre: cliente.nombre || '',
        dni: cliente.dni || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        cp: cliente.cp || '',
        localidad: cliente.localidad || ''
      })
    } else {
      setEditingCliente(null)
      setFormData({
        nombre: '',
        dni: '',
        email: '',
        telefono: '',
        direccion: '',
        cp: '',
        localidad: ''
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCliente(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      addToast('El nombre del cliente es obligatorio', 'warning')
      return
    }

    try {
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre: formData.nombre,
            dni: formData.dni,
            email: formData.email,
            telefono: formData.telefono,
            direccion: formData.direccion,
            cp: formData.cp,
            localidad: formData.localidad
          })
          .eq('id', editingCliente.id)

        if (error) throw error

        const updated = clientes.map(c => c.id === editingCliente.id ? { ...c, ...formData } : c)
        setClientes(updated)
        saveOfflineClientes(updated)
        addToast('Cliente actualizado con éxito', 'success')
      } else {
        const newCliente: Cliente = {
          id: 'cli_' + Date.now(),
          ...formData,
          created_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('clientes')
          .insert([formData])
          .select('id, nombre, dni, email, telefono, direccion, cp, localidad, created_at')
          .single()

        const toAdd = data ? (data as Cliente) : newCliente
        const updated = [toAdd, ...clientes]
        setClientes(updated)
        saveOfflineClientes(updated)
        addToast('Nuevo cliente registrado', 'success')
      }
      closeModal()
    } catch (err: any) {
      console.warn('Error guardando cliente:', err)
      // Fallback local
      if (editingCliente) {
        const updated = clientes.map(c => c.id === editingCliente.id ? { ...c, ...formData } : c)
        setClientes(updated)
        saveOfflineClientes(updated)
        addToast('Cliente guardado localmente', 'info')
      } else {
        const newCliente: Cliente = {
          id: 'cli_' + Date.now(),
          ...formData,
          created_at: new Date().toISOString()
        }
        const updated = [newCliente, ...clientes]
        setClientes(updated)
        saveOfflineClientes(updated)
        addToast('Cliente creado en modo local', 'info')
      }
      closeModal()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    try {
      await supabase.from('clientes').delete().eq('id', id)
      const updated = clientes.filter(c => c.id !== id)
      setClientes(updated)
      saveOfflineClientes(updated)
      addToast('Cliente eliminado', 'info')
    } catch (err) {
      const updated = clientes.filter(c => c.id !== id)
      setClientes(updated)
      saveOfflineClientes(updated)
      addToast('Cliente eliminado en local', 'info')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-sky-400" />
            Gestión de Clientes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fichero centralizado de clientes con protección de egreso y sincronización.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Cliente
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente por nombre, DNI/CIF, teléfono o email..."
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Clients List / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Cargando clientes optimizados...
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            No se encontraron clientes registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Nombre / Razón Social</th>
                  <th className="p-3.5">DNI / CIF</th>
                  <th className="p-3.5">Contacto</th>
                  <th className="p-3.5">Dirección / Localidad</th>
                  <th className="p-3.5 text-right pr-5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 pl-5 font-semibold text-white">
                      {cliente.nombre}
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono">
                      {cliente.dni || '—'}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1">
                        {cliente.telefono && (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone className="w-3 h-3 text-sky-400" />
                            <span>{cliente.telefono}</span>
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail className="w-3 h-3 text-indigo-400" />
                            <span>{cliente.email}</span>
                          </div>
                        )}
                        {!cliente.telefono && !cliente.email && <span className="text-slate-500">—</span>}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {cliente.direccion ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{cliente.direccion} {cliente.cp ? `(${cliente.cp})` : ''}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal(cliente)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Client Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nombre Completo o Empresa *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. Juan Pérez / Talleres Ejemplo S.L."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">DNI / CIF / NIE</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value.toUpperCase() })}
                    placeholder="12345678Z"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Teléfono Móvil</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="612 345 678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@ejemplo.es"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Calle, número, piso..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Código Postal</label>
                  <input
                    type="text"
                    value={formData.cp}
                    onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
                    placeholder="28001"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Localidad / Ciudad</label>
                  <input
                    type="text"
                    value={formData.localidad}
                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                    placeholder="Madrid"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
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
                  {editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
