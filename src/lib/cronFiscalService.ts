export type TipoAvisoFiscal =
  | 'aviso_20'
  | 'aviso_25'
  | 'cierre_fin'
  | 'aviso_5'
  | 'aviso_9'
  | 'envio_10'

export interface CronEvent {
  tipo: TipoAvisoFiscal
  mensaje: string
  permiteEnvioAnticipado?: boolean
  fechaDisparo: Date
}

export class CronFiscalService {
  private static KEY = 'gestarian_cron_fiscal_status'

  static getStatus(): Record<string, boolean> {
    try {
      const data = localStorage.getItem(this.KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  }

  static markAsDone(avisoId: string) {
    const status = this.getStatus()
    status[avisoId] = true
    localStorage.setItem(this.KEY, JSON.stringify(status))
  }

  static isDone(avisoId: string): boolean {
    return !!this.getStatus()[avisoId]
  }

  static checkCurrentDate(): CronEvent | null {
    const now = new Date()
    const month = now.getMonth()
    const date = now.getDate()
    const year = now.getFullYear()
    
    const isPreCierre = [2, 5, 8, 11].includes(month)
    const isCierre = [3, 6, 9, 0].includes(month)

    const quarter = Math.floor(month / 3) + 1
    const idPrefix = `Q${quarter}-${year}`
    const prevQuarter = quarter === 1 ? 4 : quarter - 1
    const prevYear = quarter === 1 ? year - 1 : year
    const prevIdPrefix = `Q${prevQuarter}-${prevYear}`

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()

    if (isPreCierre) {
      if (date === 20 && !this.isDone(`${idPrefix}-aviso_20`)) {
        return {
          tipo: 'aviso_20',
          mensaje: "Se acerca el cierre trimestral, tenga presente adjuntar las facturas pendientes para su registro. Puede generar el informe trimestral en PDF para su visualización.",
          fechaDisparo: now
        }
      }
      if (date === 25 && !this.isDone(`${idPrefix}-aviso_25`)) {
        return {
          tipo: 'aviso_25',
          mensaje: "Se acerca el cierre trimestral, tenga presente adjuntar las facturas pendientes para su registro. Puede generar el informe trimestral en PDF para su visualización.",
          fechaDisparo: now
        }
      }
      if (date === lastDayOfMonth && !this.isDone(`${idPrefix}-cierre_fin`)) {
        return {
          tipo: 'cierre_fin',
          mensaje: "El cierre trimestral ha llegado, si tiene facturas por registrar, considere adjuntarlas.",
          permiteEnvioAnticipado: true,
          fechaDisparo: now
        }
      }
    }

    if (isCierre) {
      if (date === 5 && !this.isDone(`${prevIdPrefix}-aviso_5`)) {
        return {
          tipo: 'aviso_5',
          mensaje: "El cierre trimestral ha llegado, si tiene facturas por registrar, considere adjuntarlas.",
          permiteEnvioAnticipado: true,
          fechaDisparo: now
        }
      }
      if (date === 9 && !this.isDone(`${prevIdPrefix}-aviso_9`)) {
        return {
          tipo: 'aviso_9',
          mensaje: "Mañana a las 10:00 PM se enviará automáticamente la documentación de cierre trimestral a la gestoria, si hay facturas pendientes puede adjuntarlas en el siguiente trimestre.",
          permiteEnvioAnticipado: true,
          fechaDisparo: now
        }
      }
      if (date >= 10) {
        const isPast22 = now.getHours() >= 22 || date > 10
        if (isPast22 && !this.isDone(`${prevIdPrefix}-envio_10`)) {
          return {
            tipo: 'envio_10',
            mensaje: "Se ha procedido a enviar automáticamente la documentación de cierre trimestral a la gestoría.",
            fechaDisparo: now
          }
        }
      }
    }

    return null
  }

  static getAvisoId(tipo: TipoAvisoFiscal): string {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const quarter = Math.floor(month / 3) + 1
    
    const isCierre = [3, 6, 9, 0].includes(month)
    const targetQuarter = isCierre ? (quarter === 1 ? 4 : quarter - 1) : quarter
    const targetYear = isCierre && quarter === 1 ? year - 1 : year

    return `Q${targetQuarter}-${targetYear}-${tipo}`
  }
}
