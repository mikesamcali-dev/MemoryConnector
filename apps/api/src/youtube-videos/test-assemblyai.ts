import { AssemblyAI } from 'assemblyai';

// Quick test script to verify AssemblyAI API key
async function testAssemblyAI() {
  const apiKey = 'b85e82becf1d4e148951d8af2535aa86';

  if (!apiKey) {
    console.error('API key not found!');
    return;
  }

  const client = new AssemblyAI({ apiKey });

  try {
    console.log('Testing AssemblyAI API key...');
    console.log('API Key:', apiKey.substring(0, 10) + '...');

    // Test with a short public audio file
    const testUrl = 'https://github.com/AssemblyAI-Examples/audio-examples/raw/main/20230607_me_canadian_wildfires.mp3';

    console.log('\nSubmitting test transcription...');
    const transcript = await client.transcripts.transcribe({
      audio: testUrl,
    });

    console.log('\n✅ AssemblyAI API Key is VALID!');
    console.log('Transcription Status:', transcript.status);
    console.log('Transcript ID:', transcript.id);
    console.log('Text preview:', transcript.text?.substring(0, 100) + '...');

    // Get account info if available
    console.log('\nTo check your usage:');
    console.log('1. Visit: https://www.assemblyai.com/app/account');
    console.log('2. Or check: https://www.assemblyai.com/app/transcripts');

  } catch (error: any) {
    console.error('\n❌ Error testing AssemblyAI:');
    console.error('Message:', error.message);
    console.error('Status:', error.status);

    if (error.status === 401) {
      console.error('\n⚠️  API key is INVALID or EXPIRED');
    } else if (error.status === 402) {
      console.error('\n⚠️  Insufficient credits - please add credits to your account');
    }
  }
}

testAssemblyAI();
