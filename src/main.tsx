import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import './index.css'

// Set to false to restore standard browser cursors everywhere.
const CUSTOM_CURSOR = true
document.documentElement.classList.toggle('custom-cursor', CUSTOM_CURSOR)

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 10000, retry: 1 } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider></StrictMode>,
)
