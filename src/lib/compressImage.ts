/**
 * Comprime imágenes en canvas a WebP con tamaño y calidad optimizados.
 * Reduce fotos de 4-8 MB a ~120-200 KB antes de cualquier subida.
 */
export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
}

export async function compressImage(
  file: File | Blob,
  maxWidthOrOptions: number | CompressOptions = 1280,
  qualityParam = 0.8
): Promise<Blob> {
  let maxWidth = 1280
  let quality = qualityParam

  if (typeof maxWidthOrOptions === 'object' && maxWidthOrOptions !== null) {
    if (maxWidthOrOptions.maxWidth) maxWidth = maxWidthOrOptions.maxWidth
    if (maxWidthOrOptions.quality) quality = maxWidthOrOptions.quality
  } else if (typeof maxWidthOrOptions === 'number') {
    maxWidth = maxWidthOrOptions
  }

  // Si no es imagen, se retorna intacto
  if (file.type && !file.type.startsWith('image/')) return file;
  
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = objectUrl;
  });

  const scale = Math.min(1, maxWidth / (img.width || 1280));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((img.width || 1280) * scale);
  canvas.height = Math.round((img.height || 720) * scale);
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  const mime = 'image/webp';
  const blob: Blob = await new Promise((res) => {
    canvas.toBlob((b) => {
      if (b) res(b);
      else {
        canvas.toBlob((fallbackBlob) => res(fallbackBlob || file), 'image/jpeg', quality);
      }
    }, mime, quality);
  });
  URL.revokeObjectURL(objectUrl);
  return blob;
}
