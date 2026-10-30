import crypto from 'crypto';
import path from 'path';

export type AllowedStorageCategory = 'resume' | 'avatar' | 'document' | 'report';
export type DetectedMimeType = 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' | 'image/png' | 'image/jpeg' | 'unknown';

export interface FileValidationResult {
  valid: boolean;
  detectedType: DetectedMimeType;
  fileSize: number;
  sanitizedFileName: string;
  error?: string;
}

export class SecureStorageService {
  public static readonly MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
  public static readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024;  // 2MB

  /**
   * Validates buffer magic bytes against trusted file signatures.
   */
  public static detectMagicBytes(buffer: Buffer): DetectedMimeType {
    if (!buffer || buffer.length < 4) {
      return 'unknown';
    }

    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2d)
    if (
      buffer.length >= 5 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46 &&
      buffer[4] === 0x2d
    ) {
      return 'application/pdf';
    }

    // DOCX (ZIP archive header): PK\x03\x04 (0x50 0x4b 0x03 0x04)
    if (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    ) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // PNG header: 0x89 0x50 0x4e 0x47 0x0d 0x0a 0x1a 0x0a
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return 'image/png';
    }

    // JPEG header: 0xff 0xd8 0xff
    if (
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return 'image/jpeg';
    }

    return 'unknown';
  }

  /**
   * Neutralizes path traversal, null byte injections, and dangerous directory separators.
   */
  public static sanitizeFileName(rawFileName: string): string {
    if (!rawFileName || typeof rawFileName !== 'string') {
      return `upload_${Date.now()}.dat`;
    }

    // 1. Strip null bytes
    let clean = rawFileName.replace(/\0/g, '');

    // 2. Extract base name to defeat /path/to/file and ..\..\path
    clean = path.basename(clean);

    // 3. Remove path traversal patterns
    clean = clean.replace(/\.\.+/g, '');

    // 4. Strip dangerous or non-alphanumeric characters except safe dots, hyphens, and underscores
    clean = clean.replace(/[^a-zA-Z0-9.\-_]/g, '_');

    // 5. Ensure non-empty name
    if (!clean || clean === '.') {
      clean = `upload_${Date.now()}.dat`;
    }

    return clean;
  }

  /**
   * Generates a collision-resistant, tenant-scoped storage key.
   */
  public static generateSecureStorageKey(
    tenantId: string,
    category: AllowedStorageCategory,
    originalFileName: string
  ): string {
    const sanitizedName = this.sanitizeFileName(originalFileName);
    const safeTenant = tenantId.replace(/[^a-zA-Z0-9_\-]/g, '');
    const randomHash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();

    return `storage/${category}/${safeTenant}/${timestamp}_${randomHash}_${sanitizedName}`;
  }

  /**
   * Fully validates an uploaded file buffer against category rules, size limits, and magic bytes.
   */
  public static validateFile(
    buffer: Buffer,
    originalFileName: string,
    category: AllowedStorageCategory = 'resume'
  ): FileValidationResult {
    if (!buffer || buffer.length === 0) {
      return {
        valid: false,
        detectedType: 'unknown',
        fileSize: 0,
        sanitizedFileName: this.sanitizeFileName(originalFileName),
        error: 'File content is empty.',
      };
    }

    const maxLimit = category === 'avatar' ? this.MAX_IMAGE_SIZE : this.MAX_RESUME_SIZE;
    if (buffer.length > maxLimit) {
      const maxMb = Math.round(maxLimit / (1024 * 1024));
      return {
        valid: false,
        detectedType: 'unknown',
        fileSize: buffer.length,
        sanitizedFileName: this.sanitizeFileName(originalFileName),
        error: `File size exceeds maximum allowed limit of ${maxMb}MB.`,
      };
    }

    const detectedType = this.detectMagicBytes(buffer);
    const sanitizedName = this.sanitizeFileName(originalFileName);
    const ext = path.extname(sanitizedName).toLowerCase();

    if (category === 'resume') {
      if (detectedType !== 'application/pdf' && detectedType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return {
          valid: false,
          detectedType,
          fileSize: buffer.length,
          sanitizedFileName: sanitizedName,
          error: 'Resume must be a valid PDF or DOCX document with authentic file signatures.',
        };
      }
      if (detectedType === 'application/pdf' && ext !== '.pdf') {
        return {
          valid: false,
          detectedType,
          fileSize: buffer.length,
          sanitizedFileName: sanitizedName,
          error: 'File extension mismatch: PDF file signature detected but filename extension is not .pdf.',
        };
      }
      if (detectedType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && ext !== '.docx' && ext !== '.doc') {
        return {
          valid: false,
          detectedType,
          fileSize: buffer.length,
          sanitizedFileName: sanitizedName,
          error: 'File extension mismatch: Word document signature detected but filename extension is not .docx.',
        };
      }
    } else if (category === 'avatar') {
      if (detectedType !== 'image/png' && detectedType !== 'image/jpeg') {
        return {
          valid: false,
          detectedType,
          fileSize: buffer.length,
          sanitizedFileName: sanitizedName,
          error: 'Avatar image must be a valid PNG or JPEG image file.',
        };
      }
    }

    return {
      valid: true,
      detectedType,
      fileSize: buffer.length,
      sanitizedFileName: sanitizedName,
    };
  }
}
