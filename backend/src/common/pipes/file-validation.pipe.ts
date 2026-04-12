import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { extname } from 'path';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly options: {
      maxSize?: number;
      allowedMimes?: string[];
    } = {}
  ) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
        return value;
    }

    const files = Array.isArray(value) ? value : [value];
    
    for (const file of files) {
        // Size validation
        if (this.options.maxSize && file.size > this.options.maxSize) {
            throw new BadRequestException(`File "${file.originalname}" exceeds maximum size of ${this.options.maxSize / (1024 * 1024)}MB`);
        }

        // MIME type validation
        if (this.options.allowedMimes && !this.options.allowedMimes.includes(file.mimetype)) {
            throw new BadRequestException(`File type "${file.mimetype}" is not allowed for "${file.originalname}". Allowed: ${this.options.allowedMimes.join(', ')}`);
        }
    }

    return value;
  }
}
