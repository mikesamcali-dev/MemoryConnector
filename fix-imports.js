const fs = require('fs');
const path = require('path');

const PAGES = [
  'SearchPage.tsx',
  'SettingsPage.tsx',
  'RemindersPage.tsx',
  'DashboardPage.tsx',
  'SynapseReviewPage.tsx',
  'ReminderSchedulePage.tsx',
  'WordsPage.tsx',
  'WordDetailPage.tsx',
  'QuestionsPage.tsx',
  'QuestionDetailPage.tsx',
  'PersonBuilderPage.tsx',
  'PersonDetailPage.tsx',
  'RelationshipGraphPage.tsx',
  'LocationBuilderPage.tsx',
  'LocationMemoriesPage.tsx',
  'ImageBuilderPage.tsx',
  'UrlBuilderPage.tsx',
  'YouTubeBuilderPage.tsx',
  'YouTubeVideoMemoriesPage.tsx',
  'TikTokVideosListPage.tsx',
  'TikTokVideoDetailPage.tsx',
  'TikTokBuilderPage.tsx',
  'TwitterPostsListPage.tsx',
  'TwitterPostDetailPage.tsx',
  'ProjectsPage.tsx',
  'ProjectDetailPage.tsx',
  'TrainingsPage.tsx',
  'TrainingDetailPage.tsx',
  'SlideDecksListPage.tsx',
  'SlideDeckReminderSelectionPage.tsx',
  'SlideDeckViewerPage.tsx',
  'TrainingDecksListPage.tsx',
  'TrainingDeckViewerPage.tsx',
  'AtlasPage.tsx',
  'UpgradePage.tsx',
  'AdminPanelPage.tsx',
  'AuditTrailPage.tsx',
  'MemoryDetailPage.tsx',
  'LinkMemoryPage.tsx',
];

const BASE_PATH = path.join(__dirname, 'apps', 'web', 'src', 'pages');

function addImportsToFile(filename) {
  const filepath = path.join(BASE_PATH, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`X ${filename}: File not found`);
    return false;
  }

  let content = fs.readFileSync(filepath, 'utf8');

  // Check if imports already exist
  if (content.includes("from '../hooks/useHelpPopup'") || content.includes("from '../components/HelpPopup'")) {
    console.log(`- ${filename}: Imports already present`);
    return false;
  }

  console.log(`+ Adding imports to ${filename}...`);

  // Find the position after the first import statement
  // Look for lines that start with "import" and end with semicolon
  const lines = content.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') && line.includes(';')) {
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex === -1) {
    console.log(`X ${filename}: Could not find import statement`);
    return false;
  }

  // Insert the two import lines
  const importLines = [
    "import { useHelpPopup } from '../hooks/useHelpPopup';",
    "import { HelpPopup } from '../components/HelpPopup';",
  ];

  lines.splice(insertIndex, 0, ...importLines);
  content = lines.join('\n');

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`  Success!`);
  return true;
}

function main() {
  console.log(`Adding imports to ${PAGES.length} pages...\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of PAGES) {
    try {
      if (addImportsToFile(filename)) {
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
