import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class GenerateTestDto {
  @IsString()
  filePath: string;

  @IsOptional()
  @IsString()
  functionName?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  framework?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class ExecuteTestDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  timeoutSeconds?: number;
}
