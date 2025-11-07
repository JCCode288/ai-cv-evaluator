import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CV } from '../database/mongodb/schemas/cv.schema';
import { JobDescription } from '../database/mongodb/schemas/job-description.schema';
import { CVResult } from '../database/mongodb/schemas/cv-result.schema';
import { UploadCvDto } from './dto/upload-cv.dto';
import { EvaluateDto } from './dto/evaluate.dto';
import { CvResultDto } from './dto/cv-result.dto';

@Injectable()
export class EvaluationService {
    constructor(
        @InjectModel(CV.name) private readonly cvModel: Model<CV>,
        @InjectModel(JobDescription.name) private readonly jobDescriptionModel: Model<JobDescription>,
        @InjectModel(CVResult.name) private readonly cvResultModel: Model<CVResult>,
    ) { }

    async uploadCV(uploadCvDto: UploadCvDto): Promise<CV> {
        const createdCV = new this.cvModel({ content: uploadCvDto.cv });
        return createdCV.save();
    }

    async evaluate(evaluateDto: EvaluateDto): Promise<any> {
        // This is where the evaluation logic would go.
        // For now, we'll just return a placeholder.
        return { status: 'pending' };
    }

    async saveResult(cvId: string, cvResultDto: CvResultDto): Promise<CVResult> {
        const createdResult = new this.cvResultModel({
            cv: cvId,
            result: cvResultDto.result,
        });
        return createdResult.save();
    }
}

