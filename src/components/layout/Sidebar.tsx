import { BarChart3, Boxes, ClipboardList, FileSearch, FolderClock, Gauge, History, LayoutGrid, Logs, PackageSearch, ScanLine, Settings2, Shield, UserRound, Users } from 'lucide-react'
import whiteLogoWithTag from '../../assets/brand/white-logo-with-tag.svg'
import { ROUTE_PATHS } from '../../routes/routePaths'
import { cn } from '../../utils/cn'
import { NavigationGroup, type NavigationItemWithIcon } from './NavigationGroup'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const coreNavigation: NavigationItemWithIcon[] = [
  { id: 'dashboard', label: 'Dashboard', path: ROUTE_PATHS.DASHBOARD, icon: <Gauge size={16} /> },
  { id: 'my-equipment', label: 'My Equipment', path: ROUTE_PATHS.MY_EQUIPMENT, icon: <UserRound size={16} /> },
  { id: 'assets', label: 'Assets', path: ROUTE_PATHS.ASSETS, icon: <Boxes size={16} /> },
  { id: 'assignments', label: 'Assignments', path: ROUTE_PATHS.ASSIGNMENTS, icon: <ClipboardList size={16} /> },
  { id: 'employees', label: 'Employees', path: ROUTE_PATHS.EMPLOYEES, icon: <Users size={16} /> },
  { id: 'stocktake', label: 'Stocktake', path: ROUTE_PATHS.STOCKTAKE, icon: <ScanLine size={16} />, permission: 'STOCKTAKE_RUN' },
  { id: 'imports', label: 'Imports', path: ROUTE_PATHS.IMPORTS, icon: <PackageSearch size={16} />, permission: 'IMPORT_RUN' },
  { id: 'exports', label: 'Exports', path: ROUTE_PATHS.EXPORTS, icon: <FolderClock size={16} />, permission: 'EXPORT_RUN' },
  { id: 'reports', label: 'Reports', path: ROUTE_PATHS.REPORTS, icon: <BarChart3 size={16} />, permission: 'EXPORT_RUN' },
]

const adminNavigation: NavigationItemWithIcon[] = [
  { id: 'reference-admin', label: 'Reference Data', path: ROUTE_PATHS.REFERENCE_DATA_ADMIN, icon: <Settings2 size={16} />, permission: 'REFERENCE_MANAGE' },
  { id: 'attribute-admin', label: 'Attributes', path: ROUTE_PATHS.ATTRIBUTE_ADMIN, icon: <LayoutGrid size={16} />, permission: 'ATTRIBUTE_MANAGE' },
]

const observabilityNavigation: NavigationItemWithIcon[] = [
  { id: 'system-logs', label: 'System Logs', path: ROUTE_PATHS.SYSTEM_LOGS, icon: <Logs size={16} />, permission: 'AUDIT_VIEW' },
  { id: 'audit-events', label: 'Audit Events', path: ROUTE_PATHS.AUDIT_EVENTS, icon: <Shield size={16} />, permission: 'AUDIT_VIEW' },
  { id: 'entity-history', label: 'Entity History', path: ROUTE_PATHS.ENTITY_HISTORY, icon: <History size={16} />, permission: 'AUDIT_VIEW' },
]

const devNavigation: NavigationItemWithIcon[] = [
  { id: 'ui-playground', label: 'UI Playground', path: ROUTE_PATHS.UI_PLAYGROUND, icon: <FileSearch size={16} />, hiddenInProduction: true },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={cn('fixed inset-0 z-30 bg-black/70 md:hidden', open ? 'block' : 'hidden')}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-white/20 bg-black/95 text-slate-100 transition-transform md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="brand-camo-blue flex h-20 items-center justify-center border-b border-white/15 px-2">
          <img
            src={whiteLogoWithTag}
            alt="Inforce Your Fiercest Ally"
            className="mx-auto block h-11 w-full max-w-[180px] object-contain object-center"
          />
        </div>
        <nav className="h-[calc(100%-5rem)] space-y-6 overflow-y-auto px-3 py-4">
          <NavigationGroup title="Core" items={coreNavigation} onClose={onClose} />
          <NavigationGroup title="Admin" items={adminNavigation} onClose={onClose} />
          <NavigationGroup title="Observability" items={observabilityNavigation} onClose={onClose} />
          {import.meta.env.DEV ? <NavigationGroup title="Developer" items={devNavigation} onClose={onClose} /> : null}
        </nav>
      </aside>
    </>
  )
}
