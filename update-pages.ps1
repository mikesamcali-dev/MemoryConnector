# Batch update all pages with help popup integration

$pages = @{
    'RemindersPage.tsx' = 'reminders'
    'DashboardPage.tsx' = 'feed'
    'SynapseReviewPage.tsx' = 'review'
    'ReminderSchedulePage.tsx' = 'reminder-schedule'
    'WordsPage.tsx' = 'words'
    'WordDetailPage.tsx' = 'word-detail'
    'QuestionsPage.tsx' = 'questions'
    'QuestionDetailPage.tsx' = 'question-detail'
    'PersonBuilderPage.tsx' = 'people'
    'PersonDetailPage.tsx' = 'person-detail'
    'RelationshipGraphPage.tsx' = 'relationships'
    'LocationBuilderPage.tsx' = 'locations'
    'LocationMemoriesPage.tsx' = 'locations'
    'ImageBuilderPage.tsx' = 'images'
    'UrlBuilderPage.tsx' = 'urls'
    'YouTubeBuilderPage.tsx' = 'youtube-videos'
    'YouTubeVideoMemoriesPage.tsx' = 'youtube-videos'
    'TikTokVideosListPage.tsx' = 'tiktok-videos'
    'TikTokVideoDetailPage.tsx' = 'tiktok-videos'
    'TikTokBuilderPage.tsx' = 'tiktok-builder'
    'TwitterPostsListPage.tsx' = 'twitter-posts'
    'TwitterPostDetailPage.tsx' = 'twitter-posts'
    'ProjectsPage.tsx' = 'projects'
    'ProjectDetailPage.tsx' = 'project-detail'
    'TrainingsPage.tsx' = 'trainings'
    'TrainingDetailPage.tsx' = 'training-detail'
    'SlideDecksListPage.tsx' = 'slidedecks'
    'SlideDeckReminderSelectionPage.tsx' = 'slidedecks'
    'SlideDeckViewerPage.tsx' = 'slidedeck-viewer'
    'TrainingDecksListPage.tsx' = 'training-decks'
    'TrainingDeckViewerPage.tsx' = 'training-deck-viewer'
    'AtlasPage.tsx' = 'atlas'
    'UpgradePage.tsx' = 'upgrade'
    'AdminPanelPage.tsx' = 'admin'
    'AuditTrailPage.tsx' = 'audit-trail'
    'MemoryDetailPage.tsx' = 'memory-detail'
    'LinkMemoryPage.tsx' = 'memory-detail'
}

$basePath = ".\apps\web\src\pages"
$updated = 0
$skipped = 0

foreach ($file in $pages.Keys) {
    $pageKey = $pages[$file]
    $filePath = Join-Path $basePath $file

    if (-not (Test-Path $filePath)) {
        Write-Host "X $file : File not found" -ForegroundColor Red
        continue
    }

    $content = Get-Content $filePath -Raw

    # Check if already updated
    if ($content -match "useHelpPopup\('$pageKey'\)" -or $content -match "useHelpPopup\(`"$pageKey`"\)") {
        Write-Host "- $file : Already updated" -ForegroundColor Yellow
        $skipped++
        continue
    }

    Write-Host "+ Updating $file (pageKey: $pageKey)..." -ForegroundColor Green

    # Add imports after first import statement
    if ($content -notmatch "useHelpPopup.*from.*hooks/useHelpPopup") {
        $content = $content -replace "(import\s+.*?;\s*\n)", "`$1import { useHelpPopup } from '../hooks/useHelpPopup';`nimport { HelpPopup } from '../components/HelpPopup';`n"
    }

    # Add hook call (find first const declaration after function)
    $content = $content -replace "(export function.*?Page\(\)\s*\{.*?)(const\s+)", "`$1const helpPopup = useHelpPopup('$pageKey');`n  `$2"

    # Add component before closing tags
    $content = $content -replace "(\s+)(</div>\s+\);\s+\})\s*$", "`n      {/* Help Popup */}`n      <HelpPopup`n        pageKey=`"$pageKey`"`n        isOpen={helpPopup.isOpen}`n        onClose={helpPopup.closePopup}`n      />`n`$1`$2"

    # Write back
    $content | Set-Content $filePath -NoNewline
    $updated++
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  Updated: $updated"
Write-Host "  Skipped: $skipped"
