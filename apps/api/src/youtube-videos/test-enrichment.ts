import { ConfigService } from '@nestjs/config';
import { YouTubeEnrichmentService } from './youtube-enrichment.service';
import { R2StorageService } from './r2-storage.service';

// Test the enrichment service with a real video
async function testEnrichment() {
  console.log('Testing YouTube enrichment with AssemblyAI fallback...\n');

  // Load from environment variables
  const configService = {
    get: (key: string) => {
      return process.env[key];
    },
  } as any;

  const r2Storage = new R2StorageService(configService);
  const service = new YouTubeEnrichmentService(configService, r2Storage);

  // Test with a short video that likely has no transcript
  const testVideoId = 'jNQXAC9IVRw'; // "Me at the zoo" - first YouTube video
  const testTitle = 'Me at the zoo';
  const testDescription = 'The first video on YouTube.';

  console.log(`Testing with video: ${testVideoId}`);
  console.log(`Title: ${testTitle}\n`);

  try {
    const result = await service.enrichVideo(testVideoId, testTitle, testDescription);

    console.log('\n=== ENRICHMENT RESULT ===');
    console.log('Transcript Status:', result.transcriptStatus);
    console.log('Transcript Source:', result.transcriptSource);
    console.log('Transcript Length:', result.transcriptText?.length || 0, 'characters');
    console.log('Summary:', result.summary?.substring(0, 100) + '...' || 'None');
    console.log('Topics:', result.topics);

    if (result.transcriptText) {
      console.log('\nTranscript Preview:');
      console.log(result.transcriptText.substring(0, 200) + '...');
    } else {
      console.log('\n⚠️  No transcript was obtained');
    }

  } catch (error: any) {
    console.error('\n❌ Error during enrichment:');
    console.error(error.message);
    console.error(error.stack);
  }
}

testEnrichment();
