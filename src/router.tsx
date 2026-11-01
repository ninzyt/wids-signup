import { createHashRouter, Link } from 'react-router-dom'
import App from '@/App'
import { CalendarPage, EventDashboard, EventsPage } from '@/features/events/EventPages'
import { Button } from '@/components/ui/button'

// All routing lives here. For a host with SPA rewrites, replace
// createHashRouter with createBrowserRouter and set basename if hosted below /.
export const router = createHashRouter([
  { path: '/', element: <App /> },
  { path: '/calendar', element: <App><CalendarPage /></App> },
  { path: '/events', element: <App><EventsPage /></App> },
  { path: '/events/:eventId', element: <App><EventDashboard /></App> },
  {
    path: '*',
    element: (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-5 text-center text-foreground">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">This page isn’t part of Women in Data Science yet.</p>
        <Button asChild><Link to="/">Back to WiDS</Link></Button>
      </main>
    ),
  },
])
