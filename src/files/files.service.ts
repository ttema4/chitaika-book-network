import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';
import { Readable } from 'stream';

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

  async getFileContent(url: string): Promise<string> {
      if (!url) return '';
      
      try {
          const urlObj = new URL(url);
          const key = urlObj.pathname.substring(1); 

          const command = new GetObjectCommand({
              Bucket: this.bucketName,
              Key: key,
          });

          const response = await this.s3Client.send(command);
          const buffer = await this.streamToBuffer(response.Body as Readable);

          const detected = chardet.detect(buffer);
          let encoding = detected || 'utf-8';
          
          if (encoding === 'ISO-8859-1' && this.looksLikeRussian(buffer)) {
               encoding = 'windows-1251';
          }

          if (!iconv.encodingExists(encoding)) {
              encoding = 'utf-8';
          }

          return iconv.decode(buffer, encoding);
      } catch (e) {
          console.error('Error reading file from S3:', e);
          return '';
      }
  }

  private looksLikeRussian(buffer: Buffer): boolean {
      let ruCount = 0;
      for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
          const b = buffer[i];
          if (b >= 192 && b <= 255) ruCount++;
      }
      return ruCount > 10;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
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
