import { supabase } from '../lib/supabase';
import { compressImage } from '../lib/compressImage';

const BUCKET_NAME = 'expedientes-fotos';

export const storageService = {
  async uploadFoto(
    file: File | Blob,
    expedienteId: string,
    tipo: 'entrada' | 'proceso' | 'final' | 'documento'
  ): Promise<{ url: string; path: string; error?: string }> {
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.75,
          maxSizeKB: 250
        });
      }

      const timestamp = Date.now();
      const ext = file.type === 'image/webp' ? 'webp' : 'jpg';
      const cleanExpId = (expedienteId || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `${cleanExpId}/${tipo}_${timestamp}.${ext}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileToUpload, {
          contentType: fileToUpload.type || 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.warn('Error subiendo foto al Storage:', error);
        return { url: '', path: '', error: error.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data?.path || filePath);

      return {
        url: publicUrlData.publicUrl,
        path: data?.path || filePath
      };
    } catch (err: any) {
      console.warn('Fallo inesperado al subir foto:', err);
      return { url: '', path: '', error: err.message || 'Error de almacenamiento' };
    }
  },

  async deleteFoto(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
      return !error;
    } catch (e) {
      console.warn('Error al borrar foto:', e);
      return false;
    }
  }
};
