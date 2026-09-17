import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  title?: string;
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class IndexRepositoryDto {
  @IsOptional()
  @IsString()
  branch?: string;
}
