const fs = require('fs');
const path = require('path');

const PAGES = {
  'SearchPage.tsx': 'search',
  'SettingsPage.tsx': 'settings',
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
};

const BASE_PATH = path.join(__dirname, 'apps', 'web', 'src', 'pages');

function integratePage(filename, pageKey) {
  const filepath = path.join(BASE_PATH, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`X ${filename}: File not found`);
    return false;
  }

  let content = fs.readFileSync(filepath, 'utf8');

  // Check if already integrated
  if (content.includes(`useHelpPopup('${pageKey}')`) || content.includes(`useHelpPopup("${pageKey}")`)) {
    console.log(`- ${filename}: Already integrated`);
    return false;
  }

  console.log(`+ Integrating ${filename} (pageKey: ${pageKey})...`);

  // 1. Add imports after first import statement
  const firstImportMatch = content.match(/^import .+;\n/m);
  if (firstImportMatch) {
    const insertPos = firstImportMatch.index + firstImportMatch[0].length;
    const imports = `import { useHelpPopup } from '../hooks/useHelpPopup';\nimport { HelpPopup } from '../components/HelpPopup';\n`;
    content = content.slice(0, insertPos) + imports + content.slice(insertPos);
  }

  // 2. Add hook after function declaration
  const funcMatch = content.match(/export function \w+Page\(\) \{[\s\n]+/);
  if (funcMatch) {
    const insertPos = funcMatch.index + funcMatch[0].length;
    const hook = `  const helpPopup = useHelpPopup('${pageKey}');\n`;
    content = content.slice(0, insertPos) + hook + content.slice(insertPos);
  }

  // 3. Add component before closing tags - find last occurrence of closing pattern
  const closingPattern = /(\s+<\/div>\s+\);\s+\}\s*)$/;
  const match = content.match(closingPattern);
  if (match) {
    const component = `\n      {/* Help Popup */}\n      <HelpPopup\n        pageKey="${pageKey}"\n        isOpen={helpPopup.isOpen}\n        onClose={helpPopup.closePopup}\n      />\n`;
    content = content.replace(closingPattern, component + '$1');
  }

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`  Success!`);
  return true;
}

function main() {
  console.log(`Integrating help popups into ${Object.keys(PAGES).length} pages...\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [filename, pageKey] of Object.entries(PAGES)) {
    try {
      if (integratePage(filename, pageKey)) {
        updated++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.log(`X Error: ${filename}: ${error.message}`);
      errors++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`${'='.repeat(60)}`);
}

main();
