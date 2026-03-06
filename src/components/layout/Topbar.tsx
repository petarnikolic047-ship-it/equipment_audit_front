import { AvatarMenu } from './AvatarMenu'
import inforceGlobe from '../../assets/brand/inforce-globe.png'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/15 bg-black/90">
      <div className="relative flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-white/20 text-slate-200 transition hover:bg-white/10 md:hidden"
          aria-label="Open navigation menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <img
          src={inforceGlobe}
          alt="Inforce globe mark"
          className="pointer-events-none absolute left-1/2 h-10 w-10 -translate-x-1/2 select-none object-contain opacity-90"
        />

        <div className="ml-auto">
          <AvatarMenu />
        </div>
      </div>
    </header>
  )
}
