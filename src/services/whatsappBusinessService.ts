export interface WhatsAppMessagePayload {
  to: string
  templateName?: string
  parameters?: Record<string, string>
  text?: string
}

export const whatsappBusinessService = {
  async sendMessage(payload: WhatsAppMessagePayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const cleanPhone = payload.to.replace(/[^0-9]/g, '')
      const msg = payload.text || 'Hola, le contactamos desde GESTARIAN DM CAR.'
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      if (typeof window !== 'undefined') {
        window.open(waUrl, '_blank')
      }
      return { success: true, messageId: 'wa_' + Date.now() }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error en WhatsApp Business' }
    }
  }
}
