import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class CreateJobDescriptionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];
}
