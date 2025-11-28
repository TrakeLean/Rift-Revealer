import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export function MatchHistory() {
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number; imported: number } | null>(null)

  useEffect(() => {
    // Listen for progress updates from main process
    const cleanup = window.api.onImportProgress((progressData) => {
      setProgress(progressData)
    })

    return cleanup
  }, [])

  const handleImport = async () => {
    setIsImporting(true)
    setStatus({ message: 'Fetching match IDs from Riot API...', type: 'info' })
    setProgress({ current: 0, total: 100, imported: 0 })

    try {
      const result = await window.api.importMatchHistory()

      if (result.success) {
        setStatus({
          message: `Successfully imported ${result.imported} matches!`,
          type: 'success',
        })
        setProgress(null)
      } else {
        setStatus({ message: result.error || 'Import failed', type: 'error' })
        setProgress(null)
      }
    } catch (error) {
      setStatus({ message: `Error: ${error}`, type: 'error' })
      setProgress(null)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Match History</CardTitle>
          <CardDescription>
            Import your last 100 matches (maximum allowed by Riot API) to build your encounter database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Import Button */}
          <div className="space-y-2">
            <Button
              size="lg"
              onClick={handleImport}
              disabled={isImporting}
              className="w-full gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing Matches...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Import Last 100 Matches
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will fetch the maximum 100 matches allowed by the Riot API. First import may take 1-2 minutes.
            </p>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Importing matches...</span>
                <span className="text-foreground font-medium">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200 ease-out"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {progress.imported} matches saved successfully
              </p>
            </div>
          )}

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
              ) : status.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {/* Info Card */}
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2">How it works:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Fetches your recent ranked matches from Riot API</li>
                <li>• Stores all players you've encountered in the database</li>
                <li>• Enables instant detection when you meet them again</li>
                <li>• Run this periodically to keep your data up to date</li>
              </ul>
            </CardContent>
          </Card>

          {/* Rate Limit Info */}
          <div className="flex items-start gap-2 p-3 rounded-md bg-blue-950/30 text-blue-400 border border-blue-900/50">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <strong>Import Time:</strong> Importing 100 matches takes approximately 10-15 seconds
              with rate limiting. The progress bar updates in real-time.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
