export type Signup = { id: string; role_id: string; name: string; created_at: string }
export type EventRole = { id: string; name: string; slots: number; starts_at?: string; ends_at?: string; signups: Signup[] }
export type TeamEvent = { id: string; title: string; description: string; starts_at: string; location: string; archived?: boolean; roles: EventRole[] }
export type EventDraft = { title: string; date: string; time: string; location: string; description: string; roles: { name: string; start: string; end: string; nextDay: boolean; slots: number }[] }
export const eventsKey = ['events'] as const
export const LOCAL_EVENTS_KEY = 'wids.events.v1'
export const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ')
export const hasSpace = (role: EventRole) => role.signups.length < role.slots

function validEvents(value: unknown): value is TeamEvent[] {
  if (!Array.isArray(value)) return false
  return value.every(event => event && typeof event.id === 'string' && typeof event.title === 'string'
    && typeof event.description === 'string' && typeof event.location === 'string' && Number.isFinite(Date.parse(event.starts_at))
    && (event.archived === undefined || typeof event.archived === 'boolean')
    && Array.isArray(event.roles) && event.roles.every((role: EventRole) => role && typeof role.id === 'string'
      && typeof role.name === 'string' && Number.isInteger(role.slots) && role.slots > 0
      && (!role.starts_at || Number.isFinite(Date.parse(role.starts_at))) && (!role.ends_at || Number.isFinite(Date.parse(role.ends_at)))
      && Array.isArray(role.signups) && role.signups.every(person => person && typeof person.id === 'string'
        && typeof person.role_id === 'string' && typeof person.name === 'string' && Number.isFinite(Date.parse(person.created_at)))))
}

function readEvents(): TeamEvent[] {
  let raw: string | null
  try { raw = localStorage.getItem(LOCAL_EVENTS_KEY) } catch { throw new Error('Browser storage is unavailable. Allow site storage to use this local MVP.') }
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!validEvents(parsed)) throw new Error('Invalid data')
    return parsed
  } catch { throw new Error('Saved event data could not be read. It has been kept intact; do not clear browser storage if you need to recover it.') }
}

// All writes re-read current data under an origin-wide lock, including other tabs.
// This module is the storage boundary to replace with Supabase later.
async function updateEvents<T>(change: (events: TeamEvent[]) => T): Promise<T> {
  const write = () => {
    const events = readEvents()
    const result = change(events)
    try { localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events)) }
    catch { throw new Error('Couldn’t save your changes. Browser storage may be full or blocked.') }
    window.dispatchEvent(new Event('wids:events-changed'))
    return result
  }
  return navigator.locks ? navigator.locks.request(LOCAL_EVENTS_KEY, write) : write()
}

export async function fetchEvents(): Promise<TeamEvent[]> {
  return readEvents().sort((a, b) => a.starts_at.localeCompare(b.starts_at))
}

function localDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Enter a valid date and time.')
  const result = new Date(`${date}T${time}:00`)
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  if (!Number.isFinite(result.getTime()) || result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day || result.getHours() !== hour || result.getMinutes() !== minute) {
    throw new Error('That date or time does not exist in your local time zone. Choose another time.')
  }
  return result
}

export async function createEvent(draft: EventDraft): Promise<TeamEvent> {
  const title = normalizeName(draft.title)
  if (!title || title.length > 160) throw new Error('Enter an event name (1–160 characters).')
  const starts = localDateTime(draft.date, draft.time)
  if (!draft.roles.length) throw new Error('Add at least one role.')
  const roles = draft.roles.map((role, index): EventRole => {
    const name = normalizeName(role.name)
    if (!name || name.length > 120) throw new Error(`Enter a name for role ${index + 1} (1–120 characters).`)
    if (!Number.isInteger(role.slots) || role.slots < 1 || role.slots > 1000) throw new Error(`People needed for role ${index + 1} must be a whole number from 1 to 1000.`)
    const start = localDateTime(draft.date, role.start)
    const end = localDateTime(draft.date, role.end)
    if (role.nextDay) end.setDate(end.getDate() + 1)
    if (end <= start) throw new Error(`Role ${index + 1} must end after it starts. For overnight shifts, select “Ends next day”.`)
    return { id: crypto.randomUUID(), name, slots: role.slots, starts_at: start.toISOString(), ends_at: end.toISOString(), signups: [] }
  })
  const event: TeamEvent = { id: crypto.randomUUID(), title, starts_at: starts.toISOString(), location: draft.location.trim(), description: draft.description.trim(), archived: false, roles }
  return updateEvents(events => { events.push(event); return event })
}

export async function archiveEvent(id: string, archived: boolean): Promise<void> {
  return updateEvents(events => {
    const event = events.find(item => item.id === id)
    if (!event) throw new Error('This event is no longer available.')
    event.archived = archived
  })
}

export async function saveSignup(roleId: string, name: string): Promise<Signup> {
  return updateEvents(events => {
    const event = events.find(item => item.roles.some(role => role.id === roleId))
    const role = event?.roles.find(item => item.id === roleId)
    if (!event || event.archived || !role) throw new Error('This event is archived or no longer available.')
    const person = normalizeName(name)
    if (!person || Array.from(person).length > 80) throw new Error('Enter your name (1–80 characters).')
    if (role.signups.some(item => normalizeName(item.name).toLowerCase() === person.toLowerCase())) throw new Error('That name is already signed up for this role.')
    if (!hasSpace(role)) throw new Error('This role is full. Please choose another role.')
    const signup = { id: crypto.randomUUID(), role_id: roleId, name: person, created_at: new Date().toISOString() }
    role.signups.push(signup)
    return signup
  })
}

export function eventDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value))
}

export function roleTime(role: EventRole) {
  if (!role.starts_at || !role.ends_at) return 'Time to be confirmed'
  const start = new Date(role.starts_at), end = new Date(role.ends_at)
  const time = (value: Date) => value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${time(start)} – ${time(end)}${start.toDateString() !== end.toDateString() ? ' (next day)' : ''}`
}
