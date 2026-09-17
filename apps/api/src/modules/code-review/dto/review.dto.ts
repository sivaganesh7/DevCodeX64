import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class ReviewFileDto {
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  branch?: string;
}

export class ReviewPrDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  pullRequestNumber?: number;

  @IsString()
  @IsOptional()
  diff?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;
}
