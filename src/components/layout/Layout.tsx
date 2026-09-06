import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { AppFooterNav } from './AppFooterNav'
import { MetisVoiceModal } from '../common/MetisVoiceModal'
import { ToastContainer } from '../common/ToastContainer'
import { DevSimulationBanner } from '../auth/DevSimulationBanner'

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isInicio = location.pathname === '/'

  if (isInicio) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden pb-24">
        <DevSimulationBanner />
        <Outlet />
        <AppFooterNav />
        <MetisVoiceModal />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      {/* Persistent Developer Simulation Banner when impersonating roles */}
      <DevSimulationBanner />

      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-32">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <AppFooterNav />
      <MetisVoiceModal />
      <ToastContainer />
    </div>
  )
}
