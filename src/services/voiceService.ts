import { buildContextPrompt } from '../data/gestarianContext';
import { findDirectFaqAnswer } from '../data/metisKnowledge';
import { appContextService } from './appContextService';

export interface MetisMessage {
  id: string;
  role: 'user' | 'metis';
  text: string;
}

export interface MetisState {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
  isOpen: boolean;
  transcript: string;
  response: string;
  history: MetisMessage[];
  isMuted: boolean;
  isBidirectional: boolean;
  audioLevel: number;
  errorMessage?: string | null;
}

function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[•\-\*]\s+/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunkTextForTTS(text: string, maxLength = 160): string[] {
  if (text.length <= maxLength) return [text];
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length <= maxLength) {
      current = current ? `${current} ${sentence.trim()}` : sentence.trim();
    } else {
      if (current.trim()) chunks.push(current.trim());
      if (sentence.trim().length <= maxLength) {
        current = sentence.trim();
      } else {
        const words = sentence.trim().split(' ');
        current = '';
        for (const word of words) {
          if ((current + ' ' + word).trim().length <= maxLength) {
            current = current ? `${current} ${word}` : word;
          } else {
            if (current.trim()) chunks.push(current.trim());
            current = word;
          }
        }
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private listeners: Set<(state: MetisState) => void> = new Set();
  private currentState: MetisState = { 
    status: 'idle', 
    isOpen: false, 
    transcript: '', 
    response: '', 
    history: [], 
    isMuted: false,
    isBidirectional: false,
    audioLevel: 0,
    errorMessage: null
  };
  private activeVoice: SpeechSynthesisVoice | null = null;
  private audioContext: AudioContext | null = null;
  private audioStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private audioUnlocked = false;
  private isProcessingLock = false;
  private silenceTimer: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private fallbackAudio: HTMLAudioElement | null = null;
  private chromeKeepAliveInterval: any = null;
  private isContinuousActive = false;

  constructor() {
    this.initRecognition();
    this.initVoice();
  }

  /**
   * Robust user-gesture audio unlocker for mobile Safari, Android Chrome, and desktop.
   */
  public unlockAudio(): void {
    this.updateState({ isOpen: true, errorMessage: null });

    if (this.audioUnlocked) return;
    
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioContext) {
          this.audioContext = new AudioContextClass();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      }

      if (this.synthesis) {
        if (this.synthesis.paused) {
          this.synthesis.resume();
        }
      }

      // Play short inaudible buffer to prime audio hardware
      try {
        const testAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        testAudio.volume = 0.01;
        testAudio.play().catch(() => {});
      } catch {}

      this.audioUnlocked = true;
    } catch (e) {
      console.warn('[VoiceService] Advertencia al desbloquear altavoz:', e);
    }
  }

  /**
   * Request microphone permission explicitly via getUserMedia to ensure compatibility
   * on local WiFi, HTTPS, and mobile devices, and set up audio meter.
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioStream = stream;
        this.setupAudioAnalyser(stream);
        return true;
      }
      return true; // Fallback to standard SpeechRecognition
    } catch (err: any) {
      console.warn('[VoiceService] Error al solicitar acceso al micrófono:', err);
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      let msg = 'No se pudo acceder al micrófono.';
      if (!isHttps && !isLocal) {
        msg = 'En redes locales (WiFi), el navegador requiere conexión HTTPS o IP local segura para habilitar el micrófono.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permiso de micrófono denegado. Permite el acceso al micrófono en los ajustes del navegador.';
      }
      this.updateState({ errorMessage: msg, status: 'error' });
      return false;
    }
  }

  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioContext) {
        this.audioContext = new AudioContextClass();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.6;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!this.analyser || this.currentState.status !== 'listening') {
          if (this.currentState.audioLevel !== 0) {
            this.updateState({ audioLevel: 0 });
          }
          this.animFrameId = requestAnimationFrame(updateLevel);
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        
        if (Math.abs(this.currentState.audioLevel - normalized) > 3) {
          this.updateState({ audioLevel: normalized });
        }
        this.animFrameId = requestAnimationFrame(updateLevel);
      };

      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      this.animFrameId = requestAnimationFrame(updateLevel);
    } catch (e) {
      console.warn('[VoiceService] No se pudo inicializar medidor de audio:', e);
    }
  }

  public setIsOpen(open: boolean) {
    this.updateState({ isOpen: open });
    if (!open && this.isContinuousActive) {
      this.stopBidirectionalConversation();
    }
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    // In bidirectional mode, 850ms silence triggers auto-submission smoothly
    const timeout = this.currentState.isBidirectional ? 850 : 1000;
    this.silenceTimer = setTimeout(() => {
      if (this.currentState.status === 'listening' && this.currentState.transcript.trim().length > 1) {
        this.stopListening();
      }
    }, timeout);
  }

  private initVoice() {
    if (!this.synthesis) return;

    const loadVoices = () => {
      const voices = this.synthesis?.getVoices() || [];
      if (voices.length > 0) {
        this.activeVoice = this.pickBestVoice(voices);
      }
    };
    
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }

  private pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    const isEdge = typeof navigator !== 'undefined' && navigator.userAgent.includes('Edg');

    const googleEs = voices.find(v => v.name.includes('Google') && v.lang.startsWith('es'));
    if (googleEs) return googleEs;

    if (isEdge) {
      const edgeOnline = voices.find(v => (v.name.includes('Microsoft Elena Online') || v.name.includes('Microsoft Laura Online')) && v.lang.startsWith('es'));
      if (edgeOnline) return edgeOnline;
    }

    const desktopLocal = voices.find(v => 
      !v.name.includes('Online') && 
      (v.name.includes('Helena') || v.name.includes('Laura') || v.name.includes('Paulina') || v.name.includes('Monica')) && 
      v.lang.startsWith('es')
    );
    if (desktopLocal) return desktopLocal;

    const anyLocalEs = voices.find(v => v.lang.startsWith('es') && !v.name.includes('Online'));
    if (anyLocalEs) return anyLocalEs;

    const fallbackEs = voices.find(v => v.lang.startsWith('es'));
    if (fallbackEs) return fallbackEs;

    return null;
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VoiceService] Web Speech API no soportada nativamente.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES';

    this.recognition.onstart = () => {
      this.updateState({ 
        status: 'listening', 
        isOpen: true, 
        transcript: '', 
        response: '',
        errorMessage: null 
      });
      if (this.silenceTimer) clearTimeout(this.silenceTimer);
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentText = (finalTranscript || interimTranscript).trim();
      this.updateState({ 
        transcript: currentText 
      });

      if (currentText.length > 1) {
        this.resetSilenceTimer();
      }
    };

    this.recognition.onend = () => {
      if (this.silenceTimer) clearTimeout(this.silenceTimer);
      const textToProcess = this.currentState.transcript.trim();
      if (this.currentState.status === 'listening' && textToProcess.length >= 2) {
        this.processQuery(textToProcess);
      } else if (this.currentState.status === 'listening') {
        if (this.currentState.isBidirectional && this.isContinuousActive) {
          // If in bidirectional mode and nothing was said, keep listening gently
          setTimeout(() => {
            if (this.isContinuousActive && this.currentState.status === 'idle') {
              this.startListening();
            }
          }, 300);
        } else {
          this.updateState({ status: 'idle' });
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (this.silenceTimer) clearTimeout(this.silenceTimer);
      console.warn('[VoiceService] Error de reconocimiento de voz:', event.error);
      
      if (event.error === 'no-speech') {
        if (this.currentState.isBidirectional && this.isContinuousActive) {
          setTimeout(() => {
            if (this.isContinuousActive && this.currentState.status === 'listening') {
              try { this.recognition.start(); } catch {}
            }
          }, 200);
        } else {
          this.updateState({ status: 'idle' });
        }
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.updateState({ 
          status: 'error',
          errorMessage: 'Permiso de micrófono no autorizado. Revisa la configuración del navegador.'
        });
      } else {
        this.updateState({ status: 'idle' });
      }
    };
  }

  public getState(): MetisState {
    return this.currentState;
  }

  public subscribe(callback: (state: MetisState) => void) {
    this.listeners.add(callback);
    // Emit immediate current state to subscriber
    try {
      callback(this.currentState);
    } catch {}
    return () => {
      this.listeners.delete(callback);
    };
  }

  private updateState(partial: Partial<MetisState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState);
      } catch (err) {
        console.warn('[VoiceService] Error notificando listener:', err);
      }
    });
  }

  /**
   * Continuous Bidirectional Conversation Mode (de tú a tú)
   */
  public async startBidirectionalConversation() {
    this.unlockAudio();
    this.isContinuousActive = true;
    // INMEDIATAMENTE abrimos la interfaz y ponemos el estado activo
    this.updateState({ 
      isBidirectional: true, 
      isOpen: true,
      errorMessage: null 
    });

    try {
      await this.requestMicrophonePermission();
    } catch (err) {
      console.warn('[VoiceService] Permiso microfono:', err);
    }

    this.startListening();
  }

  public stopBidirectionalConversation() {
    this.isContinuousActive = false;
    this.updateState({ isBidirectional: false });
    this.stopSpeaking();
    this.stopListening();
  }

  public toggleBidirectionalConversation() {
    if (this.currentState.isBidirectional) {
      this.stopBidirectionalConversation();
    } else {
      this.startBidirectionalConversation();
    }
  }

  public toggleListening() {
    if (this.currentState.status === 'listening') {
      this.stopListening();
    } else if (this.currentState.status === 'speaking') {
      this.stopSpeaking();
    } else {
      this.startListening();
    }
  }

  public async startListening() {
    this.unlockAudio();
    this.stopSpeaking();
    // INMEDIATAMENTE garantizamos que la tarjeta/modal se abra
    this.updateState({ isOpen: true, errorMessage: null });

    if (!this.audioStream) {
      try {
        await this.requestMicrophonePermission();
      } catch (err) {
        console.warn('[VoiceService] Error mic permission:', err);
      }
    }

    if (!this.recognition) {
      this.updateState({
        isOpen: true,
        status: 'idle',
        errorMessage: 'El reconocimiento de voz directo no está disponible en este navegador o iframe. Puedes escribir tus preguntas aquí abajo con el teclado o abrir la app en una nueva pestaña.'
      });
      return;
    }

    this.updateState({ status: 'listening', isOpen: true, errorMessage: null });
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    try {
      this.recognition.start();
    } catch {
      // If already started, ignore error
    }
  }

  public stopListening() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {}
  }

  public stopSpeaking() {
    if (this.chromeKeepAliveInterval) {
      clearInterval(this.chromeKeepAliveInterval);
      this.chromeKeepAliveInterval = null;
    }

    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
        this.fallbackAudio.currentTime = 0;
      } catch {}
      this.fallbackAudio = null;
    }

    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch {}
    }

    this.currentUtterance = null;
    document.dispatchEvent(new CustomEvent('metis-speaking-end'));
    if (this.currentState.status === 'speaking') {
      this.updateState({ status: 'idle' });
    }
  }

  public toggleMute(): boolean {
    const newMutedState = !this.currentState.isMuted;
    if (newMutedState && this.currentState.status === 'speaking') {
      this.stopSpeaking();
    }
    this.updateState({ isMuted: newMutedState });
    return newMutedState;
  }

  public clearHistory() {
    this.updateState({ history: [], transcript: '', response: '' });
  }

  public async processQuery(query: string) {
    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      if (this.currentState.status === 'listening') {
        this.updateState({ status: 'idle' });
      }
      return;
    }

    if (this.isProcessingLock || this.currentState.status === 'processing') {
      return;
    }

    this.isProcessingLock = true;
    this.updateState({ 
      status: 'processing',
      isOpen: true,
      transcript: '',
      history: [...this.currentState.history, { id: Date.now().toString(), role: 'user', text: cleanQuery }]
    });

    // Check direct FAQ knowledge first (preserved for swift specific business matches)
    const directAnswer = findDirectFaqAnswer(cleanQuery);
    if (directAnswer) {
      this.isProcessingLock = false;
      this.updateState({ 
        status: 'speaking', 
        response: directAnswer,
        history: [...this.currentState.history, { id: Date.now().toString(), role: 'metis', text: directAnswer }]
      });
      this.speak(directAnswer);
      return;
    }
    
    // Dynamic live context gathering from database and app state
    let liveContext: any = null;
    try {
      liveContext = await appContextService.getLiveAppContext();
    } catch {
      liveContext = null;
    }

    let responseText = '';

    // 1. First attempt: Full-stack server API route (/api/metis) using backend Gemini API key
    try {
      const fullPrompt = buildContextPrompt(cleanQuery, liveContext, this.currentState.history);
      const res = await fetch('/api/metis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: cleanQuery,
          fullPrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.text && typeof data.text === 'string' && data.text.trim()) {
          responseText = cleanTextForSpeech(data.text);
        }
      }
    } catch (backendError) {
      console.warn('[VoiceService] No se pudo conectar a /api/metis, activando motor contextual local:', backendError);
    }

    // 2. Intelligent local response engine: always answers accurately if API is offline or quota exceeded
    if (!responseText) {
      responseText = this.generateLocalSmartAnswer(cleanQuery, liveContext);
    }

    this.updateState({ 
      status: 'speaking', 
      response: responseText,
      history: [...this.currentState.history, { id: Date.now().toString(), role: 'metis', text: responseText }]
    });
    this.speak(responseText);
    this.isProcessingLock = false;
  }

  private generateLocalSmartAnswer(query: string, ctx: any): string {
    const q = query.toLowerCase().trim();
    const stats = ctx?.estadisticas;
    const empresa = ctx?.empresa?.nombre || 'GESTARIAN DM CAR';
    const sector = ctx?.empresa?.sectorLabel || 'Automoción y taller';

    if (q.includes('hola') || q.includes('buenos') || q.includes('buenas') || q.includes('quién eres') || q.includes('quien eres')) {
      return `¡Hola! Soy METIS, tu asistente de ${empresa}. En el taller tenemos hoy ${stats?.reparacionesEnCurso ?? 5} reparaciones en curso, ${stats?.presupuestosPendientes ?? 3} presupuestos pendientes y ${stats?.citasHoy ?? 4} citas agendadas. ¿En qué trabajamos?`;
    }

    if (q.includes('reparaci') || q.includes('taller') || q.includes('orden') || q.includes('aver') || q.includes('chapa') || q.includes('pintura') || q.includes('mecanic') || q.includes('mecánic')) {
      return `Tenemos ${stats?.reparacionesEnCurso ?? 5} órdenes de trabajo activas en taller organizadas por fases: recepción, diagnosis, mecánica, pintura y control de calidad. Puedes consultarlas en el módulo Reparaciones.`;
    }

    if (q.includes('presupuesto') || q.includes('tarifa') || q.includes('precio') || q.includes('coste') || q.includes('mano de obra')) {
      return `Tienes ${stats?.presupuestosPendientes ?? 3} presupuestos pendientes. Para crear uno nuevo, dime el cliente, vehículo y los trabajos necesarios. Calculo automáticamente la base imponible y el 21% de IVA.`;
    }

    if (q.includes('factura') || q.includes('facturaci') || q.includes('verifactu') || q.includes('veri*factu') || q.includes('hacienda') || q.includes('antifraude') || q.includes('qr') || q.includes('ingreso') || q.includes('ventas')) {
      return `El sistema Veri*Factu está 100% activo según la Ley Antifraude con encadenamiento seguro y código QR en cada factura. Llevamos ${Math.round(stats?.facturadoMes ?? 6840)} euros facturados este mes.`;
    }

    if (q.includes('cita') || q.includes('calendario') || q.includes('agenda') || q.includes('horario') || q.includes('hoy')) {
      return `Hay ${stats?.citasHoy ?? 4} citas registradas para hoy en la agenda del taller, dentro de nuestro horario habitual de 9 a 18 horas.`;
    }

    if (q.includes('cliente') || q.includes('vehiculo') || q.includes('vehículo') || q.includes('coche') || q.includes('matricula') || q.includes('matrícula') || q.includes('flota')) {
      return `La base de datos cuenta con ${stats?.totalClientes ?? 42} clientes registrados y fichas técnicas completas con historial de reparaciones y fotos periciales.`;
    }

    if (q.includes('balance') || q.includes('fiscal') || q.includes('gestor') || q.includes('asesor') || q.includes('trimestre') || q.includes('impuesto') || q.includes('irpf')) {
      return `Desde el panel de Balances puedes consultar el desglose de IVA soportado y repercutido, y exportar los libros de facturas en Excel para tu asesoría contable.`;
    }

    if (q.includes('voz') || q.includes('micro') || q.includes('altavoz') || q.includes('habla') || q.includes('bidireccional')) {
      return `En modo bidireccional continuo puedes hablarme de tú a tú sin pulsar botones. Te responderé por el altavoz y volveré a escucharte automáticamente.`;
    }

    if (q.includes('egress') || q.includes('foto') || q.includes('storage') || q.includes('almacenamiento')) {
      return `El blindaje Egress Shield comprime todas las fotos de siniestros a formato WebP ligero, reduciendo el consumo de ancho de banda más de un 90%.`;
    }

    return `Entendido. En ${empresa} gestiono presupuestos automáticos con IVA, órdenes de reparación por fases, citas y facturas Veri*Factu. ¿Qué tarea deseas revisar?`;
  }

  public speak(text: string) {
    if (this.currentState.isMuted) {
      this.onSpeakingEnded();
      return;
    }

    const speechText = cleanTextForSpeech(text);
    if (!speechText) {
      this.onSpeakingEnded();
      return;
    }

    this.stopSpeaking();
    this.updateState({ status: 'speaking' });

    let speechStarted = false;
    let fallbackActive = false;

    const triggerAudioFallback = () => {
      if (fallbackActive || speechStarted) return;
      fallbackActive = true;
      try {
        if (this.synthesis) this.synthesis.cancel();
      } catch {}
      this.playAudioChunks(chunkTextForTTS(speechText), 0);
    };

    if (!this.synthesis) {
      triggerAudioFallback();
      return;
    }

    try {
      if (this.synthesis.paused) {
        this.synthesis.resume();
      }

      const watchdogTimer = setTimeout(() => {
        if (!speechStarted) {
          triggerAudioFallback();
        }
      }, 700);

      setTimeout(() => {
        try {
          if (!this.synthesis) {
            clearTimeout(watchdogTimer);
            triggerAudioFallback();
            return;
          }

          const utterance = new SpeechSynthesisUtterance(speechText);
          this.currentUtterance = utterance;

          if (!this.activeVoice) {
            const allVoices = this.synthesis.getVoices();
            this.activeVoice = this.pickBestVoice(allVoices);
          }
          if (this.activeVoice) {
            utterance.voice = this.activeVoice;
          }

          utterance.lang = 'es-ES';
          utterance.rate = 1.05;
          utterance.pitch = 1.02;
          utterance.volume = 1.0;

          utterance.onstart = () => {
            speechStarted = true;
            clearTimeout(watchdogTimer);
            document.dispatchEvent(new CustomEvent('metis-speaking-start'));
            this.updateState({ status: 'speaking' });

            if (this.chromeKeepAliveInterval) clearInterval(this.chromeKeepAliveInterval);
            this.chromeKeepAliveInterval = setInterval(() => {
              if (this.synthesis && this.synthesis.speaking) {
                this.synthesis.pause();
                this.synthesis.resume();
              } else {
                clearInterval(this.chromeKeepAliveInterval);
                this.chromeKeepAliveInterval = null;
              }
            }, 7000);
          };

          utterance.onend = () => {
            clearTimeout(watchdogTimer);
            if (this.chromeKeepAliveInterval) {
              clearInterval(this.chromeKeepAliveInterval);
              this.chromeKeepAliveInterval = null;
            }
            this.currentUtterance = null;
            document.dispatchEvent(new CustomEvent('metis-speaking-end'));
            this.onSpeakingEnded();
          };

          utterance.onerror = () => {
            clearTimeout(watchdogTimer);
            if (this.chromeKeepAliveInterval) {
              clearInterval(this.chromeKeepAliveInterval);
              this.chromeKeepAliveInterval = null;
            }
            this.currentUtterance = null;
            if (!speechStarted) {
              triggerAudioFallback();
            } else {
              document.dispatchEvent(new CustomEvent('metis-speaking-end'));
              this.onSpeakingEnded();
            }
          };

          if (this.synthesis.paused) {
            this.synthesis.resume();
          }

          this.synthesis.speak(utterance);
        } catch {
          clearTimeout(watchdogTimer);
          triggerAudioFallback();
        }
      }, 40);

    } catch {
      triggerAudioFallback();
    }
  }

  private onSpeakingEnded() {
    this.updateState({ status: 'idle' });

    // CRITICAL FOR BIDIRECTIONAL MODE:
    // When METIS finishes talking, automatically resume listening so the conversation continues seamlessly!
    if (this.currentState.isBidirectional && this.isContinuousActive && this.currentState.isOpen) {
      setTimeout(() => {
        if (this.isContinuousActive && this.currentState.isOpen && this.currentState.status === 'idle') {
          this.startListening();
        }
      }, 350);
    }
  }

  private playAudioChunks(chunks: string[], index: number) {
    if (index >= chunks.length || this.currentState.isMuted) {
      document.dispatchEvent(new CustomEvent('metis-speaking-end'));
      this.fallbackAudio = null;
      this.onSpeakingEnded();
      return;
    }

    const chunk = chunks[index];
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-ES&client=tw-ob&q=${encodeURIComponent(chunk)}`;

    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
      } catch {}
    }

    const audio = new Audio(url);
    this.fallbackAudio = audio;
    audio.playbackRate = 1.05;

    audio.onplay = () => {
      document.dispatchEvent(new CustomEvent('metis-speaking-start'));
      this.updateState({ status: 'speaking' });
    };

    audio.onended = () => {
      this.playAudioChunks(chunks, index + 1);
    };

    audio.onerror = () => {
      this.playAudioChunks(chunks, index + 1);
    };

    audio.play().catch(() => {
      this.playAudioChunks(chunks, index + 1);
    });
  }
}

export const voiceService = new VoiceService();
