import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.getOrThrow<string>('YANDEX_ACCESS_KEY');
    const secretAccessKey = this.configService.getOrThrow<string>('YANDEX_SECRET_KEY');
    this.bucketName = this.configService.getOrThrow<string>('YANDEX_BUCKET_NAME');

    if (this.bucketName) {
        this.s3Client = new S3Client({
            region: 'ru-central1',
            endpoint: 'https://storage.yandexcloud.net',
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    if (!this.s3Client) {
      throw new Error('Storage is not configured');
    }

    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    
    const fileName = `${folder}/${randomName}${extname(file.originalname)}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      return `https://${this.bucketName}.storage.yandexcloud.net/${fileName}`;
    } catch (error) {
      throw error;
    }
  }
}
