# ====================================================================
#  ROLLBACK uhtech.in to Sahit's clean map + LAYER ON Sparky/Combat/Flare
#  Target: e0033e5 (last commit before painted biomes / treasure chests
#  / personas / hud gamification) + our 3-system changes on top.
# ====================================================================
#
# Run with:
#   cd C:\Projects\interactive-ideas-fixed\interactiveideas
#   .\rollback-to-sahit-plus-sparky.ps1
#
# What it does:
#   1. Backs up the 3-system files from CURRENT state
#   2. Creates rollback branch from e0033e5 (Sahit-clean baseline)
#   3. Restores Sparky/combat/flare files on top
#   4. Stages changes, shows preview
#   5. Confirms with you before force-pushing to origin/main
#
# Result: uhtech.in goes from "everything live" -> "Sahit's old map +
# Sparky + AI combat + flare polish". The gamification (treasure chests,
# personas, biomes, time-of-day, henchmen) is REMOVED from production.
# ====================================================================

$ErrorActionPreference = "Stop"
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$bundleDir = Join-Path $env:TEMP "rollback-bundle-$ts"
$branchName = "rollback/sahit-plus-sparky-$ts"
$baseCommit = "e0033e5"

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  ROLLBACK: uhtech.in to Sahit-clean + Sparky/Combat/Flare" -ForegroundColor Cyan
Write-Host "  Base commit: $baseCommit (pre-biomes/treasure/persona)" -ForegroundColor Cyan
Write-Host "  Branch: $branchName" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# Files to keep from current state (Sparky + combat + flare + hosts)
$FILES = @(
    "src/components/tutorial/v2",
    "public/assets/tutorial",
    "convex/tutorial.ts",
    "convex/tutorial_metrics.ts",
    "src/components/tutorial/FeedTutorial.tsx",
    "convex/combatAiProvider.ts",
    "convex/combat.ts",
    "convex/combatAntiCheat.ts",
    "convex/combatConstants.ts",
    "convex/combatTypes.ts",
    "convex/aiScoring.ts",
    "src/components/combat",
    "src/lib/combat",
    "convex/flares.ts",
    "src/components/flares",
    "convex/crons.ts",
    "convex/schema.ts",
    "src/app/layout.tsx",
    "src/components/ideaforge/experience.tsx"
)

# --- Step 1: Backup the 3-system files from CURRENT state ---
Write-Host "[1/6] Backing up Sparky/combat/flare files from current main..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $bundleDir -Force | Out-Null
foreach ($f in $FILES) {
    if (Test-Path $f) {
        $dest = Join-Path $bundleDir $f
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        if ((Get-Item $f) -is [System.IO.DirectoryInfo]) {
            Copy-Item $f -Destination $dest -Recurse -Force
        } else {
            Copy-Item $f -Destination $dest -Force
        }
        Write-Host "    [OK] $f" -ForegroundColor Green
    } else {
        Write-Host "    [!]  missing: $f" -ForegroundColor DarkYellow
    }
}

# --- Step 2: Create rollback branch from Sahit-clean baseline ---
Write-Host ""
Write-Host "[2/6] Creating rollback branch from $baseCommit..." -ForegroundColor Yellow
git fetch origin
git checkout -b $branchName $baseCommit
if ($LASTEXITCODE -ne 0) {
    Write-Host "Branch create failed." -ForegroundColor Red
    exit 1
}

# --- Step 3: Restore Sparky/combat/flare files on top of clean base ---
Write-Host ""
Write-Host "[3/6] Layering Sparky/combat/flare onto clean base..." -ForegroundColor Yellow
foreach ($f in $FILES) {
    $src = Join-Path $bundleDir $f
    if (Test-Path $src) {
        $destDir = Split-Path $f -Parent
        if ($destDir -and -not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        if ((Get-Item $src) -is [System.IO.DirectoryInfo]) {
            if (Test-Path $f) { Remove-Item $f -Recurse -Force }
            Copy-Item $src -Destination $f -Recurse -Force
        } else {
            Copy-Item $src -Destination $f -Force
        }
        Write-Host "    [OK] $f" -ForegroundColor Green
    }
}

# --- Step 4: Stage + show preview ---
Write-Host ""
Write-Host "[4/6] Staging changes..." -ForegroundColor Yellow
git add -A
Write-Host ""
Write-Host "=== File summary ===" -ForegroundColor Cyan
git diff --cached --stat | Select-Object -Last 1
Write-Host ""
Write-Host "=== First 30 changed files ===" -ForegroundColor Cyan
git status --short | Select-Object -First 30
Write-Host ""

# --- Step 5: Typecheck before push ---
Write-Host "[5/6] Running typecheck (this takes ~30s)..." -ForegroundColor Yellow
npx tsc --noEmit 2>&1 | Tee-Object -Variable typecheckOutput | Select-Object -Last 30

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Typecheck FAILED. Errors above. Common cause:" -ForegroundColor Red
    Write-Host "  - Sahit-baseline schema is missing fields our combat/flare/tutorial use" -ForegroundColor Yellow
    Write-Host "  - api.d.ts on baseline doesn't list new modules" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Branch $branchName left for inspection. Run 'git checkout main' to abort." -ForegroundColor Yellow
    Write-Host "If you want to push anyway, run:" -ForegroundColor Cyan
    Write-Host "  git commit -m 'rollback: Sahit-clean + Sparky/combat/flare on top'" -ForegroundColor Cyan
    Write-Host "  git push origin ${branchName}:main --force-with-lease" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Typecheck passed!" -ForegroundColor Green
Write-Host ""

# --- Step 6: Confirm + commit + force-push to main ---
$confirm = Read-Host "Looks good? FORCE-PUSH to origin/main (replaces current uhtech.in)? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Aborted. Branch $branchName left for inspection." -ForegroundColor Yellow
    exit 0
}

git commit -m "rollback: Sahit-clean map + Sparky tutorial v2 + AI combat + flare

Reverts painted biomes, treasure chests, personas, henchmen, time-of-day,
boss approach warning, stage overview minimap, persona dialogue, XP popover,
QualityScoreCard, StreakMilestoneCelebration.

Keeps: Sparky tutorial v2, Tier-1 VC AI combat prompts, flare expertiseTag/
expiry/one-response-per-user.

Base: e0033e5 fix(cls): kill remaining layout-shift sources"

git push origin ${branchName}:main --force-with-lease

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "  [DONE] origin/main rolled back. Vercel deploys in ~3-5 min." -ForegroundColor Green
Write-Host "  Watch: https://uhtech.in (wait then hard-refresh Ctrl+Shift+R)" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
