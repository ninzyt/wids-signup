import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventModal } from '@/components/EventModal'
import { Button } from '@/components/ui/button'
import { createEvent, eventsKey, type EventDraft } from './data'

const newRole = () => ({ key: crypto.randomUUID(), name: '', start: '', end: '', slots: 1, nextDay: false })

export function CreateEventForm({ onClose, onCreated }: { onClose: () => void; onCreated: (title: string) => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [roles, setRoles] = useState(() => [newRole()])
  const mutation = useMutation({
    mutationFn: (draft: EventDraft) => createEvent(draft),
    onSuccess: async event => { await queryClient.invalidateQueries({ queryKey: eventsKey }); onCreated(event.title) },
  })
  function updateRole(key: string, patch: Partial<ReturnType<typeof newRole>>) {
    setRoles(current => current.map(role => role.key === key ? { ...role, ...patch } : role))
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!mutation.isPending) mutation.mutate({ title, date, time, location, description, roles })
  }
  return <EventModal title="Add an event" description="Make a plan, then add the roles and shifts that need a helping hand." onClose={onClose} busy={mutation.isPending}>
    <form className="signup-form create-event-form" onSubmit={submit}>
      <fieldset disabled={mutation.isPending} className="event-form-fields">
        <label htmlFor="event-name">Event name</label><input id="event-name" required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} />
        <div className="form-pair"><div><label htmlFor="event-date">Date</label><input id="event-date" type="date" required value={date} onChange={event => setDate(event.target.value)} /></div><div><label htmlFor="event-time">Event start time</label><input id="event-time" type="time" required value={time} onChange={event => setTime(event.target.value)} /></div></div>
        <label htmlFor="event-location">Location (optional)</label><input id="event-location" maxLength={240} value={location} onChange={event => setLocation(event.target.value)} />
        <label htmlFor="event-description">Details (optional)</label><textarea id="event-description" rows={3} maxLength={4000} value={description} onChange={event => setDescription(event.target.value)} />
        <h3 className="roles-title">Roles & shifts</h3><p className="form-help">Shift times use the event date and your local time zone. Setup shifts can start before the event.</p>
        {roles.map((role, index) => <fieldset className="role-editor" key={role.key}>
          <legend>Role {index + 1}</legend>
          <label htmlFor={`${role.key}-name`}>Role name</label><input id={`${role.key}-name`} required maxLength={120} value={role.name} onChange={event => updateRole(role.key, { name: event.target.value })} />
          <div className="form-pair"><div><label htmlFor={`${role.key}-start`}>Shift start</label><input id={`${role.key}-start`} type="time" required value={role.start} onChange={event => updateRole(role.key, { start: event.target.value })} /></div><div><label htmlFor={`${role.key}-end`}>Shift end</label><input id={`${role.key}-end`} type="time" required value={role.end} onChange={event => updateRole(role.key, { end: event.target.value })} /></div></div>
          <label className="checkbox-label"><input type="checkbox" checked={role.nextDay} onChange={event => updateRole(role.key, { nextDay: event.target.checked })} />Ends next day</label>
          <label htmlFor={`${role.key}-slots`}>People needed</label><input id={`${role.key}-slots`} type="number" min={1} max={1000} step={1} required value={Number.isNaN(role.slots) ? '' : role.slots} onChange={event => updateRole(role.key, { slots: event.target.valueAsNumber })} />
          <Button type="button" variant="ghost" disabled={roles.length === 1} onClick={() => setRoles(current => current.filter(item => item.key !== role.key))} aria-label={`Remove role ${index + 1}`}>Remove role</Button>
        </fieldset>)}
        <Button type="button" variant="outline" onClick={() => setRoles(current => [...current, newRole()])}>+ Add role</Button>
      </fieldset>
      {mutation.isError && <p role="alert" className="form-error">{mutation.error.message}</p>}
      <div className="modal-actions"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Creating…' : 'Create event'}</Button></div>
    </form>
  </EventModal>
}
