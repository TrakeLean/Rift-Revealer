import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Download, X, Sparkles, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { Progress } from './ui/progress'

interface UpdateInfo {
  hasUpdate: boolean
  latestVersion: string
  currentVersion: string
  releaseNotes: string
  releaseName: string
  releaseDate?: string
}

interface DownloadProgress {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Listen for update available
    const cleanupAvailable = window.api.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateInfo(info)
      setIsOpen(true)
      setIsDownloading(false)
      setIsDownloaded(false)
      setError(null)
    })

    // Listen for download progress
    const cleanupProgress = window.api.onUpdateDownloadProgress((progress: DownloadProgress) => {
      setDownloadProgress(progress)
    })

    // Listen for download complete
    const cleanupDownloaded = window.api.onUpdateDownloaded(() => {
      setIsDownloading(false)
      setIsDownloaded(true)
      setDownloadProgress(null)
    })

    // Listen for errors
    const cleanupError = window.api.onUpdateError((errorData: { error: string }) => {
      setError(errorData.error)
      setIsDownloading(false)
    })

    return () => {
      cleanupAvailable()
      cleanupProgress()
      cleanupDownloaded()
      cleanupError()
    }
  }, [])

  const handleDownload = async () => {
    setIsDownloading(true)
    setError(null)
    try {
      await window.api.downloadUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download update')
      setIsDownloading(false)
    }
  }

  const handleInstall = async () => {
    try {
      await window.api.installUpdate()
      // App will restart automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install update')
    }
  }

  const handleClose = () => {
    if (!isDownloading) {
      setIsOpen(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s'
  }

  if (!updateInfo) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[550px] border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            {isDownloaded ? 'Update Ready!' : 'New Update Available!'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isDownloaded
              ? 'The update has been downloaded and is ready to install'
              : 'A new version of Rift Revealer is ready to download'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Version comparison with visual upgrade indicator */}
          <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className="text-lg font-bold text-zinc-400">v{updateInfo.currentVersion}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Latest</p>
              <p className="text-lg font-bold text-primary">v{updateInfo.latestVersion}</p>
            </div>
          </div>

          {/* Release name with badge */}
          {updateInfo.releaseName && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded">
                NEW
              </span>
              <p className="font-semibold text-foreground">{updateInfo.releaseName}</p>
            </div>
          )}

          {/* Release notes */}
          {updateInfo.releaseNotes && (
            <div className="rounded-lg border border-border bg-card p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-muted-foreground font-semibold mb-2">What's New:</p>
              <div className="text-sm text-foreground whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                {updateInfo.releaseNotes.slice(0, 400)}
                {updateInfo.releaseNotes.length > 400 && '...'}
              </div>
            </div>
          )}

          {/* Download progress */}
          {isDownloading && downloadProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Downloading...</span>
                <span className="text-foreground">
                  {formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}
                  {' '}({formatSpeed(downloadProgress.bytesPerSecond)})
                </span>
              </div>
              <Progress value={downloadProgress.percent} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {Math.round(downloadProgress.percent)}%
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!isDownloaded && !isDownloading && (
            <>
              <Button variant="ghost" onClick={handleClose} className="gap-2">
                <X className="h-4 w-4" />
                Remind Me Later
              </Button>
              <Button onClick={handleDownload} className="gap-2 bg-primary hover:bg-primary/90">
                <Download className="h-4 w-4" />
                Download Update
              </Button>
            </>
          )}

          {isDownloading && (
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Downloading...
            </Button>
          )}

          {isDownloaded && (
            <>
              <Button variant="ghost" onClick={handleClose} className="gap-2">
                <X className="h-4 w-4" />
                Install Later
              </Button>
              <Button onClick={handleInstall} className="gap-2 bg-primary hover:bg-primary/90">
                <CheckCircle className="h-4 w-4" />
                Install & Restart
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
