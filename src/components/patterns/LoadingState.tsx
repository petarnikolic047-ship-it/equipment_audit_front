import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  text?: string
}

export function LoadingState({ text = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-300">
      <Loader2 className="animate-spin" size={16} />
      {text}
    </div>
  )
}
