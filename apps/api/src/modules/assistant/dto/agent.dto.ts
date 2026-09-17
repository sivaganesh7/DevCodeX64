import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';

export class RunAgentTaskDto {
  @IsString()
  @IsNotEmpty()
  task: string;

  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  maxIterations?: number;
}
