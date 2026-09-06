import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'METIS IA Backend',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Metis AI Generation endpoint (Server-side Gemini proxy)
  app.post('/api/metis', async (req, res) => {
    try {
      const { query, fullPrompt } = req.body;

      if (!query && !fullPrompt) {
        return res.status(400).json({ error: 'Consulta no proporcionada' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          success: false,
          fallback: true,
          message: 'No GEMINI_API_KEY configured on server',
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const promptText = fullPrompt || query;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          maxOutputTokens: 500,
          temperature: 0.3,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const text = response.text || '';
      return res.json({
        success: true,
        text,
      });
    } catch (error: any) {
      console.warn('[server.ts] Advertencia en /api/metis:', error?.message || error);
      const isQuota =
        error?.message?.includes('429') ||
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('quota');

      return res.json({
        success: false,
        fallback: true,
        isQuota: !!isQuota,
        error: error?.message || 'Error en servicio AI',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server.ts] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
