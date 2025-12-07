$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

<#
  Helper script to tag and publish a GitHub release.
  Prompts for version, tag target, title, and release notes.
  Requirements: git, gh (GitHub CLI) must be installed and authenticated.
#>

param(
  [string]$Version,
  [string]$Target = 'HEAD',
  [string]$NotesFile
)

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' not found on PATH."
  }
}

Require-Command git
Require-Command gh

# Move to repo root
$repoRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $repoRoot

# Read package.json version for convenience
$pkgVersion = $null
try {
  $pkgVersion = (Get-Content package.json -Raw | ConvertFrom-Json).version
} catch { }

# Prompt for version if not supplied
if (-not $Version) {
  $defaultPrompt = if ($pkgVersion) { " (package.json: $pkgVersion)" } else { "" }
  $Version = Read-Host "New version$defaultPrompt (e.g. 1.7.3)"
  if (-not $Version -and $pkgVersion) {
    $Version = $pkgVersion
  }
}

if (-not $Version) {
  throw "Version is required."
}

$tag = "v$Version"

# Prompt for tag target (commit-ish)
$targetInput = Read-Host "Tag target commit-ish (default: $Target)"
if ($targetInput) { $Target = $targetInput }

# Prompt for release title
$title = Read-Host "Release title (default: $tag)"
if (-not $title) { $title = $tag }

# Release notes
$notesInline = $null
if ($NotesFile) {
  if (-not (Test-Path $NotesFile)) {
    throw "Notes file '$NotesFile' not found."
  }
} else {
  $notesInline = Read-Host "Release notes (inline, default: 'Release $tag')"
  if (-not $notesInline) { $notesInline = "Release $tag" }
}

# Guard checks
$dirty = git status --porcelain
if ($dirty) {
  throw "Working tree is not clean. Commit or stash changes before releasing."
}

$existingTag = git tag -l $tag
if ($existingTag) {
  throw "Tag $tag already exists."
}

Write-Host "About to create tag $tag on $Target and publish release '$title'."
if ($NotesFile) {
  Write-Host "Using notes file: $NotesFile"
} else {
  Write-Host "Inline notes: $notesInline"
}
$confirm = Read-Host "Proceed? (y/N)"
if ($confirm -notmatch '^(y|yes)$') {
  Write-Host "Aborted."
  exit 0
}

# Create and push tag
git tag -a $tag $Target -m "Release $tag"
git push origin $tag

# Create GitHub release
$ghArgs = @('release', 'create', $tag, '--title', $title, '--verify-tag')
if ($NotesFile) {
  $ghArgs += @('--notes-file', $NotesFile)
} else {
  $ghArgs += @('--notes', $notesInline)
}

gh @ghArgs

Write-Host "Release $tag created."
