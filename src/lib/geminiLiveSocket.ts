export class GeminiLiveSocket {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private isConnecting = false;

  constructor(apiKey?: string) {
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('GESTARIAN_GEMINI_KEY') || '';
    const baseUrl = import.meta.env.VITE_GEMINI_LIVE_WS_URL || '';
    this.url = baseUrl ? `${baseUrl}?key=${encodeURIComponent(key)}` : '';
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(): boolean {
    if (!this.url) {
      // In web preview without dedicated live WebSocket proxy, fallback to HTTP gracefully
      return false;
    }
    if (this.isConnecting || this.isConnected) return true;

    this.isConnecting = true;
    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';
      
      this.ws.onopen = () => {
        this.isConnecting = false;
        window.dispatchEvent(new CustomEvent('gemini-live-open'));
      };
      this.ws.onmessage = (ev) => this.handleMessage(ev.data);
      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        window.dispatchEvent(new CustomEvent('gemini-live-close'));
      };
      this.ws.onerror = (e) => {
        this.isConnecting = false;
        console.warn('[GeminiLiveSocket] WebSocket notice:', e);
      };
      return true;
    } catch (err) {
      this.isConnecting = false;
      this.ws = null;
      return false;
    }
  }

  sendAudioChunk(chunk: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const int16 = new Int16Array(chunk.length);
    for (let i = 0; i < chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, chunk[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    this.ws.send(int16.buffer);
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.isConnecting = false;
  }

  private handleMessage(data: any) {
    let payload: any;
    try {
      payload = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      return;
    }
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      window.dispatchEvent(new CustomEvent('gemini-live-response', { detail: { text } }));
    }
  }
}

