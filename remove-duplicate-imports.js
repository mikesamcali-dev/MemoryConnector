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

function removeDuplicateImports(filename) {
  const filepath = path.join(BASE_PATH, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`X ${filename}: File not found`);
    return false;
  }

  let content = fs.readFileSync(filepath, 'utf8');
  const originalContent = content;

  // Remove duplicate useHelpPopup import lines
  let lines = content.split('\n');
  let seenUseHelpPopup = false;
  let seenHelpPopup = false;
  let modifiedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is the useHelpPopup import
    if (line.includes("import { useHelpPopup } from '../hooks/useHelpPopup'")) {
      if (seenUseHelpPopup) {
        // Skip this duplicate line
        continue;
      }
      seenUseHelpPopup = true;
    }

    // Check if this is the HelpPopup import
    if (line.includes("import { HelpPopup } from '../components/HelpPopup'")) {
      if (seenHelpPopup) {
        // Skip this duplicate line
        continue;
      }
      seenHelpPopup = true;
    }

    modifiedLines.push(line);
  }

  content = modifiedLines.join('\n');

  if (content !== originalContent) {
    console.log(`+ Removing duplicates from ${filename}...`);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`  Success!`);
    return true;
  } else {
    console.log(`- ${filename}: No duplicates found`);
    return false;
  }
}

function main() {
  console.log(`Removing duplicate imports from ${PAGES.length} pages...\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of PAGES) {
    try {
      if (removeDuplicateImports(filename)) {
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
