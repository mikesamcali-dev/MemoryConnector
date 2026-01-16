# Help Popup Integration Guide

This document provides instructions for integrating the help popup system into all remaining pages.

## What's Been Completed

### Backend ✅
- ✅ Database schema: `UserHelpView` model added
- ✅ Migration created and applied: `20260116004807_add_user_help_views`
- ✅ Backend module: `apps/api/src/help-views/` (service, controller, module)
- ✅ Registered in `app.module.ts`

### Frontend Core ✅
- ✅ API client: `apps/web/src/api/helpViews.ts`
- ✅ Help content: `apps/web/src/constants/helpContent.ts` (all 38 pages mapped)
- ✅ Custom hook: `apps/web/src/hooks/useHelpPopup.tsx`
- ✅ Component: `apps/web/src/components/HelpPopup.tsx`

### Pages Integrated ✅
- ✅ Capture Page

## Integration Pattern

### Step 1: Add Imports

Add these two imports to the top of any page file:

```typescript
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';
```

### Step 2: Add Hook Call

Inside the component function, add the hook call with the appropriate `pageKey`:

```typescript
export function PageName() {
  const helpPopup = useHelpPopup('page-key'); // See pageKey mapping below

  // ... rest of component code
}
```

### Step 3: Add Component

Before the closing `</div>` of the main component return, add the HelpPopup component:

```typescript
return (
  <div>
    {/* Existing page content */}

    {/* Help Popup */}
    <HelpPopup
      pageKey="page-key"
      isOpen={helpPopup.isOpen}
      onClose={helpPopup.closePopup}
    />
  </div>
);
```

## Page Key Mapping

Use these exact `pageKey` values for each page:

| Page File | pageKey | Description |
|-----------|---------|-------------|
| `CapturePage.tsx` | `capture` | ✅ Done |
| `SearchPage.tsx` | `search` | Semantic search |
| `RemindersPage.tsx` | `reminders` | Reminders inbox |
| `DashboardPage.tsx` | `feed` | Main dashboard |
| `SettingsPage.tsx` | `settings` | Account settings |
| `SynapseReviewPage.tsx` | `review` | Spaced repetition reviews |
| `ReminderSchedulePage.tsx` | `reminder-schedule` | Reminder calendar |
| `WordsPage.tsx` | `words` | Vocabulary list |
| `WordDetailPage.tsx` | `word-detail` | Word details |
| `QuestionsPage.tsx` | `questions` | Questions list |
| `QuestionDetailPage.tsx` | `question-detail` | Question details |
| `PersonBuilderPage.tsx` | `people` | People list |
| `PersonDetailPage.tsx` | `person-detail` | Person profile |
| `RelationshipGraphPage.tsx` | `relationships` | Network graph |
| `LocationBuilderPage.tsx` | `locations` | Locations list |
| `LocationMemoriesPage.tsx` | `locations` | Location memories |
| `ImageBuilderPage.tsx` | `images` | Images list |
| `UrlBuilderPage.tsx` | `urls` | URLs list |
| `YouTubeBuilderPage.tsx` | `youtube-videos` | YouTube videos |
| `YouTubeVideoMemoriesPage.tsx` | `youtube-videos` | YouTube memories |
| `TikTokVideosListPage.tsx` | `tiktok-videos` | TikTok list |
| `TikTokVideoDetailPage.tsx` | `tiktok-videos` | TikTok details |
| `TikTokBuilderPage.tsx` | `tiktok-builder` | TikTok builder |
| `TwitterPostsListPage.tsx` | `twitter-posts` | Twitter list |
| `TwitterPostDetailPage.tsx` | `twitter-posts` | Twitter details |
| `ProjectsPage.tsx` | `projects` | Topics list |
| `ProjectDetailPage.tsx` | `project-detail` | Topic details |
| `TrainingsPage.tsx` | `trainings` | Trainings list |
| `TrainingDetailPage.tsx` | `training-detail` | Training details |
| `SlideDecksListPage.tsx` | `slidedecks` | Slide decks list |
| `SlideDeckReminderSelectionPage.tsx` | `slidedecks` | Select reminders |
| `SlideDeckViewerPage.tsx` | `slidedeck-viewer` | Slide viewer |
| `TrainingDecksListPage.tsx` | `training-decks` | Training decks list |
| `TrainingDeckViewerPage.tsx` | `training-deck-viewer` | Training viewer |
| `AtlasPage.tsx` | `atlas` | Map visualization |
| `UpgradePage.tsx` | `upgrade` | Upgrade page |
| `AdminPanelPage.tsx` | `admin` | Admin panel |
| `AuditTrailPage.tsx` | `audit-trail` | Audit logs |
| `MemoryDetailPage.tsx` | `memory-detail` | Memory details |
| `LinkMemoryPage.tsx` | `memory-detail` | Link memories |

