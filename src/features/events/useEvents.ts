import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { eventsKey, fetchEvents, LOCAL_EVENTS_KEY } from './data'

export function useEvents() {
  const client = useQueryClient()
  useEffect(() => {
    const refresh = () => { void client.invalidateQueries({ queryKey: eventsKey }) }
    const storage = (event: StorageEvent) => { if (event.key === LOCAL_EVENTS_KEY || event.key === null) refresh() }
    window.addEventListener('storage', storage)
    window.addEventListener('wids:events-changed', refresh)
    return () => { window.removeEventListener('storage', storage); window.removeEventListener('wids:events-changed', refresh) }
  }, [client])
  return useQuery({ queryKey: eventsKey, queryFn: fetchEvents, refetchOnWindowFocus: true, retry: false })
}
