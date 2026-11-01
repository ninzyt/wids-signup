import { useEffect, useRef, useState, type FormEvent } from 'react'
import { EventModal } from '@/components/EventModal'
import { useEvents } from './useEvents'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { eventDate, eventsKey, roleTime, hasSpace, normalizeName, saveSignup, type TeamEvent } from './data'

function RoleList({ event }: { event: TeamEvent }) {
  return <ul className="role-list">{event.roles.map(role => <li key={role.id}>
    <div className="role-heading"><span>{role.name}</span><span className="slot-count">{role.signups.length} / {role.slots}</span></div>
    <p className="role-time">{roleTime(role)}</p>
    <p>{role.signups.length ? role.signups.map(person => person.name).join(', ') : 'Be the first to lend a hand.'}</p>
  </li>)}</ul>
}

function SignupForm({ event, onClose, onSaved }: { event: TeamEvent; onClose: () => void; onSaved: (name: string) => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [roleId, setRoleId] = useState('')
  const [error, setError] = useState('')
  const openRoles = event.roles.filter(hasSpace)
  const signup = useMutation({
    mutationFn: ({ role, person }: { role: string; person: string }) => saveSignup(role, person),
    onSuccess: async (person) => {
      // Cancel an older in-flight fetch so it cannot replace the confirmed signup.
      await queryClient.cancelQueries({ queryKey: eventsKey })
      queryClient.setQueryData<TeamEvent[]>(eventsKey, current => current?.map(item => ({ ...item,
        roles: item.roles.map(role => role.id === person.role_id
          ? { ...role, signups: [...role.signups.filter(existing => existing.id !== person.id), person] }
          : role),
      })))
      onSaved(person.name)
      void queryClient.invalidateQueries({ queryKey: eventsKey })
    },
    onError: (cause: Error) => {
      setError(cause.message)
      void queryClient.invalidateQueries({ queryKey: eventsKey })
    },
  })
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (signup.isPending) return
    const person = normalizeName(name)
    const role = openRoles.find(item => item.id === roleId)
    if (!person || Array.from(person).length > 80) { setError('Enter your name (1–80 characters).'); return }
    if (!role) { setError('Choose a role with an open slot.'); return }
    if (role.signups.some(item => normalizeName(item.name).toLowerCase() === person.toLowerCase())) {
      setError('That name is already signed up for this role.'); return
    }
    setError('')
    signup.mutate({ role: role.id, person })
  }
  return <EventModal title={`Sign up · ${event.title}`} description="Choose a role and add your name. Your name will be visible on the event card." onClose={onClose} busy={signup.isPending}>
    <form onSubmit={submit} className="signup-form">
      <label htmlFor="signup-name">Name</label>
      <input id="signup-name" name="name" autoComplete="name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} disabled={signup.isPending} />
      <label htmlFor="signup-role">Role</label>
      <select id="signup-role" name="role" required value={openRoles.some(role => role.id === roleId) ? roleId : ''} onChange={e => setRoleId(e.target.value)} disabled={signup.isPending || !openRoles.length}>
        <option value="">Choose an open role</option>
        {openRoles.map(role => <option key={role.id} value={role.id}>{role.name} · {roleTime(role)} · {role.slots - role.signups.length} open</option>)}
      </select>
      {!openRoles.length && <p role="status">All roles are full. Thanks for checking in!</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions"><Button type="button" variant="outline" onClick={onClose} disabled={signup.isPending}>Cancel</Button><Button type="submit" disabled={signup.isPending || !openRoles.length}>{signup.isPending ? 'Saving…' : 'Save'}</Button></div>
    </form>
  </EventModal>
}

export function EventBoard() {
  const [selected, setSelected] = useState<{ id: string; view: 'detail' | 'signup' } | null>(null)
  const [notice, setNotice] = useState('')
  const rail = useRef<HTMLDivElement>(null)
  const events = useEvents()
  const visibleEvents = events.data?.filter(event => !event.archived)
  const active = visibleEvents?.find(event => event.id === selected?.id)

  useEffect(() => {
    const element = rail.current
    if (!element) return
    function wheel(event: WheelEvent) {
      if (!element || event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
      const delta = event.deltaY * (event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? element.clientWidth : 1)
      const max = element.scrollWidth - element.clientWidth
      if ((delta > 0 && element.scrollLeft < max - 1) || (delta < 0 && element.scrollLeft > 1)) {
        event.preventDefault()
        element.scrollLeft += delta
      }
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [events.data])

  function scroll(direction: number) {
    rail.current?.scrollBy({ left: direction * (rail.current.clientWidth * .85), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  return <section className="events-section" aria-labelledby="events-title">
    <div className="section-heading"><h2 id="events-title">Upcoming events
      <svg className="heading-plant" viewBox="0 0 32 44" fill="none" shapeRendering="crispEdges" aria-hidden="true">
        <path fill="#8ebdaa" d="M15 10h3v21h-3zM4 11h6v3h5v5h-5v-3H4zM18 21h7v-3h4v-7h-6v3h-5z" />
        <path fill="#b7d7bd" d="M15 1h6v4h3v6h-6v5h-3z" />
        <path fill="#393248" d="M5 27h23v7h-3v7h-3v3H11v-3H8v-7H5z" />
        <path fill="#b09bc7" d="M7 28h19v5H7zM10 33h13v7H10zM13 40h7v2h-7z" />
        <path fill="#e0d9ec" d="M8 29h17v2H8zM11 34h2v5h-2z" />
      </svg>
    </h2><div className="rail-controls"><button aria-label="Scroll events left" onClick={() => scroll(-1)}>←</button><button aria-label="Scroll events right" onClick={() => scroll(1)}>→</button></div></div>
    <p className="board-notice" role="status">{notice}</p>
    {events.isPending ? <p className="board-state" role="status">Loading the team’s plans…</p>
      : !events.data && events.isError ? <div className="board-state" role="alert"><p>{events.error.message}</p><Button variant="outline" onClick={() => void events.refetch()}>Try again</Button></div>
      : <>
        {events.isError && <p role="alert" className="board-state">Updates are temporarily unavailable. Showing the last loaded events. <button onClick={() => void events.refetch()}>Retry</button></p>}
        {visibleEvents?.length === 0 && <p className="board-state">No events yet.</p>}
        <div ref={rail} className="event-rail" aria-label="Events — scroll horizontally" tabIndex={0}>
          {visibleEvents?.map((event, index) => <article key={event.id} className={`feature-card event-card ${['card-lavender', 'card-blue', 'card-mint'][index % 3]}`}>
            <button className="event-details-trigger" onClick={() => setSelected({ id: event.id, view: 'detail' })} aria-label={`View details for ${event.title}`} />
            <span className="card-number">{String(index + 1).padStart(2, '0')} / EVENT</span>
            <h3>{event.title}</h3><p className="event-meta"><time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time><br />{event.location}</p>
            {event.roles.length ? <RoleList event={event} /> : <p>Roles will be added soon.</p>}
            <Button className="signup-button" disabled={!event.roles.some(hasSpace)} onClick={() => { setNotice(''); setSelected({ id: event.id, view: 'signup' }) }}>{event.roles.some(hasSpace) ? 'Sign up' : event.roles.length ? 'All roles filled' : 'No roles yet'}</Button>
          </article>)}
        </div>
      </>}
    {active && selected?.view === 'detail' && <EventModal title={active.title} description={`${eventDate(active.starts_at)} · ${active.location}`} onClose={() => setSelected(null)}>
      <p className="full-description">{active.description || 'More details will be added soon.'}</p>
      <h3 className="roles-title">Roles & helping hands</h3><RoleList event={active} />
      {!active.roles.length && <p>No roles have been added yet.</p>}
    </EventModal>}
    {active && selected?.view === 'signup' && <SignupForm key={active.id} event={active} onClose={() => setSelected(null)} onSaved={name => { setSelected(null); setNotice(`You’re on the list, ${name}. Thanks for lending a hand!`) }} />}
    {selected && events.data && !active && <EventModal title="Event unavailable" description="This event was archived or removed while you were viewing it." onClose={() => setSelected(null)}><Button onClick={() => setSelected(null)}>Back to events</Button></EventModal>}
  </section>
}
