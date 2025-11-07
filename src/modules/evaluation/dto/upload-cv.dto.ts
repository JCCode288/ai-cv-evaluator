import { IsString, IsNotEmpty } from 'class-validator';

export class UploadCvDto {
  @IsString()
  @IsNotEmpty()
  cv: string;
}
