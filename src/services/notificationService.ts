export interface AppNotification {
  id: string
  titulo: string
  mensaje: string
  tipo: 'info' | 'alerta' | 'exito' | 'fiscal'
  leida: boolean
  fecha: string
  enlace?: string
}

const NOTIF_KEY = 'gestarian_notifications'

export const notificationService = {
  getNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIF_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  addNotification(notif: Omit<AppNotification, 'id' | 'leida' | 'fecha'>): AppNotification {
    const current = this.getNotifications()
    const nueva: AppNotification = {
      ...notif,
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      leida: false,
      fecha: new Date().toISOString()
    }
    const updated = [nueva, ...current.slice(0, 49)]
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('gestarian-notification-added', { detail: nueva }))
    return nueva
  },

  markAsRead(id: string) {
    const current = this.getNotifications()
    const updated = current.map(n => n.id === id ? { ...n, leida: true } : n)
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated))
  },

  markAllAsRead() {
    const current = this.getNotifications()
    const updated = current.map(n => ({ ...n, leida: true }))
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated))
  }
}
