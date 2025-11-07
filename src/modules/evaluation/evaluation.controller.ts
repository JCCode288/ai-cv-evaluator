import { Body, Controller, Param, Post } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluateDto } from './dto/evaluate.dto';
import { UploadCvDto } from './dto/upload-cv.dto';
import { CvResultDto } from './dto/cv-result.dto';

@Controller('evaluate')
export class EvaluationController {
    constructor(private readonly evaluationService: EvaluationService) { }

    @Post("/")
    evaluate(@Body() evaluateDto: EvaluateDto) {
        return this.evaluationService.evaluate(evaluateDto);
    }

    @Post('upload')
    uploadCV(@Body() uploadCvDto: UploadCvDto) {
        return this.evaluationService.uploadCV(uploadCvDto);
    }

    @Post(":id/result")
    result(@Param("id") cvId: string, @Body() cvResultDto: CvResultDto) {
        return this.evaluationService.saveResult(cvId, cvResultDto);
    }
}
