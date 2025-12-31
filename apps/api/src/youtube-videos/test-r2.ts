import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

async function testR2Connection() {
  console.log('Testing Cloudflare R2 connection...\n');

  const endpoint = 'https://0ce00851220d93362c7e062bbf3b77c7.r2.cloudflarestorage.com';
  const accessKeyId = '1ceb271797ab87e6681845f9418bdbe8';
  const secretAccessKey = 'c90a08242551ba784404d37aa5834d6bc30092da66e2d5bdf7228d4871082fd0';
  const bucketName = 'imageconnect';

  console.log('Configuration:');
  console.log('- Endpoint:', endpoint);
  console.log('- Access Key ID:', accessKeyId.substring(0, 10) + '...');
  console.log('- Bucket:', bucketName);
  console.log();

  const s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Test 1: List buckets
  try {
    console.log('Test 1: Listing buckets...');
    const listCommand = new ListBucketsCommand({});
    const listResult = await s3Client.send(listCommand);
    console.log('✅ Successfully connected to R2');
    console.log('Available buckets:', listResult.Buckets?.map(b => b.Name).join(', '));
    console.log();
  } catch (error: any) {
    console.error('❌ Failed to list buckets:', error.message);
    if (error.$metadata) {
      console.error('Status code:', error.$metadata.httpStatusCode);
    }
    console.log();
  }

  // Test 2: Upload a test file
  try {
    console.log('Test 2: Uploading test file...');
    const testContent = 'Hello from Memory Connector!';
    const testKey = 'test-files/connection-test.txt';

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    await s3Client.send(putCommand);
    console.log('✅ Successfully uploaded test file');
    console.log('File uploaded to:', testKey);
    console.log();
  } catch (error: any) {
    console.error('❌ Failed to upload test file:', error.message);
    if (error.$metadata) {
      console.error('Status code:', error.$metadata.httpStatusCode);
    }
    console.error('\nPossible issues:');
    console.error('1. Access key doesn\'t have write permissions');
    console.error('2. Bucket name is incorrect');
    console.error('3. Bucket policy blocks uploads');
    console.error('4. CORS settings need adjustment');
    console.log();
  }
}

testR2Connection().catch(console.error);
