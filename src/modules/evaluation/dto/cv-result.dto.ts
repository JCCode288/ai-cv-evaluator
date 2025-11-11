import {
    IsString,
    IsNotEmpty,
    IsObject,
    IsEnum,
    IsNotEmptyObject,
    IsOptional,
} from 'class-validator';
import { CVResult } from 'src/modules/database/mongodb/schemas/cv-result.schema';
import { CVStatusEnum } from 'src/utils/cv-status.enum';

export class CvResultDto {
    @IsString()
    @IsNotEmpty()
    _id: string;

    @IsEnum(CVStatusEnum)
    @IsString()
    @IsNotEmpty()
    status: `${CVStatusEnum}`;

    @IsOptional()
    @IsObject()
    @IsNotEmptyObject()
    result?: CVResult;
}
