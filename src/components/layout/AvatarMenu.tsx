import { ChevronDown, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../features/auth/authStore'

export function AvatarMenu() {
  const [open, setOpen] = useState(false)
  const userInfo = useAuthStore((state) => state.userInfo)
  const role = useAuthStore((state) => state.role)
  const logout = useAuthStore((state) => state.logout)
  const initials = `${userInfo?.fullName?.split(' ')[0]?.[0] ?? 'U'}${userInfo?.fullName?.split(' ')[1]?.[0] ?? 'S'}`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-sm border border-white/20 bg-white/5 px-2 py-1.5"
      >
        <div className="grid h-8 w-8 place-items-center rounded-sm bg-brand-500 text-sm font-bold text-ink-900">{initials}</div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold text-slate-100">{userInfo?.fullName ?? 'User'}</p>
          <p className="brand-display text-[10px] tracking-[0.15em] text-slate-300">{role ?? 'Unknown'}</p>
        </div>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-44 rounded-sm border border-white/20 bg-black p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              logout()
              window.location.assign('/login')
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-slate-100 hover:bg-white/10"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}
