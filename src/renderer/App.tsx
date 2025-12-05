import { useState, useEffect } from 'react'
import { Settings as SettingsPage } from './pages/Settings'
import { LobbyAnalysis } from './pages/LobbyAnalysis'
import { Button } from './components/ui/button'
import { Home, Minus, Square, X, Settings as SettingsIcon } from 'lucide-react'
import { cn } from './lib/utils'
import ErrorBoundary from './components/ErrorBoundary'
import { UpdateNotification } from './components/UpdateNotification'

type Page = 'lobby' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('lobby')
  const [appVersion, setAppVersion] = useState<string>('...')

  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion)
  }, [])

  const navigationItems = [
    { id: 'lobby' as Page, label: 'Lobby Analysis', icon: Home },
    { id: 'settings' as Page, label: 'Settings', icon: SettingsIcon },
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Update Notification Dialog */}
      <UpdateNotification />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Draggable top bar with window controls */}
        <div
          className="sticky top-0 z-[100] flex items-center justify-between px-4 py-2 bg-background/70 backdrop-blur-sm border-b border-border/40"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src="./logo.png"
                alt="Rift Revealer Logo"
                className="h-10 w-10 opacity-80"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                title={`Version ${appVersion}`}
              />
              <div>
                <h1 className="text-2xl font-bold">Rift Revealer</h1>
                <p className="text-xs text-muted-foreground">
                  {navigationItems.find((item) => item.id === currentPage)?.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setCurrentPage(item.id)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Window controls - non-draggable */}
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
          {/* Page Content */}
          <ErrorBoundary key={currentPage}>
            {currentPage === 'lobby' && <LobbyAnalysis />}
            {currentPage === 'settings' && <SettingsPage />}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

export default App
