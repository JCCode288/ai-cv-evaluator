import { BadRequestException, Body, Controller, Get, Param, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluateDto } from './dto/evaluate.dto';
import { CvResultDto } from './dto/cv-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../database/mongodb/schemas';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { pdfFilter } from 'src/utils/pdf-mime.filter';
import { Types } from 'mongoose';
import { Chroma } from '@langchain/community/vectorstores/chroma';

@Controller('evaluate')
@UseGuards(JwtAuthGuard)
export class EvaluationController {
    constructor(
        private readonly evaluationService: EvaluationService,
        private readonly collection: Chroma
    ) { }

    @Get("/")
    evaluationList(@GetUser() user: any) {
        return this.evaluationService.evaluationList(user.userId);
    }

    @Post("/")
    evaluate(@Body() evaluateDto: EvaluateDto, @GetUser() user: any) {
        return this.evaluationService.evaluate(
            evaluateDto,
            user.userId
        );
    }

    @Get("/upload")
    cvList(@GetUser() user: any) {
        return this.evaluationService.uploadedList(user.userId);
    }

    @Post('upload')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'cv', maxCount: 1 },
        { name: 'project', maxCount: 1 },
    ], {
        fileFilter: pdfFilter
    }))
    uploadCV(
        @UploadedFiles() files: { cv?: Express.Multer.File[], project?: Express.Multer.File[] },
        @GetUser() user: any
    ) {
        const cv = files.cv?.[0];
        const project = files.project?.[0];

        if (!cv) throw new BadRequestException("CV is not included");
        if (!project) throw new BadRequestException("CV is not included");

        return this.evaluationService.uploadCV(
            { cv, project },
            user.userId
        );
    }

    @Get("/:id/result")
    result(@Param("id") cvResultId: string) {
        if (!Types.ObjectId.isValid(cvResultId))
            throw new BadRequestException("Invalid Id");

        return this.evaluationService.getResultById(cvResultId);
    }

    @Get("/query")
    query(@Query("text") searchQuery: string) {
        if (!searchQuery) return [];

        return this.collection.similaritySearchWithScore(searchQuery);
    }
}
