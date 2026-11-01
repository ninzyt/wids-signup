import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CreateEventForm } from './CreateEventForm'
import { ArchiveButton, ManageEvents } from './ManageEvents'
import { useEvents } from './useEvents'
import { eventDate, roleTime, type TeamEvent } from './data'

function EventData({ children }: { children: (events: TeamEvent[]) => ReactNode }) {
  const query = useEvents()
  if (query.isPending) return <p className="board-state" role="status">Loading the team’s plans…</p>
  if (!query.data) return <div className="board-state" role="alert"><p>{query.error?.message || 'We couldn’t load the events.'}</p><Button onClick={() => void query.refetch()}>Try again</Button></div>
  return <>{query.isError && <p className="board-state" role="alert">Updates are temporarily unavailable. Showing the last loaded events.</p>}{children(query.data)}</>
}

function EventLinks({ events }: { events: TeamEvent[] }) {
  return <ul className="event-link-list">{events.map(event => <li key={event.id}><Link to={`/events/${event.id}`}><strong>{event.title}</strong><span>{eventDate(event.starts_at)} · {event.location}</span><span className="dashboard-link-label">View team dashboard →</span></Link></li>)}</ul>
}

export function EventsPage() {
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  return <section className="content-page">
    <div className="dashboard-title-row"><h1>Event dashboards</h1><Button onClick={() => setCreating(true)}>+ Add event</Button></div>
    <p className="page-intro">Make a plan, gather your team, and keep every shift in view. Everyone can add events and sign up.</p>
    <p role="status" className="board-notice">{notice}</p>
    <EventData>{events => <ManageEvents events={events} />}</EventData>
    {creating && <CreateEventForm onClose={() => setCreating(false)} onCreated={title => { setCreating(false); setNotice(`${title} is ready for sign-ups.`) }} />}
  </section>
}

export function EventDashboard() {
  const { eventId } = useParams()
  return <section className="content-page"><Link className="back-link" to="/events">← All event dashboards</Link><EventData>{events => {
    const event = events.find(item => item.id === eventId)
    if (!event) return <><h1>Event not found</h1><p>This event may have been removed.</p></>
    const filled = event.roles.reduce((total, role) => total + role.signups.length, 0)
    const slots = event.roles.reduce((total, role) => total + role.slots, 0)
    return <><h1>{event.title}</h1><p className="page-intro">{eventDate(event.starts_at)} · {event.location}</p><p className="full-description">{event.description}</p>
      <div className="dashboard-summary"><span>{filled} / {slots} slots filled</span><span>{slots - filled} helping hands needed</span></div>
      <div className="event-management-row"><ArchiveButton event={event} />{event.archived && <p role="status">Archived — hidden from the home page and calendar.</p>}</div>
      <h2 className="team-heading">Who’s helping</h2>
      <div className="dashboard-roles">{event.roles.map((role, index) => <article className={`feature-card ${['card-lavender', 'card-blue', 'card-mint'][index % 3]}`} key={role.id}>
        <div className="role-heading"><h3>{role.name}</h3><span className="slot-count">{role.signups.length} / {role.slots}</span></div>
        <p>{roleTime(role)}</p>
        {role.signups.length ? <ul className="people-list">{role.signups.map(person => <li key={person.id}>{person.name}</li>)}</ul> : <p>No one signed up yet.</p>}
        <p>{role.slots - role.signups.length > 0 ? `${role.slots - role.signups.length} open slots` : 'All set. Thank you, team!'}</p>
      </article>)}</div>
      {!event.roles.length && <p className="board-state">Roles will be added soon.</p>}
      {!event.archived && <Button asChild className="dashboard-signup-link"><Link to="/">Go to event sign-ups</Link></Button>}
    </>
  }}</EventData></section>
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
export function CalendarPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const title = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay())
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))
  function move(amount: number) { setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1)) }
  return <section className="content-page"><h1>Team calendar</h1><p className="page-intro">A little look ahead. Open an event to see its team.</p>
    <div className="calendar-toolbar"><h2 aria-live="polite">{title}</h2><div className="calendar-buttons"><Button variant="outline" onClick={() => move(-1)} aria-label="Previous month">←</Button><Button variant="outline" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</Button><Button variant="outline" onClick={() => move(1)} aria-label="Next month">→</Button></div></div>
    <EventData>{allEvents => {
      const events = allEvents.filter(event => !event.archived)
      const monthEvents = events.filter(event => { const date = new Date(event.starts_at); return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear() })
      return <><div className="calendar-grid" aria-label={title}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div className="calendar-weekday" key={day}>{day}</div>)}
        {days.map(day => <div key={dayKey(day)} className={`calendar-day${day.getMonth() !== month.getMonth() ? ' outside-month' : ''}`}>
          <time dateTime={`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`} className={dayKey(day) === dayKey(new Date()) ? 'today-marker' : ''}>{day.getDate()}</time>
          {events.filter(event => dayKey(new Date(event.starts_at)) === dayKey(day)).map(event => <Link className="calendar-event" key={event.id} to={`/events/${event.id}`} aria-label={`${event.title}, ${eventDate(event.starts_at)}`}><span className="calendar-event-dot" aria-hidden="true">✦</span><span className="calendar-event-name">{event.title}</span></Link>)}
        </div>)}
      </div><h2 className="team-heading">This month’s events</h2>{monthEvents.length ? <EventLinks events={monthEvents} /> : <p className="board-state">No events this month. Try another month.</p>}<p className="calendar-timezone">Times are shown in your local time zone.</p></>
    }}</EventData>
  </section>
}
