import { supabase } from '../lib/supabase'

export interface EmailParams {
  to: string
  subject: string
  message: string
  documentId?: string
  documentNumber?: string
  pdfContent?: Blob
  metadata?: Record<string, any>
}

export interface WhatsAppParams {
  phone: string
  message: string
  pdfUrl?: string
}

export async function sendEstimate(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = params.to?.trim()
    if (!cleanEmail) {
      return { success: false, error: 'Email destinatario no proporcionado' }
    }

    try {
      await supabase.from('comunicaciones_log').insert({
        tipo: 'email',
        destinatario: cleanEmail,
        asunto: params.subject,
        documento_id: params.documentId || null,
        documento_numero: params.documentNumber || null,
        metadata: params.metadata || {},
        fecha: new Date().toISOString(),
        estado: 'enviado'
      })
    } catch (dbErr) {
      console.warn('Registro en log no disponible:', dbErr)
    }

    const mailtoUrl = `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(params.subject)}&body=${encodeURIComponent(params.message)}`
    
    if (typeof window !== 'undefined') {
      const link = document.createElement('a')
      link.href = mailtoUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.click()
    }

    return { success: true }
  } catch (error: any) {
    console.warn('Error al preparar envío:', error)
    return { success: false, error: error?.message || 'Error al enviar email' }
  }
}

export async function sendInvoice(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  return sendEstimate(params)
}

export function openWhatsAppChat(params: WhatsAppParams): void {
  const cleanPhone = (params.phone || '').replace(/[^0-9+]/g, '')
  let fullMessage = params.message
  if (params.pdfUrl) {
    fullMessage += `\n\n📄 Puede consultar el documento aquí: ${params.pdfUrl}`
  }
  const encoded = encodeURIComponent(fullMessage)
  const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`
  if (typeof window !== 'undefined') {
    window.open(url, '_blank')
  }
}
