import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class AnalyzePrDto {
  @IsOptional()
  @IsBoolean()
  postToGithub?: boolean;
}

export class PostPrCommentDto {
  @IsOptional()
  @IsString()
  reviewId?: string;
}
