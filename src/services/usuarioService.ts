import { supabase } from '../lib/supabase'

export interface UsuarioItem {
  id: string
  email: string
  nombre: string
  rol: string
  activo: boolean
  creado_el?: string
}

export async function getUsuarios(): Promise<UsuarioItem[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol, activo, created_at')
      .order('nombre', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map((u: any) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre || u.email,
      rol: u.rol || 'OPERADOR',
      activo: u.activo !== false,
      creado_el: u.created_at
    }))
  } catch (e) {
    console.warn('Error al obtener usuarios:', e)
    return []
  }
}

export async function updateUsuarioEstado(id: string, activo: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo })
      .eq('id', id)
    return !error
  } catch {
    return false
  }
}
