import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save, AlertCircle, CheckCircle2, Download, RefreshCw } from 'lucide-react'
import type { UserConfig } from '../types'

interface SettingsProps {
  onConfigSaved?: () => void
}

export function Settings({ onConfigSaved }: SettingsProps) {
  const [config, setConfig] = useState<UserConfig>({
    summoner_name: '',
    region: 'na1',
    riot_api_key: '',
  })
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [autoUpdateCheck, setAutoUpdateCheck] = useState(true)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const savedConfig = await window.api.getUserConfig()
      if (savedConfig) {
        setConfig(savedConfig)
        setAutoUpdateCheck(savedConfig.auto_update_check !== 0) // Default to true if not set
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setIsLoading(false)
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

  const handleSave = async () => {
    if (!config.summoner_name.trim()) {
      setStatus({ message: 'Summoner name is required', type: 'error' })
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
        config.summoner_name,
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
          {/* Summoner Name */}
          <div className="space-y-2">
            <label htmlFor="summonerName" className="text-sm font-medium">
              Summoner Name
            </label>
            <input
              id="summonerName"
              type="text"
              value={config.summoner_name}
              onChange={(e) => setConfig({ ...config, summoner_name: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              placeholder="Enter your summoner name"
              disabled={isLoading || isSaving}
            />
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

      {/* Update Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>App Updates</CardTitle>
          <CardDescription>
            Manage automatic update checks and download new versions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="pt-2">
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
            {updateStatus && (
              <p className="text-sm text-muted-foreground mt-2">{updateStatus}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
