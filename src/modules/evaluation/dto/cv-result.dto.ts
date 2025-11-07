import { IsString, IsNotEmpty, IsObject, IsEnum, IsNotEmptyObject, IsOptional } from 'class-validator';
import { CVResult } from 'src/modules/database/mongodb/schemas/cv-result.schema';

export enum CVStatusEnum {
  QUEUED = "queued",
  PROCESSING = 'processing',
  COMPLETED = 'completed'
}

export class CvResultDto {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsEnum(CVStatusEnum)
  @IsNotEmpty()
  status: CVStatusEnum

  @IsOptional()
  @IsObject()
  @IsNotEmptyObject()
  result?: CVResult;
}
