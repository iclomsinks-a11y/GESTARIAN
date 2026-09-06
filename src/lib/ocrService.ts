export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    // @ts-ignore
    const Tesseract = await import(/* @vite-ignore */ 'tesseract.js').catch(() => null);
    if (Tesseract && (Tesseract.default || Tesseract.recognize)) {
      const recognizer = Tesseract.default?.recognize || Tesseract.recognize;
      const result = await recognizer(imageUrl, 'spa');
      return result?.data?.text || '';
    }
    return '';
  } catch (error) {
    console.warn('OCR Error or Tesseract unavailable:', error);
    return '';
  }
}
