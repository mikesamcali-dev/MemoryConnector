# Mobile-First Redesign Prompt for Memory Connector

## Objective
Transform the Memory Connector application into a mobile-first responsive design that prioritizes excellent mobile UX while scaling up gracefully to desktop displays.

## Design Principles

### Mobile View (< 768px)
- **Minimize text**: Use icons, abbreviations, and concise labels
- **Single column layouts**: Stack content vertically
- **Touch-friendly**: 44px minimum tap targets
- **Essential info only**: Hide secondary details by default
- **Bottom navigation**: Easy thumb reach
- **Collapsible sections**: Expand on demand
- **Swipe gestures**: For common actions (delete, archive)

### Desktop View (≥ 768px)
- **Multi-column layouts**: Utilize horizontal space
- **Expanded text**: Full labels, descriptions, helper text
- **Sidebar navigation**: Persistent left/top navigation
- **Additional metadata**: Show timestamps, tags, categories
- **Hover states**: Tooltips and previews
- **Keyboard shortcuts**: Power user features

## Pages to Redesign

### 1. Login/Signup Pages
**Mobile:**
- Centered card with minimal branding (logo icon only)
- Large input fields (48px height)
- Single "Continue" button
- Link to switch between login/signup

**Desktop:**
- Split screen: branding/hero image on left, form on right
- Show full tagline and feature highlights
- Add social login buttons
- Display terms/privacy links

### 2. Capture Page (Memory Creation)
**Mobile:**
- Floating action button (FAB) for quick capture
- Full-screen modal for memory entry
- Large textarea (auto-focus, auto-grow)
- Icon-only toolbar (camera, location, reminder)
- Swipe down to dismiss
- Bottom sheet for type selection

**Desktop:**
- Inline form in main content area
- Full labels for all fields
- Preview pane showing memory as it will appear
- Tag suggestions sidebar
- Drag-and-drop file upload area

### 3. Search Page
**Mobile:**
- Search bar at top (sticky)
- Filter icon opens bottom sheet
- Card-based results (compact):
  - First line of content only
  - Small icon for memory type
  - Relative timestamp ("2h ago")
- Pull to refresh
- Infinite scroll

**Desktop:**
- Search bar with inline filters
- Two-column results:
  - Left: List view with full content preview
  - Right: Selected memory detail view
- Advanced filters always visible
- Pagination controls
- Full timestamps with date

### 4. Reminders Page
**Mobile:**
- List view with swipe actions:
  - Swipe right: Mark as read
  - Swipe left: Dismiss
- Icon + truncated title (1 line)
- Time badge
- Tap for full detail modal

**Desktop:**
- Table view with columns:
  - Status icon
  - Full reminder text
  - Memory preview
  - Created/scheduled timestamps
  - Action buttons (Mark read, Dismiss)
- Bulk select checkboxes
- Filter/sort dropdown

### 5. Settings Page
**Mobile:**
- Grouped list items
- Icon + label (no descriptions)
- Chevron indicates drill-down
- Native-feeling switches/toggles
- Sections: Account, Preferences, About

**Desktop:**
- Two-column layout:
  - Left: Navigation menu
  - Right: Setting details with descriptions
- Inline editing (no modals)
- Show all options at once
- Tooltips for complex settings

## Technical Implementation

### CSS Strategy
Use a mobile-first approach with Tailwind CSS (if not already using) or CSS modules:

```css
/* Base styles for mobile */
.container {
  padding: 1rem;
  font-size: 0.875rem;
}

/* Desktop overrides */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    font-size: 1rem;
  }
}
```

### Breakpoints
- **Mobile**: < 768px (default)
- **Tablet**: 768px - 1024px
- **Desktop**: ≥ 1024px

### Key Components to Create/Update

1. **Navigation Component**
   - Mobile: Bottom tab bar (5 icons max)
   - Desktop: Sidebar or top nav with labels

2. **Memory Card Component**
   - Mobile: Compact card (icon + title + 1 line)
   - Desktop: Expanded card (icon + title + preview + metadata)

3. **Form Inputs**
   - Mobile: Full-width, large touch targets
   - Desktop: Max-width with labels on left

4. **Modals**
   - Mobile: Full-screen slide-up
   - Desktop: Centered overlay (max 600px width)

5. **Empty States**
   - Mobile: Icon + short message
   - Desktop: Icon + detailed message + suggestions

## Specific Changes Needed

### Text Condensing Examples
| Element | Mobile | Desktop |
|---------|--------|---------|
| "Create Memory" button | "+" FAB | "Create New Memory" |
| Timestamp | "2h" | "2 hours ago (Jan 2, 2:30 PM)" |
| Memory type | 🎯 icon | "Event" with icon |
| Search placeholder | "Search..." | "Search memories by keywords or content..." |
| Tier limit message | "8/10 today" | "8 of 10 memories created today (Free tier)" |

### Layout Changes
1. **Header**: Mobile shows logo icon only; Desktop shows logo + title + user menu
2. **Footer**: Mobile hidden; Desktop shows links, version, status
3. **Spacing**: Mobile uses 0.5-1rem gaps; Desktop uses 1-2rem
4. **Typography**: Mobile uses 14-16px base; Desktop uses 16-18px base

## Testing Requirements

After implementation, verify:
1. **Responsive breakpoints**: Test at 375px, 768px, 1024px, 1440px
2. **Touch targets**: All buttons/links ≥ 44px on mobile
3. **Text overflow**: No horizontal scroll on any device
4. **Performance**: Mobile bundle size optimized
5. **Offline sync**: Works seamlessly on mobile data
6. **Orientation**: Handle portrait/landscape on mobile

## Implementation Checklist

- [ ] Audit current components for mobile UX issues
- [ ] Create responsive navigation (bottom bar + sidebar)
- [ ] Redesign Memory Card component with mobile/desktop variants
- [ ] Update form layouts for mobile-first
- [ ] Implement swipe gestures for common actions
- [ ] Add bottom sheets for mobile selections
- [ ] Create full-screen modals for mobile forms
- [ ] Update typography scale for mobile readability
- [ ] Optimize images/assets for mobile bandwidth
- [ ] Test on real devices (iOS Safari, Android Chrome)
- [ ] Add viewport meta tag if missing
- [ ] Implement touch-friendly dropdowns/selects
- [ ] Add pull-to-refresh on mobile list views
- [ ] Ensure offline queue UI works on mobile
- [ ] Update Settings page to collapsible sections on mobile

## Success Criteria

The redesign is complete when:
1. App is fully usable on 375px width devices
2. No horizontal scrolling on any screen size
3. All interactive elements are easily tappable on mobile
4. Mobile view shows only essential information
5. Desktop view utilizes space for enhanced features
6. Design feels native to each platform
7. Performance metrics: LCP < 2.5s on 3G, FID < 100ms

## Notes

- Preserve all existing functionality
- Maintain offline-first capabilities
- Keep idempotency and deduplication logic intact
- Ensure API calls remain the same
- Focus on UI/UX layer only (React components + CSS)
