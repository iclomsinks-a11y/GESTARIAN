import { supabase } from './supabase'
import { uploadFotoOptimizada } from './expedienteService'

export interface VehicleImage {
  id: string
  matricula: string
  image_data: string
  created_at: string
}

export async function fetchVehicleImages(matricula: string): Promise<VehicleImage[]> {
  const cleanPlate = matricula.toUpperCase().replace(/\s/g, '')
  const { data, error } = await supabase
    .from('vehicle_images')
    .select('id, matricula, image_data, created_at')
    .eq('matricula', cleanPlate)
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []) as VehicleImage[]
}

export async function addVehicleImage(matricula: string, imageDataOrFile: string | File): Promise<VehicleImage | null> {
  const cleanPlate = matricula.toUpperCase().replace(/\s/g, '')
  
  // Subir la imagen comprimida a Supabase Storage y obtener URL pública ligera
  const imageUrl = await uploadFotoOptimizada(imageDataOrFile, cleanPlate)
  if (!imageUrl) return null

  const { data, error } = await supabase
    .from('vehicle_images')
    .insert({ matricula: cleanPlate, image_data: imageUrl })
    .select()
    .maybeSingle()
  if (error || !data) return null
  return data as VehicleImage
}

export async function deleteVehicleImage(id: string): Promise<boolean> {
  const { error } = await supabase.from('vehicle_images').delete().eq('id', id)
  return !error
}
