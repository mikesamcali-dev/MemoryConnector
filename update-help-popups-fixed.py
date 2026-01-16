#!/usr/bin/env python3
"""
Batch update all remaining pages with help popup integration
"""

import re
import os

# Page file to pageKey mapping
PAGES = {
    'RemindersPage.tsx': 'reminders',
    'DashboardPage.tsx': 'feed',
    'SynapseReviewPage.tsx': 'review',
    'ReminderSchedulePage.tsx': 'reminder-schedule',
    'WordsPage.tsx': 'words',
    'WordDetailPage.tsx': 'word-detail',
    'QuestionsPage.tsx': 'questions',
    'QuestionDetailPage.tsx': 'question-detail',
    'PersonBuilderPage.tsx': 'people',
    'PersonDetailPage.tsx': 'person-detail',
    'RelationshipGraphPage.tsx': 'relationships',
    'LocationBuilderPage.tsx': 'locations',
    'LocationMemoriesPage.tsx': 'locations',
    'ImageBuilderPage.tsx': 'images',
    'UrlBuilderPage.tsx': 'urls',
    'YouTubeBuilderPage.tsx': 'youtube-videos',
    'YouTubeVideoMemoriesPage.tsx': 'youtube-videos',
    'TikTokVideosListPage.tsx': 'tiktok-videos',
    'TikTokVideoDetailPage.tsx': 'tiktok-videos',
    'TikTokBuilderPage.tsx': 'tiktok-builder',
    'TwitterPostsListPage.tsx': 'twitter-posts',
    'TwitterPostDetailPage.tsx': 'twitter-posts',
    'ProjectsPage.tsx': 'projects',
    'ProjectDetailPage.tsx': 'project-detail',
    'TrainingsPage.tsx': 'trainings',
    'TrainingDetailPage.tsx': 'training-detail',
    'SlideDecksListPage.tsx': 'slidedecks',
    'SlideDeckReminderSelectionPage.tsx': 'slidedecks',
    'SlideDeckViewerPage.tsx': 'slidedeck-viewer',
    'TrainingDecksListPage.tsx': 'training-decks',
    'TrainingDeckViewerPage.tsx': 'training-deck-viewer',
    'AtlasPage.tsx': 'atlas',
    'UpgradePage.tsx': 'upgrade',
    'AdminPanelPage.tsx': 'admin',
    'AuditTrailPage.tsx': 'audit-trail',
    'MemoryDetailPage.tsx': 'memory-detail',
    'LinkMemoryPage.tsx': 'memory-detail',
}

BASE_PATH = r'C:\Visual Studio\Memory Connector\apps\web\src\pages'


def add_imports(content, page_key):
    """Add help popup imports if not present"""
    # Check if already imported
    if 'useHelpPopup' in content and 'HelpPopup' in content:
        print(f"  ✓ Imports already present")
        return content

    # Find first import statement
    import_match = re.search(r'^import\s+', content, re.MULTILINE)
    if not import_match:
        print(f"  ⚠ No imports found")
        return content

    # Add our imports after the first import
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('import '):
            # Insert after this line
            lines.insert(i + 1, "import { useHelpPopup } from '../hooks/useHelpPopup';")
            lines.insert(i + 2, "import { HelpPopup } from '../components/HelpPopup';")
            print(f"  ✓ Added imports")
            return '\n'.join(lines)

    return content


def add_hook(content, page_key):
    """Add useHelpPopup hook call if not present"""
    # Check if already present
    if f"useHelpPopup('{page_key}')" in content or f'useHelpPopup("{page_key}")' in content:
        print(f"  ✓ Hook already present")
        return content

    # Find the component function
    func_match = re.search(r'export function \w+Page\(\) \{', content)
    if not func_match:
        print(f"  ⚠ Component function not found")
        return content

    # Find first hook or state declaration
    hook_patterns = [
        r'const \w+ = use\w+\(',
        r'const \[\w+',
    ]

    lines = content.split('\n')
    start_line = content[:func_match.end()].count('\n')

    for i in range(start_line, min(start_line + 20, len(lines))):
        line = lines[i]
        if any(re.search(pattern, line) for pattern in hook_patterns):
            # Insert hook before this line
            indent = len(line) - len(line.lstrip())
            hook_line = ' ' * indent + f"const helpPopup = useHelpPopup('{page_key}');"
            lines.insert(i, hook_line)
            print(f"  ✓ Added hook")
            return '\n'.join(lines)

    print(f"  ⚠ Could not find insertion point for hook")
    return content


def add_component(content, page_key):
    """Add HelpPopup component before closing tag"""
    # Check if already present
    if f'pageKey="{page_key}"' in content or f"pageKey='{page_key}'" in content:
        print(f"  ✓ Component already present")
        return content

    # Find the closing tags
    # Look for pattern like:    </div>\n  );\n}
    closing_pattern = r'(\s+</div>)\s+\);\s+\}'
    match = re.search(closing_pattern, content)

    if not match:
        print(f"  ⚠ Could not find closing pattern")
        return content

    # Insert component before closing div
    component_code = f'''
      {{/* Help Popup */}}
      <HelpPopup
        pageKey="{page_key}"
        isOpen={{helpPopup.isOpen}}
        onClose={{helpPopup.closePopup}}
      />'''

    new_content = content[:match.start(1)] + component_code + '\n' + content[match.start(1):]
    print(f"  ✓ Added component")
    return new_content


def update_page(filename, page_key):
    """Update a single page file"""
    filepath = os.path.join(BASE_PATH, filename)

    if not os.path.exists(filepath):
        print(f"✗ {filename}: File not found")
        return False

    print(f"Updating {filename} (pageKey: {page_key})...")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Apply updates
    content = add_imports(content, page_key)
    content = add_hook(content, page_key)
    content = add_component(content, page_key)

    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ {filename} updated successfully\n")
        return True
    else:
        print(f"→ {filename} already up to date\n")
        return False


def main():
    print(f"Updating {len(PAGES)} page files with help popup integration...\n")

    updated = 0
    skipped = 0
    errors = 0

    for filename, page_key in PAGES.items():
        try:
            if update_page(filename, page_key):
                updated += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"✗ Error updating {filename}: {e}\n")
            errors += 1

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Updated: {updated}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {errors}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
