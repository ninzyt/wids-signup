import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Link } from 'react-router-dom'
import { useEvents } from '@/features/events/useEvents'

export function SiteMenu() {
  const [open, setOpen] = useState(false)
  const events = useEvents()
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button className="menu-toggle" aria-label="Open navigation menu"><span /><span /><span /></button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="modal-overlay" />
      <Dialog.Content className="site-menu">
        <div className="window-bar"><Dialog.Title>WiDS / menu</Dialog.Title><Dialog.Close className="modal-close" aria-label="Close navigation menu">×</Dialog.Close></div>
        <Dialog.Description className="sr-only">Explore the calendar and see who is helping at each event.</Dialog.Description>
        <nav aria-label="Main navigation" onClick={event => { if ((event.target as HTMLElement).closest('a')) setOpen(false) }}>
          <Link to="/">Home & sign-ups</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/events">Event dashboards</Link>
          {events.data && events.data.length > 0 && <><p className="menu-label">GO TO AN EVENT</p>{events.data.filter(event => !event.archived).map(event => <Link key={event.id} to={`/events/${event.id}`} className="menu-event">{event.title}</Link>)}</>}
        </nav>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
