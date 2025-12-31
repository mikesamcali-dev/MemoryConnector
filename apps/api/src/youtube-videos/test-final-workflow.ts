import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const execAsync = promisify(exec);

async function testFinalWorkflow() {
  const videoId = 'KAGU5N1Vzq8';
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let tempFilePath: string | null = null;

  console.log('Testing complete yt-dlp → R2 workflow\n');

  try {
    // Step 1: Download with yt-dlp to temp file (original format, no conversion)
    console.log('Step 1: Downloading audio with yt-dlp...');
    const tempFileTemplate = path.join(os.tmpdir(), `yt-${videoId}-${Date.now()}.%(ext)s`);
    const ytdlpCommand = `python -m yt_dlp -f "bestaudio" -o "${tempFileTemplate}" --quiet --no-warnings "${videoUrl}"`;

    await execAsync(ytdlpCommand, {
      maxBuffer: 100 * 1024 * 1024,
    });

    // Find the actual downloaded file
    const tempDir = os.tmpdir();
    const tempFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(`yt-${videoId}-`));
    if (tempFiles.length === 0) {
      throw new Error('Download failed - no file created');
    }
    tempFilePath = path.join(tempDir, tempFiles[0]);

    if (!fs.existsSync(tempFilePath)) {
      throw new Error('Download failed');
    }

    const stats = fs.statSync(tempFilePath);
    console.log(`✅ Downloaded ${Math.round(stats.size / 1024)} KB to temp file`);
    console.log();

    // Step 2: Upload to R2
    console.log('Step 2: Uploading to R2...');
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: 'https://0ce00851220d93362c7e062bbf3b77c7.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: '1ceb271797ab87e6681845f9418bdbe8',
        secretAccessKey: 'c90a08242551ba784404d37aa5834d6bc30092da66e2d5bdf7228d4871082fd0',
      },
    });

    const audioStream = fs.createReadStream(tempFilePath);
    const key = `test-youtube/${videoId}-${Date.now()}.mp3`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: 'imageconnect',
        Key: key,
        Body: audioStream,
        ContentType: 'audio/mpeg',
      },
    });

    await upload.done();
    const publicUrl = `https://pub-45ff46330f244a269ad9f60c207441d8.r2.dev/${key}`;
    console.log('✅ Upload successful!');
    console.log('Public URL:', publicUrl);
    console.log();

    console.log('🎉 Complete workflow test passed!');
    console.log('Ready to use with AssemblyAI transcription');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stderr) {
      console.error('stderr:', error.stderr);
    }
  } finally {
    // Cleanup temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log('\n✅ Temp file cleaned up');
    }
  }
}

testFinalWorkflow().catch(console.error);
