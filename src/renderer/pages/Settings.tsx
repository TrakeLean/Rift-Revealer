import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save, AlertCircle, CheckCircle2, Download, RefreshCw, Loader2, Bell, Info } from 'lucide-react'
import type { UserConfig } from '../types'

interface SettingsProps {
  onConfigSaved?: () => void
}

export function Settings({ onConfigSaved }: SettingsProps) {
  const [config, setConfig] = useState<UserConfig>({
    username: '',
    tag_line: '',
    region: 'na1',
    riot_api_key: '',
  })
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [autoUpdateCheck, setAutoUpdateCheck] = useState(true)
  const [autoStart, setAutoStart] = useState(false)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; imported: number } | null>(null)
  const [importCancelled, setImportCancelled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notifyToxic, setNotifyToxic] = useState(true)
  const [notifyWeak, setNotifyWeak] = useState(true)
  const [notifyFriendly, setNotifyFriendly] = useState(true)
  const [notifyNotable, setNotifyNotable] = useState(true)
  const [notifyDuo, setNotifyDuo] = useState(false)

  useEffect(() => {
    loadConfig()
    loadAutoStart()

    const cleanupProgress = window.api.onImportProgress((progressData) => {
      if (!importCancelled) {
        setImportProgress(progressData)
      }
    })

    return () => {
      cleanupProgress()
    }
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const savedConfig = await window.api.getUserConfig()
      if (savedConfig) {
        setConfig(savedConfig)
        setAutoUpdateCheck(savedConfig.auto_update_check !== 0) // Default to true if not set

        // Load notification settings (default to OFF for master, but ON for individual tags except duo)
        setNotificationsEnabled(savedConfig.notifications_enabled === 1)
        setNotifyToxic(savedConfig.notify_toxic !== 0) // Default to true if not set
        setNotifyWeak(savedConfig.notify_weak !== 0)
        setNotifyFriendly(savedConfig.notify_friendly !== 0)
        setNotifyNotable(savedConfig.notify_notable !== 0)
        setNotifyDuo(savedConfig.notify_duo === 1) // Default to false
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAutoStart = async () => {
    try {
      const result = await window.api.getAutoStart()
      if (result.success) {
        setAutoStart(result.enabled)
      }
    } catch (error) {
      console.error('Failed to load auto-start setting:', error)
    }
  }

  const handleAutoUpdateToggle = async (checked: boolean) => {
    setAutoUpdateCheck(checked)
    try {
      await window.api.setAutoUpdateCheck(checked)
    } catch (error) {
      console.error('Failed to save auto-update setting:', error)
      // Revert on error
      setAutoUpdateCheck(!checked)
    }
  }

  const handleAutoStartToggle = async (checked: boolean) => {
    setAutoStart(checked)
    try {
      await window.api.setAutoStart(checked)
    } catch (error) {
      console.error('Failed to save auto-start setting:', error)
      // Revert on error
      setAutoStart(!checked)
    }
  }

  const updateNotificationSettings = async (settings: {
    enabled: boolean
    notifyToxic: boolean
    notifyWeak: boolean
    notifyFriendly: boolean
    notifyNotable: boolean
    notifyDuo: boolean
  }) => {
    try {
      await window.api.updateNotificationSettings(settings)
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    }
  }

  const handleNotificationsEnabledToggle = async (checked: boolean) => {
    setNotificationsEnabled(checked)
    await updateNotificationSettings({
      enabled: checked,
      notifyToxic,
      notifyWeak,
      notifyFriendly,
      notifyNotable,
      notifyDuo
    })
  }

  const handleNotifyToxicToggle = async (checked: boolean) => {
    setNotifyToxic(checked)
    await updateNotificationSettings({
      enabled: notificationsEnabled,
      notifyToxic: checked,
      notifyWeak,
      notifyFriendly,
      notifyNotable,
      notifyDuo
    })
  }

  const handleNotifyWeakToggle = async (checked: boolean) => {
    setNotifyWeak(checked)
    await updateNotificationSettings({
      enabled: notificationsEnabled,
      notifyToxic,
      notifyWeak: checked,
      notifyFriendly,
      notifyNotable,
      notifyDuo
    })
  }

  const handleNotifyFriendlyToggle = async (checked: boolean) => {
    setNotifyFriendly(checked)
    await updateNotificationSettings({
      enabled: notificationsEnabled,
      notifyToxic,
      notifyWeak,
      notifyFriendly: checked,
      notifyNotable,
      notifyDuo
    })
  }

  const handleNotifyNotableToggle = async (checked: boolean) => {
    setNotifyNotable(checked)
    await updateNotificationSettings({
      enabled: notificationsEnabled,
      notifyToxic,
      notifyWeak,
      notifyFriendly,
      notifyNotable: checked,
      notifyDuo
    })
  }

  const handleNotifyDuoToggle = async (checked: boolean) => {
    setNotifyDuo(checked)
    await updateNotificationSettings({
      enabled: notificationsEnabled,
      notifyToxic,
      notifyWeak,
      notifyFriendly,
      notifyNotable,
      notifyDuo: checked
    })
  }

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true)
    setUpdateStatus(null)
    try {
      const result = await window.api.checkForUpdates()
      if (result.success) {
        if (result.hasUpdate) {
          setUpdateStatus(`Update available: ${result.latestVersion}`)
          // Open download dialog
          const shouldDownload = confirm(
            `A new version is available!\n\nCurrent: ${result.currentVersion}\nLatest: ${result.latestVersion}\n\n${result.releaseName}\n\nWould you like to download it now?`
          )
          if (shouldDownload) {
            await window.api.openDownloadUrl(result.downloadUrl)
          }
        } else {
          setUpdateStatus('You are running the latest version!')
        }
      } else {
        setUpdateStatus('Failed to check for updates')
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      setUpdateStatus('Error checking for updates')
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const handleImportHistory = async () => {
    setIsImporting(true)
    setImportCancelled(false)
    setImportStatus('Fetching match IDs from Riot API...')
    setImportProgress({ current: 0, total: 100, imported: 0 })
    try {
      const result = await window.api.importMatchHistory()
      if (result.success) {
        const imported = result.data?.imported ?? result.imported ?? 0
        setImportStatus(`Successfully imported ${imported} match${imported === 1 ? '' : 'es'}!`)
        setImportProgress(null)
      } else {
        setImportStatus(result.error || 'Import failed')
        setImportProgress(null)
      }
    } catch (error) {
      console.error('Error importing match history:', error)
      setImportStatus('Error importing match history')
      setImportProgress(null)
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = () => {
    setImportCancelled(true)
    setIsImporting(false)
    setImportStatus('Import canceled (in-flight requests may still finish).')
    setImportProgress(null)
    window.api.cancelImportMatchHistory()
  }

  const handleSave = async () => {
    if (!config.username.trim()) {
      setStatus({ message: 'Username is required', type: 'error' })
      return
    }

    if (!config.tag_line.trim()) {
      setStatus({ message: 'Tag line is required', type: 'error' })
      return
    }

    if (!config.riot_api_key.trim()) {
      setStatus({ message: 'Riot API key is required', type: 'error' })
      return
    }

    setIsSaving(true)
    setStatus({ message: 'Validating configuration...', type: 'info' })

    try {
      const result = await window.api.validateAndSaveConfig(
        config.username,
        config.tag_line,
        config.region,
        config.riot_api_key
      )

      if (result.success) {
        setStatus({ message: 'Configuration saved successfully!', type: 'success' })
        onConfigSaved?.()
      } else {
        setStatus({ message: result.error || 'Failed to save configuration', type: 'error' })
      }
    } catch (error) {
      setStatus({ message: `Error: ${error}`, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const regions = [
    { value: 'na1', label: 'North America' },
    { value: 'euw1', label: 'Europe West' },
    { value: 'eun1', label: 'Europe Nordic & East' },
    { value: 'kr', label: 'Korea' },
    { value: 'br1', label: 'Brazil' },
    { value: 'la1', label: 'Latin America North' },
    { value: 'la2', label: 'Latin America South' },
    { value: 'oc1', label: 'Oceania' },
    { value: 'ru', label: 'Russia' },
    { value: 'tr1', label: 'Turkey' },
    { value: 'jp1', label: 'Japan' },
  ]

  return (
    <div className="space-y-6">
      {/* Account Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Configure your League of Legends account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Riot ID Username
            </label>
            <input
              id="username"
              type="text"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              placeholder="YourUsername"
              disabled={isLoading || isSaving}
            />
          </div>

          {/* Tag Line */}
          <div className="space-y-2">
            <label htmlFor="tagLine" className="text-sm font-medium">
              Riot ID Tag
            </label>
            <input
              id="tagLine"
              type="text"
              value={config.tag_line}
              onChange={(e) => setConfig({ ...config, tag_line: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              placeholder="NA1"
              disabled={isLoading || isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Your complete Riot ID is: <span className="font-semibold">{config.username}#{config.tag_line}</span>
            </p>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <label htmlFor="region" className="text-sm font-medium">
              Region
            </label>
            <select
              id="region"
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              disabled={isLoading || isSaving}
            >
              {regions.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              Riot API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={config.riot_api_key}
              onChange={(e) => setConfig({ ...config, riot_api_key: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-mono"
              placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              disabled={isLoading || isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://developer.riotgames.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Riot Developer Portal
              </a>
            </p>
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                status.type === 'success'
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900'
                  : status.type === 'error'
                  ? 'bg-red-950/50 text-red-400 border border-red-900'
                  : 'bg-blue-950/50 text-blue-400 border border-blue-900'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {/* Save Button */}
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardContent>
      </Card>

      {/* App Behavior Card */}
      <Card>
        <CardHeader>
          <CardTitle>App Behavior</CardTitle>
          <CardDescription>
            Configure how the app behaves on startup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-start toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-start">Start on Windows Startup</Label>
              <p className="text-xs text-muted-foreground">
                Automatically launch Rift Revealer when Windows starts
              </p>
            </div>
            <Switch
              id="auto-start"
              checked={autoStart}
              onCheckedChange={handleAutoStartToggle}
            />
          </div>

          {/* Auto-update toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-update">Automatic Update Checks</Label>
              <p className="text-xs text-muted-foreground">
                Check for updates automatically when the app starts
              </p>
            </div>
            <Switch
              id="auto-update"
              checked={autoUpdateCheck}
              onCheckedChange={handleAutoUpdateToggle}
            />
          </div>

          {/* Manual check button */}
          <div className="pt-2 space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCheckForUpdates}
                disabled={isCheckingUpdate}
                className="gap-2"
              >
                {isCheckingUpdate ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Check for Updates
                  </>
                )}
              </Button>
            </div>
            {updateStatus && (
              <div className={`text-sm p-3 rounded-md ${
                updateStatus.includes('available')
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {updateStatus}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Get notified when you encounter previously tagged players
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled">Enable Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Show desktop notifications when tagged players are detected
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationsEnabledToggle}
            />
          </div>

          {/* Tag filters */}
          <div className={`space-y-3 pt-2 ${!notificationsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium">Filter by Tag Type</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Toxic */}
            <div className="flex items-center justify-between pl-4">
              <div className="space-y-0.5">
                <Label htmlFor="notify-toxic" className="text-sm">Toxic</Label>
              </div>
              <Switch
                id="notify-toxic"
                checked={notifyToxic}
                onCheckedChange={handleNotifyToxicToggle}
                disabled={!notificationsEnabled}
              />
            </div>

            {/* Weak */}
            <div className="flex items-center justify-between pl-4">
              <div className="space-y-0.5">
                <Label htmlFor="notify-weak" className="text-sm">Weak</Label>
              </div>
              <Switch
                id="notify-weak"
                checked={notifyWeak}
                onCheckedChange={handleNotifyWeakToggle}
                disabled={!notificationsEnabled}
              />
            </div>

            {/* Friendly */}
            <div className="flex items-center justify-between pl-4">
              <div className="space-y-0.5">
                <Label htmlFor="notify-friendly" className="text-sm">Friendly</Label>
              </div>
              <Switch
                id="notify-friendly"
                checked={notifyFriendly}
                onCheckedChange={handleNotifyFriendlyToggle}
                disabled={!notificationsEnabled}
              />
            </div>

            {/* Notable */}
            <div className="flex items-center justify-between pl-4">
              <div className="space-y-0.5">
                <Label htmlFor="notify-notable" className="text-sm">Notable</Label>
              </div>
              <Switch
                id="notify-notable"
                checked={notifyNotable}
                onCheckedChange={handleNotifyNotableToggle}
                disabled={!notificationsEnabled}
              />
            </div>

            {/* Duo */}
            <div className="flex items-center justify-between pl-4">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="notify-duo" className="text-sm">Duo</Label>
                  <div
                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-muted-foreground cursor-help"
                    title="Disable this to avoid notifications when playing with friends you've tagged as 'Duo'"
                  >
                    <Info className="h-2.5 w-2.5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Off by default to avoid friend notifications</p>
              </div>
              <Switch
                id="notify-duo"
                checked={notifyDuo}
                onCheckedChange={handleNotifyDuoToggle}
                disabled={!notificationsEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manually import your last 100 matches (Riot API limit) to improve detection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={handleImportHistory}
            disabled={isImporting}
            className="gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Import Last 100 Matches
              </>
            )}
          </Button>
          {isImporting && (
            <Button
              variant="ghost"
              onClick={handleCancelImport}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Cancel Import
            </Button>
          )}

          {importProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Importing matches...</span>
                <span className="text-foreground font-medium">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200 ease-out"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {importProgress.imported} new matches saved • {importProgress.current - importProgress.imported} already in database
              </p>
            </div>
          )}

          {importStatus && (
            <div className="text-sm text-muted-foreground">
              {importStatus}
            </div>
          )}

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2">How it works:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Fetches your recent matches from Riot API (up to 100).</li>
                <li>• Stores encountered players to improve lobby detection.</li>
                <li>• Respects Riot rate limits with built-in backoff on 429s.</li>
                <li>• Run periodically to keep your encounter history fresh.</li>
                <li>• Live games auto-import while the app is open; manual import is for catching up.</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 p-3 rounded-md bg-blue-950/30 text-blue-400 border border-blue-900/50">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <strong>Import Time:</strong> Importing 100 matches can take ~60-90 seconds due to Riot rate limits and backoff on 429s. Progress updates in real time.
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
