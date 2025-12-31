import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || '';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucketName) {
      throw new Error('Missing required R2 configuration');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('R2 Storage initialized successfully');
  }

  /**
   * Upload a file stream to R2 storage
   * @param key - The file path/key in R2
   * @param stream - Readable stream of file content
   * @param contentType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  async uploadStream(
    key: string,
    stream: Readable,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    try {
      this.logger.log(`Uploading to R2: ${key}`);

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: stream,
          ContentType: contentType,
        },
      });

      await upload.done();

      const publicUrl = `${this.publicUrl}/${key}`;
      this.logger.log(`✅ Upload successful: ${publicUrl}`);

      return publicUrl;
    } catch (error: any) {
      this.logger.error(`❌ Failed to upload to R2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from R2 storage
   * @param key - The file path/key in R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      this.logger.log(`Deleting from R2: ${key}`);

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      this.logger.log(`✅ File deleted successfully: ${key}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to delete from R2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a unique key for a YouTube video audio file
   * @param videoId - YouTube video ID
   * @returns Unique R2 key
   */
  generateAudioKey(videoId: string): string {
    const timestamp = Date.now();
    return `youtube-audio/${videoId}-${timestamp}.mp3`;
  }
}
