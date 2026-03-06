import { useCallback, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { X } from 'lucide-react'
import { Button } from '../primitives/Button'
import { ToastContext, type ToastVariant } from './toastContext'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

const colors: Record<ToastVariant, string> = {
  success: 'bg-brand-500 text-ink-900',
  error: 'bg-[#ef493d] text-white',
  info: 'bg-signal-700 text-white',
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.round(Math.random() * 1000)
    setToasts((current) => [...current, { id, message, variant }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto flex items-center justify-between rounded-sm px-3 py-2 text-sm shadow-lg ${colors[toast.variant]}`}>
            <span>{toast.message}</span>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0 text-current hover:bg-black/10"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            >
              <X size={12} />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
