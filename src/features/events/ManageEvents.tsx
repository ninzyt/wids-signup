import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { archiveEvent, eventDate, eventsKey, roleTime, type TeamEvent } from './data'

export function ArchiveButton({ event }: { event: TeamEvent }) {
  const client = useQueryClient()
  const mutation = useMutation({ mutationFn: () => archiveEvent(event.id, !event.archived), onSuccess: () => client.invalidateQueries({ queryKey: eventsKey }) })
  return <div className="archive-action"><Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Saving…' : event.archived ? 'Restore event' : 'Archive event'}</Button>{mutation.isError && <p role="alert" className="form-error">{mutation.error.message}</p>}</div>
}

function ScheduleCard({ event, index }: { event: TeamEvent; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const filled = event.roles.reduce((count, role) => count + role.signups.length, 0)
  const slots = event.roles.reduce((count, role) => count + role.slots, 0)
  return <article className={`schedule-card feature-card ${['card-lavender', 'card-blue', 'card-mint'][index % 3]} ${expanded ? 'is-expanded' : ''}`}>
    <div className="schedule-card-heading"><h2><Link to={`/events/${event.id}`}>{event.title}</Link></h2><Button variant="ghost" size="icon" aria-label={`${expanded ? 'Minimize' : 'Expand'} ${event.title}`} aria-expanded={expanded} aria-controls={`schedule-${event.id}`} onClick={() => setExpanded(!expanded)}>{expanded ? '−' : '+'}</Button></div>
    <p className="schedule-date">{eventDate(event.starts_at)}</p><p className="schedule-location">{event.location || 'Location to be confirmed'}</p>
    <p className="schedule-count">{event.roles.length} roles · {filled} / {slots} slots filled{event.archived ? ' · Archived' : ''}</p>
    {expanded && <div className="schedule-details" id={`schedule-${event.id}`} tabIndex={0} aria-label={`Schedule for ${event.title}`}>
      {event.description && <p className="full-description">{event.description}</p>}
      <ul className="role-list">{event.roles.map(role => <li key={role.id}><div className="role-heading"><strong>{role.name}</strong><span className="slot-count">{role.signups.length} / {role.slots}</span></div><p>{roleTime(role)}</p><p>{role.signups.length ? role.signups.map(person => person.name).join(', ') : 'No one signed up yet.'}</p></li>)}</ul>
    </div>}
    <div className="schedule-actions"><Link className="schedule-open" to={`/events/${event.id}`}>Full details →</Link><ArchiveButton event={event} /></div>
  </article>
}

export function ManageEvents({ events }: { events: TeamEvent[] }) {
  const [archived, setArchived] = useState(false)
  const visible = events.filter(event => Boolean(event.archived) === archived)
  return <><div className="event-filters" aria-label="Event filter"><Button variant={archived ? 'outline' : 'default'} aria-pressed={!archived} onClick={() => setArchived(false)}>Active ({events.filter(event => !event.archived).length})</Button><Button variant={archived ? 'default' : 'outline'} aria-pressed={archived} onClick={() => setArchived(true)}>Archived ({events.filter(event => event.archived).length})</Button></div>
    {visible.length ? <div className="schedule-grid">{visible.map((event, index) => <ScheduleCard key={event.id} event={event} index={index} />)}</div> : <p className="board-state">{archived ? 'No archived events.' : 'No active events yet. Add an event to get started.'}</p>}
  </>
}
