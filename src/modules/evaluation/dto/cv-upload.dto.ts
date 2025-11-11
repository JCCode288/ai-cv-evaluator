import { IsDefined, IsNotEmpty } from 'class-validator';

export class UploadCvDto {
    @IsDefined()
    @IsNotEmpty()
    cv: Express.Multer.File;

    @IsDefined()
    @IsNotEmpty()
    project: Express.Multer.File;
}