## Complete Example: SearchPage Integration

```typescript
// 1. Add imports at top
import { useHelpPopup } from '../hooks/useHelpPopup';
import { HelpPopup } from '../components/HelpPopup';

// 2. Inside component
export function SearchPage() {
  const helpPopup = useHelpPopup('search');

  // ... existing code ...

  // 3. In return statement, before closing </div>
  return (
    <div>
      {/* Existing search UI */}

      {/* Help Popup */}
      <HelpPopup
        pageKey="search"
        isOpen={helpPopup.isOpen}
        onClose={helpPopup.closePopup}
      />
    </div>
  );
}
```

## Settings Page Special Integration

The Settings page needs both the help popup AND the reset button. See section below.

### Add Reset Button to Settings Page

In `SettingsPage.tsx`, after the Reminder Settings section, add:

```typescript
// Add to imports
import { resetAllHelpViews } from '../api/helpViews';
import { useMutation } from '@tanstack/react-query';
import { HelpCircle } from 'lucide-react';

// Add mutation
const resetHelpViewsMutation = useMutation({
  mutationFn: resetAllHelpViews,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['help-view-state'] });
    // Show success message
    alert('All help popups have been reset and will show again!');
  },
});

// Add section in JSX (after Reminder Settings section)
{/* Help Popups Reset */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
  <div className="flex items-center justify-between mb-3 md:mb-4">
    <div>
      <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
        <HelpCircle className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
        <span>Help Popups</span>
      </h2>
      <p className="text-sm text-gray-600 mt-1">
        Reset all help popups to show again on each page (max 3 times per page)
      </p>
    </div>
  </div>

  <button
    onClick={() => resetHelpViewsMutation.mutate()}
    disabled={resetHelpViewsMutation.isPending}
    className="h-12 md:h-10 px-4 md:px-3 py-2 bg-blue-600 text-white text-base md:text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
  >
    {resetHelpViewsMutation.isPending ? 'Resetting...' : 'Reset My Helpers'}
  </button>
</div>
```

## Testing Checklist

After integrating all pages:

1. ✅ Help popup shows on first visit to each page
2. ✅ Popup shows max 3 times per page
3. ✅ After 3 views, popup stops showing
4. ✅ Reset button in Settings resets all counters
5. ✅ After reset, popups show again on all pages
6. ✅ Different pages have independent counters
7. ✅ Different users have independent counters
8. ✅ Content accurately reflects FEATURES.md
9. ✅ Mobile responsive
10. ✅ Keyboard accessible (Escape key closes popup)

## Deployment Checklist

### Local Development
```bash
# Backend
cd apps/api
npm run build

# Frontend
cd apps/web
npm run build
```

### Production Deployment
```bash
# SSH into server
ssh memconnadmin@160.153.184.11
cd /var/www/memory-connector

# Pull changes
git pull origin main

# Database migration (already done locally, will auto-apply)
cd apps/api
npx prisma generate
npx prisma migrate deploy

# Rebuild
npm run build
cd ../../

# Rebuild frontend
cd apps/web
npm run build
cd ../../

# Restart API
pm2 restart memory-connector-api
```

## Troubleshooting

### Popup not showing
- Check browser console for errors
- Verify pageKey exists in `helpContent.ts`
- Check network tab: API should call `/api/v1/help-views/{pageKey}`
- Ensure user is authenticated

### TypeScript errors
- Ensure all imports are correct
- Run `npm run typecheck` to find issues

### Database errors
- Verify migration was applied: `npx prisma migrate status`
- Check PostgreSQL logs: `docker logs memory-connector-postgres`

## Completed By
- Database & Backend: Complete ✅
- Frontend Core: Complete ✅
- High-Priority Pages: Capture (1/5) ✅
- Remaining Pages: 37 pages to integrate

## Next Steps
1. Integrate help popup into remaining 37 pages using the pattern above
2. Add reset button to Settings page
3. Test end-to-end functionality
4. Deploy to production
