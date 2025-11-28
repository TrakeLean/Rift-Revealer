import { useState } from 'react'
import { Settings as SettingsPage } from './pages/Settings'
import { MatchHistory } from './pages/MatchHistory'
import { LobbyAnalysis } from './pages/LobbyAnalysis'
import { Button } from './components/ui/button'
import { Home, Settings, History } from 'lucide-react'
import { cn } from './lib/utils'
import ErrorBoundary from './components/ErrorBoundary'

type Page = 'lobby' | 'history' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('lobby')

  const navigationItems = [
    { id: 'lobby' as Page, label: 'Lobby Analysis', icon: Home },
    { id: 'history' as Page, label: 'Match History', icon: History },
    { id: 'settings' as Page, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6">
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
              src="/logo.png"
              alt="Rift Revealer Logo"
              className="h-16 w-16 opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            V1.0.0 - Made by 0xTrk
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {navigationItems.find((item) => item.id === currentPage)?.label}
            </h2>
          </div>

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
