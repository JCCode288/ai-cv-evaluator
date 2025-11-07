import { IsString, IsNotEmpty } from 'class-validator';

export class EvaluateDto {
  @IsString()
  @IsNotEmpty()
  jobDescriptionId: string;

  @IsString()
  @IsNotEmpty()
  cvId: string;
}
