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
import { Download, X } from 'lucide-react'

interface UpdateInfo {
  hasUpdate: boolean
  latestVersion: string
  currentVersion: string
  downloadUrl: string
  releaseNotes: string
  releaseName: string
}

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const cleanup = window.api.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateInfo(info)
      setIsOpen(true)
    })

    return cleanup
  }, [])

  const handleDownload = async () => {
    if (updateInfo?.downloadUrl) {
      await window.api.openDownloadUrl(updateInfo.downloadUrl)
      setIsOpen(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (!updateInfo) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Update Available!
          </DialogTitle>
          <DialogDescription>
            A new version of Rift Revealer is available
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Current Version</p>
              <p className="font-semibold">{updateInfo.currentVersion}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Latest Version</p>
              <p className="font-semibold text-primary">{updateInfo.latestVersion}</p>
            </div>
          </div>

          {updateInfo.releaseName && (
            <div>
              <p className="text-sm font-semibold mb-1">{updateInfo.releaseName}</p>
            </div>
          )}

          {updateInfo.releaseNotes && (
            <div className="max-h-40 overflow-y-auto rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {updateInfo.releaseNotes.slice(0, 300)}
                {updateInfo.releaseNotes.length > 300 && '...'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X className="h-4 w-4" />
            Later
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
