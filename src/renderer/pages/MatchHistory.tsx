import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export function MatchHistory() {
  const [matchCount, setMatchCount] = useState(20)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  const handleImport = async () => {
    if (matchCount < 1 || matchCount > 100) {
      setStatus({ message: 'Please enter a number between 1 and 100', type: 'error' })
      return
    }

    setIsImporting(true)
    setStatus({ message: 'Starting import...', type: 'info' })
    setProgress({ current: 0, total: matchCount })

    try {
      const result = await window.api.importMatchHistory(matchCount)

      if (result.success) {
        setStatus({
          message: `Successfully imported ${result.data?.imported || matchCount} matches!`,
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
            Import your recent matches from the Riot API to build your encounter database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Match Count Input */}
          <div className="space-y-2">
            <label htmlFor="matchCount" className="text-sm font-medium">
              Number of Matches
            </label>
            <div className="flex gap-3">
              <input
                id="matchCount"
                type="number"
                min="1"
                max="100"
                value={matchCount}
                onChange={(e) => setMatchCount(parseInt(e.target.value) || 20)}
                className="flex-1 px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                disabled={isImporting}
              />
              <Button
                size="lg"
                onClick={handleImport}
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
                    Import Matches
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: 20-50 matches. More matches = longer import time.
            </p>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-medium">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
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

          {/* Rate Limit Warning */}
          <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-950/30 text-yellow-400 border border-yellow-900/50">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <strong>Rate Limit Warning:</strong> Development API keys are limited to 20 requests
              per second. Large imports may take several minutes.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
