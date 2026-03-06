import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppRouter } from './routes/AppRouter'
import { ToastProvider } from './components/patterns/ToastProvider'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

async function bootstrap() {
  const shouldEnableMsw = import.meta.env.VITE_ENABLE_MSW !== 'false'
  if (shouldEnableMsw && 'serviceWorker' in navigator) {
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({
        serviceWorker: { url: '/mockServiceWorker.js' },
        onUnhandledRequest: import.meta.env.DEV ? 'warn' : 'bypass',
      })
      console.info('[MSW] Mock API enabled')
    } catch (error) {
      console.error('[MSW] Failed to start mock worker', error)
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </ToastProvider>
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </StrictMode>,
  )
}

bootstrap()
