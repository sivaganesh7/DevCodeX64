import { IsString, IsOptional, IsIn } from 'class-validator';

export const VALID_DOC_TYPES = [
  'README',
  'API',
  'ARCHITECTURE',
  'FUNCTION',
  'SETUP',
  'DATABASE',
  'DEVELOPER_GUIDE',
] as const;

export type DocTypeEnum = typeof VALID_DOC_TYPES[number];

export class GenerateDocumentationDto {
  @IsString()
  @IsIn(VALID_DOC_TYPES as unknown as string[], {
    message: `docType must be one of: ${VALID_DOC_TYPES.join(', ')}`,
  })
  docType: DocTypeEnum;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
