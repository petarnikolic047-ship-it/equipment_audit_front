import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/authStore'
import { canRoleAccessPath } from '../../features/auth/access'
import { hasPermission } from '../../features/auth/permissions'
import type { NavigationItem } from '../../types/navigation'
import { cn } from '../../utils/cn'

export type NavigationItemWithIcon = NavigationItem & { icon: JSX.Element }

interface NavigationGroupProps {
  title: string
  items: NavigationItemWithIcon[]
  onClose: () => void
}

export function NavigationGroup({ title, items, onClose }: NavigationGroupProps) {
  const permissions = useAuthStore((state) => state.permissions)
  const role = useAuthStore((state) => state.role)
  const visibleItems = items.filter(
    (item) => hasPermission(permissions, item.permission) && canRoleAccessPath(role, item.path),
  )

  if (visibleItems.length === 0) return null

  return (
    <>
      <p className="brand-display px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-400">{title}</p>
      <ul className="mt-2 space-y-1">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-semibold transition',
                  isActive
                    ? 'border-signal-500/70 bg-signal-500/20 text-signal-100'
                    : 'border-transparent text-slate-300 hover:border-white/20 hover:bg-white/5',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </>
  )
}
