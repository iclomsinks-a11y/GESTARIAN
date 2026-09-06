import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export interface RealtimeSubscriptionOptions {
  table?: string
  tables?: string[]
  filterColumn?: string
  filterValue?: string | null
  onUpdate?: () => void
  onInsert?: () => void
  onDelete?: () => void
  debounceMs?: number
}

/**
 * Hook optimizado de Realtime:
 * - Soporta tanto llamadas por objeto { table, onUpdate } como por argumentos directos (tables, filterCol...)
 * - Reutiliza identificadores de canal estables
 * - Limpia canales antiguos antes de suscribir nuevos
 * - Aplica debounce al callback de actualización para consolidar ráfagas de red y evitar consumo de egreso
 */
export function useRealtimeSubscription(
  tablesOrOptions: string[] | RealtimeSubscriptionOptions,
  filterColumn?: string,
  filterValue?: string | null,
  onUpdateCallback?: () => void,
  debounceMsDefault = 600
) {
  let targetTables: string[] = []
  let resolvedFilterColumn: string | undefined = filterColumn
  let resolvedFilterValue: string | null | undefined = filterValue
  let resolvedOnUpdate: (() => void) | undefined = onUpdateCallback
  let resolvedDebounceMs = debounceMsDefault

  if (Array.isArray(tablesOrOptions)) {
    targetTables = tablesOrOptions
  } else if (typeof tablesOrOptions === 'object' && tablesOrOptions !== null) {
    if (tablesOrOptions.table) {
      targetTables = [tablesOrOptions.table]
    } else if (tablesOrOptions.tables) {
      targetTables = tablesOrOptions.tables
    }
    resolvedFilterColumn = tablesOrOptions.filterColumn
    resolvedFilterValue = tablesOrOptions.filterValue
    resolvedOnUpdate = tablesOrOptions.onUpdate || tablesOrOptions.onInsert || tablesOrOptions.onDelete
    resolvedDebounceMs = tablesOrOptions.debounceMs ?? 600
  }

  const onUpdateRef = useRef(resolvedOnUpdate)
  onUpdateRef.current = resolvedOnUpdate

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (targetTables.length === 0) return
    if (resolvedFilterColumn && !resolvedFilterValue) return

    let filterString: string | undefined = undefined
    if (resolvedFilterColumn && resolvedFilterValue) {
      filterString = `${resolvedFilterColumn}=eq.${resolvedFilterValue}`
    }

    const triggerUpdate = () => {
      if (!onUpdateRef.current) return
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        onUpdateRef.current?.()
      }, resolvedDebounceMs)
    }

    const channels = targetTables.map((table) => {
      const channelName = `sub_${table}_${resolvedFilterColumn || 'all'}_${resolvedFilterValue || 'global'}`

      return supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: filterString,
          },
          () => {
            triggerUpdate()
          }
        )
        .subscribe()
    })

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [JSON.stringify(targetTables), resolvedFilterColumn, resolvedFilterValue, resolvedDebounceMs])
}
