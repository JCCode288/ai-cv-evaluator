import {
    BadRequestException,
    Injectable,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { CV } from '../database/mongodb/schemas/cv.schema';
import { JobDescription } from '../database/mongodb/schemas/job-description.schema';
import { CVResult } from '../database/mongodb/schemas/cv-result.schema';
import { EvaluateDto } from './dto/evaluate.dto';
import { UploadCvDto } from './dto/cv-upload.dto';
import { StorageService } from './storage/storage.service';
import { ExtractorService } from './extractor/extractor.service';
import { CVStatusEnum } from 'src/utils/cv-status.enum';
import { ChromaClient, Collection } from 'chromadb';
import { IExtractedDocument } from './extractor/interfaces/extractor.interfaces';
import { ExtractorAgent } from '../agent/extractor/extractor.agent';
import { GoogleGeminiEmbeddingFunction } from '@chroma-core/google-gemini';
import { CVDetail } from '../database/mongodb/schemas/cv-detail.schema';
import { getJobParser } from 'src/utils/tool.parser';
import PQueue from 'p-queue';
import { IExtractorOutput } from '../agent/extractor/extractor.output';

@Injectable()
export class EvaluationService implements OnModuleInit {
    private readonly logger = new Logger(EvaluationService.name);
    private queue: PQueue; // Type this.queue as PQueue
    private readonly collectionName =
        process.env.CHROMA_COLLECTION_NAME ?? 'cv_collection';
    private readonly collectionNameRag =
        process.env.CHROMA_RAG_COLLECTION_NAME ?? 'rag_collection';
    private collection: Collection;
    private collectionRag: Collection;

    constructor(
        @InjectModel(CV.name) private readonly cvModel: Model<CV>,
        @InjectModel(JobDescription.name)
        private readonly jobDescriptionModel: Model<JobDescription>,
        @InjectModel(CVResult.name) private readonly cvResultModel: Model<CVResult>,
        @InjectModel(CVDetail.name) private readonly cvDetailModel: Model<CVDetail>,
        private readonly storageService: StorageService,
        private readonly extractorService: ExtractorService,
        private readonly chromaDb: ChromaClient,
        private readonly extractorAgent: ExtractorAgent,
        private readonly embedding: GoogleGeminiEmbeddingFunction,
    ) { }

    async onModuleInit() {
        this.queue = new PQueue({ concurrency: 3 });
        this.collection = await this.chromaDb.getOrCreateCollection({
            name: this.collectionName,
            embeddingFunction: this.embedding,
        });
        this.collection.embeddingFunction = this.embedding;

        this.collectionRag = await this.chromaDb.getOrCreateCollection({
            name: this.collectionNameRag,
            embeddingFunction: this.embedding,
        });
        this.collectionRag.embeddingFunction = this.embedding;
    }

    async uploadedList(userId: ObjectId) {
        const query = { uploader: userId };
        const fields = {
            cv_filename: 1,
            project_filename: 1,
            created_at: 1,
            updated_at: 1,
        };
        const list = await this.cvModel
            .find(query, fields)
            .populate({
                path: 'uploader',
                select: 'username email',
            })
            .exec();

        return list;
    }

    async evaluationList(userId: ObjectId) {
        const query = { evaluator: userId };
        const fields = {
            CV: 1,
            status: 1,
            created_at: 1,
            updated_at: 1,
        };

        const list = await this.cvResultModel
            .find(query, fields)
            .populate('CV')
            .exec();

        return list;
    }

    async uploadCV({ cv, project }: UploadCvDto, userId: ObjectId) {
        const createdCv = new this.cvModel({
            cv_filename: cv.originalname,
            cv_mimetype: cv.mimetype,
            project_filename: project.originalname,
            project_mimetype: project.mimetype,
            uploader: userId,
        });
        const cvData = await createdCv.save();

        const uploadRes = await Promise.all([
            this.storageService.saveCv(cv, cvData),
            this.storageService.saveProject(project, cvData),
        ]);

        this.logger.log('Success uploading CV to storage', uploadRes);

        return cvData;
    }

    async evaluate(evaluateDto: EvaluateDto, userId: ObjectId) {
        try {
            const cvData = await this.cvModel.findById(evaluateDto.cvId).exec();
            if (!cvData) throw new BadRequestException('CV data is not found');

            const jobDesc = await this.jobDescriptionModel
                .findById(evaluateDto.jobDescriptionId)
                .exec();
            if (!jobDesc) throw new BadRequestException('Job posting is not found');

            const cvResult = new this.cvResultModel({
                status: CVStatusEnum.PENDING,
                CV: cvData,
                jobDescription: jobDesc,
                evaluator: userId,
            });
            await cvResult.save();

            this.queue.add(() => this.evaluateCv(cvData, cvResult, jobDesc));

            return cvResult;
        } catch (err) {
            if (err?.message.includes('duplicate key error'))
                throw new BadRequestException('CV already analyzed');

            throw err;
        }
    }

    private async evaluateCv(
        cvData: CV,
        cvResult: CVResult,
        jobDesc: JobDescription,
    ) {
        try {
            await this.cvResultModel
                .findByIdAndUpdate(cvResult._id, {
                    status: CVStatusEnum.PROCESSING,
                    updated_at: new Date(),
                })
                .exec();

            const [cv, project] = await Promise.all([
                this.storageService.getCv(cvData),
                this.storageService.getProject(cvData),
            ]);

            if (!cv) return this.logger.error('CV file not found');
            if (!project) return this.logger.error('Project file not found');

            const [extractedCv, extractedProject] = await Promise.all([
                this.extractorService.extract({
                    base64File: cv.toString('base64'),
                    mimeType: cvData.cv_mimetype,
                }),
                this.extractorService.extract({
                    base64File: project.toString('base64'),
                    mimeType: cvData.project_mimetype,
                }),
            ]);

            const [llmResult, vector_id] = await Promise.all([
                this.llmExtraction(jobDesc, extractedCv, extractedProject),
                this.saveExtractedCvToChroma(cvResult, extractedCv, extractedProject),
            ]);

            // Call saveCvDetail separately as its return value is not directly used in the destructuring
            await this.saveCvDetail(cvResult, extractedCv, extractedProject);

            await this.cvResultModel
                .findByIdAndUpdate(cvResult._id, {
                    vector_id,
                    ...llmResult,
                    updated_at: new Date(),
                })
                .exec();

            // Save the evaluation summary to ChromaDB after llmResult is available
            await this.saveCvEvaluationSummaryToChroma(cvResult, llmResult);

            return await this.cvResultModel.findByIdAndUpdate(cvResult._id, {
                status: CVStatusEnum.COMPLETED,
                updated_at: new Date(),
            });
        } catch (error) {
            this.logger.error(`Failed to evaluate CV ${cvData._id}`, error);
            await this.cvResultModel.findByIdAndUpdate(cvResult._id, {
                status: CVStatusEnum.FAILED,
                overall_summary: `Evaluation failed: ${error.message}`,
                updated_at: new Date(),
            });
        }
    }

    private async saveExtractedCvToChroma(
        cvResult: CVResult,
        extractedCv: IExtractedDocument,
        extractedProject: IExtractedDocument,
    ): Promise<string> {
        if (!cvResult._id || !extractedCv.fullText || !extractedProject.fullText)
            throw new Error('Extracted data is not complete');

        const cv_id = `${cvResult._id}_cv`;
        const project_id = `${cvResult._id}_project`;

        const ids = [cv_id, project_id];
        const documents = [extractedCv.fullText, extractedProject.fullText];
        const metadatas = [
            { cv_result_id: cvResult._id.toString(), doc_type: 'cv' },
            { cv_result_id: cvResult._id.toString(), doc_type: 'project' },
        ];

        const payload = {
            ids,
            documents,
            metadatas,
        };
        await this.collection.upsert(payload);

        return cv_id;
    }

    private async saveCvEvaluationSummaryToChroma(
        cvResult: CVResult,
        llmResult: IExtractorOutput
    ): Promise<void> {
        if (!cvResult._id || !llmResult?.overall_summary) {
            throw new Error(
                'CV Result ID or LLM Summary is missing for saving evaluation summary.',
            );
        }

        const evaluation_id = `${cvResult._id}_evaluation_summary`;
        const documentContent = `Overall Summary: ${llmResult.overall_summary}\nCV Feedback: ${llmResult.cv_feedback || 'N/A'}`;
        const metadata = {
            cv_result_id: cvResult._id.toString(),
            doc_type: 'evaluation_summary',
            status: cvResult.status,
            overall_score: llmResult.overall_score,
            cv_match_rate: llmResult.cv_match_rate,
        };

        await this.collectionRag.upsert({
            ids: [evaluation_id],
            documents: [documentContent],
            metadatas: [metadata],
        });
    }

    private async saveCvDetail(
        cvResult: CVResult,
        extractedCv: IExtractedDocument,
        extractedProject: IExtractedDocument,
    ) {
        if (
            !cvResult._id ||
            !extractedCv.pages?.length ||
            !extractedProject.pages?.length
        )
            throw new Error('Extracted data is not complete');

        const ids: string[] = [];
        const documents: string[] = [];
        const metadatas: Record<string, any>[] = [];
        const cvDetails: CVDetail[] = [];

        for (let i = 0; i < extractedCv.pages.length; i++) {
            const page = extractedCv.pages[i];

            const cvDetail = new this.cvDetailModel({
                page: page.pageNumber,
                base64_image: page.image,
                texts: page.texts,
                CV: cvResult.CV._id,
            });
            cvDetails.push(cvDetail);

            const pageText = page.texts.join('\n\n');
            const metadata = {
                cv_result_id: cvResult._id.toString(),
                cv_detail_id: (cvDetail._id as any).toString(),
                doc_type: 'cv',
            };

            documents.push(pageText);
            metadatas.push(metadata);
            ids.push((cvDetail._id as any).toString());
        }

        for (let i = 0; i < extractedProject.pages.length; i++) {
            const page = extractedProject.pages[i];
            const cvDetail = new this.cvDetailModel({
                page: page.pageNumber,
                base64_image: page.image,
                texts: page.texts,
                CV: cvResult.CV._id,
            });
            cvDetails.push(cvDetail);

            const pageText = page.texts.join('\n\n');
            const metadata = {
                cv_result_id: cvResult._id.toString(),
                cv_detail_id: (cvDetail._id as any).toString(),
                doc_type: 'project',
            };

            documents.push(pageText);
            metadatas.push(metadata);
            ids.push((cvDetail._id as any).toString());
        }

        const payload = {
            ids,
            documents,
            metadatas,
        };

        const results = await Promise.allSettled([
            this.collectionRag.upsert(payload),
            this.cvDetailModel.bulkSave(cvDetails),
        ]);

        return payload;
    }

    private async llmExtraction(
        jobDescription: JobDescription,
        extractedCv: IExtractedDocument,
        extractedProject: IExtractedDocument,
    ): Promise<IExtractorOutput> {
        const job_descriptions = getJobParser(jobDescription);
        const stringified_cv = extractedCv.fullText;
        const stringified_project = extractedProject.fullText;
        const cv_images = extractedCv.pages.reduce((prev: string[], page) => {
            if (page.image) prev.push(page.image);
            return prev;
        }, []);
        const project_images = extractedProject.pages.reduce(
            (prev: string[], page) => {
                if (page.image) prev.push(page.image);
                return prev;
            },
            [],
        );

        const input = 'extract candidates match rate';
        const history = [];

        const stateResult = await this.extractorAgent.chat({
            input,
            history,
            job_descriptions,
            stringified_cv,
            stringified_project,
            cv_images,
            project_images,
        });

        return stateResult.output;
    }

    async getResultById(cvResultId: string) {
        return this.cvResultModel
            .findById(cvResultId)
            .populate(['CV', 'jobDescription'])
            .exec();
    }
}
