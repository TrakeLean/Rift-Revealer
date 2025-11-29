import { useState, useEffect } from 'react'
import { Settings as SettingsPage } from './pages/Settings'
import { MatchHistory } from './pages/MatchHistory'
import { LobbyAnalysis } from './pages/LobbyAnalysis'
import { Button } from './components/ui/button'
import { Home, Settings, History, Minus, Square, X } from 'lucide-react'
import { cn } from './lib/utils'
import ErrorBoundary from './components/ErrorBoundary'
import { UpdateNotification } from './components/UpdateNotification'

type Page = 'lobby' | 'history' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('lobby')
  const [appVersion, setAppVersion] = useState<string>('...')

  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion)
  }, [])

  const navigationItems = [
    { id: 'lobby' as Page, label: 'Lobby Analysis', icon: Home },
    { id: 'history' as Page, label: 'Match History', icon: History },
    { id: 'settings' as Page, label: 'Settings', icon: Settings },
  ]

  const handleMinimize = () => {
    window.api.windowMinimize();
  };

  const handleMaximize = () => {
    window.api.windowMaximize();
  };

  const handleClose = () => {
    window.api.windowClose();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Update Notification Dialog */}
      <UpdateNotification />

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          <h1 className="text-2xl font-bold">Rift Revealer</h1>
          <p className="text-xs text-muted-foreground mt-1">
            League of Legends Encounter Tracker
          </p>
        </div>

        <nav className="px-3 space-y-1 flex-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive && 'bg-secondary'
                )}
                onClick={() => setCurrentPage(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>

        {/* Footer with Logo */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex justify-center">
            <img
              src="./logo.png"
              alt="Rift Revealer Logo"
              className="h-16 w-16 opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            v{appVersion} - Made by TrakeLean
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Draggable top bar with window controls */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          <h2 className="text-2xl font-bold">
            {navigationItems.find((item) => item.id === currentPage)?.label}
          </h2>

          {/* Window controls - non-draggable */}
          <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button
              onClick={handleMinimize}
              className="h-8 w-10 flex items-center justify-center hover:bg-zinc-800 transition-colors rounded"
              aria-label="Minimize"
            >
              <Minus className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={handleMaximize}
              className="h-8 w-10 flex items-center justify-center hover:bg-zinc-800 transition-colors rounded"
              aria-label="Maximize"
            >
              <Square className="w-3.5 h-3.5 text-zinc-400" />
            </button>
            <button
              onClick={handleClose}
              className="h-8 w-10 flex items-center justify-center hover:bg-red-600 transition-colors rounded group"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-zinc-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          {/* Page Content */}
          <ErrorBoundary key={currentPage}>
            {currentPage === 'lobby' && <LobbyAnalysis />}
            {currentPage === 'history' && <MatchHistory />}
            {currentPage === 'settings' && <SettingsPage />}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

export default App
