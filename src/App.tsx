import React from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './lib/ToastContext'
import { Layout } from './components/layout/Layout'
import { AuthGuard } from './components/auth/AuthGuard'
import { useAuth } from './hooks/useAuth'
import { DevRoleSwitcherFloating } from './components/dev/DevRoleSwitcherFloating'

// Specialized Portal Pages
import { DeveloperAuthPage } from './pages/DeveloperAuthPage'
import { DeveloperDashboardPage } from './pages/DeveloperDashboardPage'
import { GeneralAccessPortalPage } from './pages/GeneralAccessPortalPage'
import { PortalClientePage } from './pages/PortalClientePage'
import { GestionEmpleadosPage } from './pages/GestionEmpleadosPage'

// Workshop ERP Pages
import { InicioPage } from './pages/InicioPage'
import { DashboardPage } from './pages/DashboardPage'
import { ClientesPage } from './pages/ClientesPage'
import { VehiculosPage } from './pages/VehiculosPage'
import { SolicitudesPage } from './pages/SolicitudesPage'
import { PresupuestosPage } from './pages/PresupuestosPage'
import { ListadoPreciosPage } from './pages/ListadoPreciosPage'
import { CitasPage } from './pages/CitasPage'
import { ReparacionesPage } from './pages/ReparacionesPage'
import { ExpedientesPage } from './pages/ExpedientesPage'
import { FacturasPage } from './pages/FacturasPage'
import { BalancesPage } from './pages/BalancesPage'
import { ConfiguracionPage } from './pages/ConfiguracionPage'
import { MetisIAPage } from './pages/MetisIAPage'

/**
 * Root Entry Gate:
 * In case of no active session or initial development access,
 * prioritize and redirect directly to Developer Portal Authentication (/dev-auth).
 */
const RootEntryGate: React.FC = () => {
  const { perfil, rolActual } = useAuth()

  if (!perfil) {
    // No active session -> Prioritize Developer Authentication as requested
    return <Navigate to="/dev-auth" replace />
  }

  // If logged in as client -> go to client portal
  if (rolActual === 'CLIENTE') {
    return <Navigate to="/cliente" replace />
  }

  // For Developer, Usuario or Autorizado -> render workshop dashboard
  return <InicioPage />
}

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <DevRoleSwitcherFloating />
        <Routes>
          {/* Public & Developer Direct Portals (No Workshop Layout) */}
          <Route path="/dev-auth" element={<DeveloperAuthPage />} />
          
          <Route 
            path="/dev" 
            element={
              <AuthGuard allowedRoles={['DESARROLLADOR']}>
                <DeveloperDashboardPage />
              </AuthGuard>
            } 
          />

          <Route path="/portal" element={<GeneralAccessPortalPage />} />

          <Route 
            path="/cliente" 
            element={
              <AuthGuard allowedRoles={['CLIENTE', 'DESARROLLADOR', 'USUARIO', 'AUTORIZADO']}>
                <PortalClientePage />
              </AuthGuard>
            } 
          />

          {/* Workshop ERP Application (With Layout, Header, Sidebar & Simulation Banner) */}
          <Route path="/" element={<Layout />}>
            {/* Root Route: Prioritizes Developer Auth if no session */}
            <Route index element={<RootEntryGate />} />

            <Route 
              path="clientes" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']} requiredPermission="clientes">
                  <ClientesPage />
                </AuthGuard>
              } 
            />

            <Route 
              path="vehiculos" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']} requiredPermission="vehiculos">
                  <VehiculosPage />
                </AuthGuard>
              } 
            />

            <Route 
              path="solicitudes" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']}>
                  <SolicitudesPage />
                </AuthGuard>
              } 
            />

            <Route 
              path="presupuestos" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']} requiredPermission="presupuestos_crear">
                  <PresupuestosPage />
                </AuthGuard>
              } 
            />

            <Route 
              path="tarifas" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']}>
                  <ListadoPreciosPage />
                </AuthGuard>
              } 
            />

            <Route 
              path="expedientes" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']} requiredPermission="expedientes">
                  <ExpedientesPage />
                </AuthGuard>
              } 
            />

            <Route 
              path="citas" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']} requiredPermission="citas">
                  <CitasPage />
                </AuthGuard>
              } 
            />

            <Route 
              path="reparaciones" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']} requiredPermission="reparaciones">
                  <ReparacionesPage />
                </AuthGuard>
              } 
            />

            <Route 
              path="facturas" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']} requiredPermission="facturas_ver">
                  <FacturasPage />
                </AuthGuard>
              } 
            />

            {/* Balances & Fiscal: strictly for Usuario (Dueño) and Desarrollador */}
            <Route 
              path="balances" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO']}>
                  <BalancesPage />
                </AuthGuard>
              } 
            />

            {/* Employee Management: strictly for Usuario (Dueño) and Desarrollador */}
            <Route 
              path="empleados" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO']}>
                  <GestionEmpleadosPage />
                </AuthGuard>
              } 
            />

            <Route 
              path="metis" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO', 'AUTORIZADO']}>
                  <MetisIAPage />
                </AuthGuard>
              } 
            />

            {/* Workshop Configuration: strictly for Usuario (Dueño) and Desarrollador */}
            <Route 
              path="configuracion" 
              element={
                <AuthGuard allowedRoles={['DESARROLLADOR', 'USUARIO']}>
                  <ConfiguracionPage />
                </AuthGuard>
              } 
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}
