export interface PlateRecognitionResult {
  plate: string;
  confidence: number;
  region?: string;
  vehicle?: {
    type?: string;
    make?: string;
    model?: string;
    color?: string;
  };
}

export async function recognizePlateFromImage(imageBlob: Blob | File): Promise<PlateRecognitionResult | null> {
  try {
    const token = import.meta.env.VITE_PLATE_RECOGNIZER_TOKEN;
    if (!token) {
      return null;
    }

    const formData = new FormData();
    formData.append('upload', imageBlob);
    formData.append('regions', 'es');

    const res = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`
      },
      body: formData
    });

    if (!res.ok) return null;
    const json = await res.json();
    const result = json.results?.[0];
    if (!result) return null;

    return {
      plate: result.plate?.toUpperCase() || '',
      confidence: result.score || 0,
      region: result.region?.code || 'es',
      vehicle: {
        type: result.vehicle?.type,
        make: result.model_make?.[0]?.make,
        model: result.model_make?.[0]?.model,
        color: result.color?.[0]?.color
      }
    };
  } catch (e) {
    console.warn('Plate Recognizer API error:', e);
    return null;
  }
}
