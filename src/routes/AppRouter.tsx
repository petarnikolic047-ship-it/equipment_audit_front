import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import DashboardPage from '../pages/DashboardPage'
import AssetsPage from '../pages/AssetsPage'
import EmployeesPage from '../pages/EmployeesPage'
import AssignmentsPage from '../pages/AssignmentsPage'
import ImportsPage from '../pages/ImportsPage'
import ExportsPage from '../pages/ExportsPage'
import ReportsPage from '../pages/ReportsPage'
import ReferenceDataAdminPage from '../pages/ReferenceDataAdminPage'
import AttributeAdminPage from '../pages/AttributeAdminPage'
import AuditEventsPage from '../pages/AuditEventsPage'
import EntityHistoryPage from '../pages/EntityHistoryPage'
import LoginPage from '../pages/LoginPage'
import UIPlaygroundPage from '../pages/UIPlaygroundPage'
import SystemLogsPage from '../pages/SystemLogsPage'
import StocktakePage from '../pages/StocktakePage'
import MyEquipmentPage from '../pages/MyEquipmentPage'
import { ROUTE_PATHS } from './routePaths'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGuard } from './RoleGuard'

const lifecycleRoles = ['ADMIN', 'MVP', 'MANAGER', 'OWNER', 'READ_ONLY', 'EMPLOYEE'] as const
const employeesPageRoles = ['ADMIN', 'MVP', 'MANAGER', 'OWNER', 'READ_ONLY'] as const
const dashboardRoles = ['ADMIN', 'MANAGER', 'OWNER', 'READ_ONLY'] as const

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route
          path={ROUTE_PATHS.DASHBOARD}
          element={
            <RoleGuard roles={[...dashboardRoles]}>
              <DashboardPage />
            </RoleGuard>
          }
        />
        <Route path={ROUTE_PATHS.MY_EQUIPMENT} element={<MyEquipmentPage />} />
        <Route
          path={ROUTE_PATHS.ASSETS}
          element={
            <RoleGuard roles={[...lifecycleRoles]}>
              <AssetsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.ASSET_DETAIL}
          element={
            <RoleGuard roles={[...lifecycleRoles]}>
              <AssetsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.ASSET_DETAIL_FULL}
          element={
            <RoleGuard roles={[...lifecycleRoles]}>
              <AssetsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.EMPLOYEES}
          element={
            <RoleGuard roles={[...employeesPageRoles]}>
              <EmployeesPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.EMPLOYEE_DETAIL}
          element={
            <RoleGuard roles={[...employeesPageRoles]}>
              <EmployeesPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.EMPLOYEE_DETAIL_FULL}
          element={
            <RoleGuard roles={[...employeesPageRoles]}>
              <EmployeesPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.ASSIGNMENTS}
          element={
            <RoleGuard roles={[...lifecycleRoles]}>
              <AssignmentsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.ASSIGNMENT_DETAIL}
          element={
            <RoleGuard roles={[...lifecycleRoles]}>
              <AssignmentsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.ASSIGNMENT_DETAIL_FULL}
          element={
            <RoleGuard roles={[...lifecycleRoles]}>
              <AssignmentsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.STOCKTAKE}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER', 'OWNER']}>
              <StocktakePage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.IMPORTS}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER', 'OWNER']}>
              <ImportsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.IMPORT_DETAIL}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER', 'OWNER']}>
              <ImportsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.EXPORTS}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER', 'OWNER']}>
              <ExportsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.EXPORT_DETAIL}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER', 'OWNER']}>
              <ExportsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.REPORTS}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER', 'OWNER']}>
              <ReportsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.REFERENCE_DATA_ADMIN}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER']}>
              <ReferenceDataAdminPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.ATTRIBUTE_ADMIN}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER']}>
              <AttributeAdminPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.SYSTEM_LOGS}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER']}>
              <SystemLogsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.AUDIT_EVENTS}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER']}>
              <AuditEventsPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.ENTITY_HISTORY}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER']}>
              <EntityHistoryPage />
            </RoleGuard>
          }
        />
        <Route
          path={ROUTE_PATHS.UI_PLAYGROUND}
          element={
            <RoleGuard roles={['ADMIN', 'MANAGER', 'OWNER']}>
              <UIPlaygroundPage />
            </RoleGuard>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={ROUTE_PATHS.DASHBOARD} replace />} />
    </Routes>
  )
}
