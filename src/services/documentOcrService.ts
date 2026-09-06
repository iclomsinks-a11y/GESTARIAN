import { extractTextFromImage as tesseractExtract } from '../lib/ocrService';

export interface DocumentOcrResult {
  fullText: string;
  matricula?: string;
  bastidor?: string;
  marca?: string;
  modelo?: string;
  nombre?: string;
  cifDni?: string;
  tipoDocumento?: 'ficha_tecnica' | 'permiso_circulacion' | 'dni' | 'presupuesto' | 'factura' | 'desconocido';
}

export async function processDocumentOcr(imageUrl: string): Promise<DocumentOcrResult> {
  const text = await tesseractExtract(imageUrl);
  const upper = text.toUpperCase();

  let tipo: DocumentOcrResult['tipoDocumento'] = 'desconocido';
  if (upper.includes('PERMISO DE CIRCULACIÓN') || upper.includes('D.1') || upper.includes('PERMISO')) {
    tipo = 'permiso_circulacion';
  } else if (upper.includes('TARJETA ITV') || upper.includes('INSPECCIÓN TÉCNICA') || upper.includes('FICHA')) {
    tipo = 'ficha_tecnica';
  } else if (upper.includes('DOCUMENTO NACIONAL') || upper.includes('ESPAÑA') && upper.includes('DNI')) {
    tipo = 'dni';
  }

  const matMatch = upper.match(/\b([0-9]{4}\s?[B-DF-HJ-NP-TV-Z]{3})\b/) || upper.match(/\b([A-Z]{1,2}\s?[0-9]{4}\s?[A-Z]{1,2})\b/);
  const matricula = matMatch ? matMatch[0].replace(/\s/g, '') : undefined;

  const vinMatch = upper.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  const bastidor = vinMatch ? vinMatch[0] : undefined;

  const dniMatch = upper.match(/\b([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])\b/);
  const cifDni = dniMatch ? dniMatch[0] : undefined;

  return {
    fullText: text,
    matricula,
    bastidor,
    cifDni,
    tipoDocumento: tipo
  };
}
