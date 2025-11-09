import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
import { jobDescriptionParser } from 'src/utils/job-description.parser';
import { GoogleGeminiEmbeddingFunction } from '@chroma-core/google-gemini';
import { CVDetail } from '../database/mongodb/schemas/cv-detail.schema';

@Injectable()
export class EvaluationService implements OnModuleInit {
    private readonly logger = new Logger(EvaluationService.name);
    private queue: any;
    private readonly collectionName = process.env.CHROMA_COLLECTION_NAME ?? 'cv_collection';
    private readonly collectionNameRag = process.env.CHROMA_RAG_COLLECTION_NAME ?? 'rag_collection';
    private collection: Collection;
    private collectionRag: Collection;

    constructor(
        @InjectModel(CV.name) private readonly cvModel: Model<CV>,
        @InjectModel(JobDescription.name) private readonly jobDescriptionModel: Model<JobDescription>,
        @InjectModel(CVResult.name) private readonly cvResultModel: Model<CVResult>,
        @InjectModel(CVDetail.name) private readonly cvDetailModel: Model<CVDetail>,
        private readonly storageService: StorageService,
        private readonly extractorService: ExtractorService,
        private readonly chromaDb: ChromaClient,
        private readonly extractorAgent: ExtractorAgent,
        private readonly embedding: GoogleGeminiEmbeddingFunction
    ) { }

    async onModuleInit() {
        const { default: PQueue } = await import('p-queue');
        this.queue = new PQueue({ concurrency: 3 });

        this.collection = await this.chromaDb.getOrCreateCollection({
            name: this.collectionName,
            embeddingFunction: this.embedding
        });
        this.collection.embeddingFunction = this.embedding;

        this.collectionRag = await this.chromaDb.getOrCreateCollection({
            name: this.collectionNameRag,
            embeddingFunction: this.embedding
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
        const list = await this.cvModel.find(query, fields).populate({
            path: 'uploader',
            select: 'username email'
        }).exec();

        return list;
    }

    async evaluationList(userId: ObjectId) {
        const query = { evaluator: userId };
        const fields = {
            CV: 1,
            status: 1,
            created_at: 1,
            updated_at: 1
        };

        const list = await this.cvResultModel.find(query, fields).populate("CV").exec();

        return list;
    }

    async uploadCV({ cv, project }: UploadCvDto, userId: ObjectId) {
        const createdCv = new this.cvModel({
            cv_filename: cv.originalname,
            cv_mimetype: cv.mimetype,
            project_filename: project.originalname,
            project_mimetype: project.mimetype,
            uploader: userId
        });
        const cvData = await createdCv.save();

        const uploadRes = await Promise.all([
            this.storageService.saveCv(cv, cvData),
            this.storageService.saveProject(project, cvData),
        ]);

        this.logger.log("Success uploading CV to storage", uploadRes);

        return cvData;
    }

    async evaluate(evaluateDto: EvaluateDto, userId: ObjectId) {
        try {

            const cvData = await this.cvModel.findById(evaluateDto.cvId).exec();
            if (!cvData) throw new BadRequestException("CV data is not found");

            const jobDesc = await this.jobDescriptionModel.findById(evaluateDto.jobDescriptionId).exec();
            if (!jobDesc) throw new BadRequestException("Job posting is not found");

            const cvResult = new this.cvResultModel({
                status: CVStatusEnum.PENDING,
                CV: cvData,
                jobDescription: jobDesc,
                evaluator: userId
            });
            await cvResult.save();

            this.queue.add(() => this.evaluateCv(
                cvData,
                cvResult,
                jobDesc
            ));

            return cvResult;
        } catch (err) {
            if (err?.message.includes("duplicate key error")) throw new BadRequestException("CV already analyzed");

            throw err;
        }
    }

    private async evaluateCv(
        cvData: CV,
        cvResult: CVResult,
        jobDesc: JobDescription
    ) {
        try {
            await this.cvResultModel.findByIdAndUpdate(
                cvResult._id,
                {
                    status: CVStatusEnum.PROCESSING,
                    updated_at: new Date()
                }
            ).exec();

            const [cv, project] = await Promise.all([
                this.storageService.getCv(cvData),
                this.storageService.getProject(cvData)
            ]);

            if (!cv) return this.logger.error("CV file not found");
            if (!project) return this.logger.error("Project file not found");

            const [extractedCv, extractedProject] = await Promise.all([
                this.extractorService.extract({
                    base64File: cv.toString("base64"),
                    mimeType: cvData.cv_mimetype
                }),
                this.extractorService.extract({
                    base64File: project.toString("base64"),
                    mimeType: cvData.project_mimetype
                }),
            ]);

            const [llmResult, vector_id, cvDetails] = await Promise.all([
                this.llmExtraction(
                    jobDesc,
                    extractedCv,
                    extractedProject
                ),
                this.saveCvToChroma(
                    cvResult,
                    extractedCv,
                    extractedProject
                ),
                this.saveCvDetail(
                    cvResult,
                    extractedCv,
                    extractedProject
                )
            ]);

            await this.cvResultModel.findByIdAndUpdate(
                cvResult._id,
                {
                    vector_id,
                    ...llmResult,
                    updated_at: new Date()
                }
            ).exec();

            return await this.cvResultModel.findByIdAndUpdate(cvResult._id, {
                status: CVStatusEnum.COMPLETED,
                updated_at: new Date()
            });
        } catch (error) {
            this.logger.error(`Failed to evaluate CV ${cvData._id}`, error);
            await this.cvResultModel.findByIdAndUpdate(cvResult._id, {
                status: CVStatusEnum.FAILED,
                overall_summary: `Evaluation failed: ${error.message}`,
                updated_at: new Date()
            });
        }
    }

    private async saveCvToChroma(
        cvResult: CVResult,
        extractedCv: IExtractedDocument,
        extractedProject: IExtractedDocument
    ) {
        if (!cvResult._id
            || !extractedCv.fullText
            || !extractedProject.fullText
        ) throw new Error("Extracted data is not complete");

        const cv_id = `${cvResult._id}_cv`;
        const project_id = `${cvResult._id}_project`;

        const ids = [cv_id, project_id];
        const documents = [
            extractedCv.fullText,
            extractedProject.fullText
        ];
        const metadatas = [
            { cv_result_id: cvResult._id.toString(), doc_type: 'cv' },
            { cv_result_id: cvResult._id.toString(), doc_type: 'project' }
        ];

        const payload = {
            ids,
            documents,
            metadatas
        };
        const result = await this.collection.add(payload);

        return payload;
    }


    private async saveCvDetail(
        cvResult: CVResult,
        extractedCv: IExtractedDocument,
        extractedProject: IExtractedDocument
    ) {
        if (!cvResult._id
            || !extractedCv.pages?.length
            || !extractedProject.pages?.length
        ) throw new Error("Extracted data is not complete");

        const ids: string[] = [];
        const documents: string[] = [];
        const metadatas: Record<string, any>[] = [];
        const cvDetails: CVDetail[] = [];

        for (let i = 0; i < extractedCv.pages.length; i++) {
            const page = extractedCv.pages[i];
            const id = `${cvResult._id}_${page.pageNumber}_cv`;
            const pageText = page.texts.join("\n\n");
            const metadata = { cv_result_id: cvResult._id.toString(), doc_type: 'cv' };

            ids.push(id);
            documents.push(pageText);
            metadatas.push(metadata);

            const cvDetail = new this.cvDetailModel({
                page: page.pageNumber,
                base64_image: page.image,
                texts: page.texts,
                vector_id: id,
                CV: cvResult.CV._id
            });
            cvDetails.push(cvDetail);
        }

        for (let i = 0; i < extractedProject.pages.length; i++) {
            const page = extractedProject.pages[i];
            const id = `${cvResult._id}_${page.pageNumber}_project`;
            const pageText = page.texts.join("\n\n");
            const metadata = { cv_result_id: cvResult._id.toString(), doc_type: 'project' };

            ids.push(id);
            documents.push(pageText);
            metadatas.push(metadata);

            const cvDetail = new this.cvDetailModel({
                page: page.pageNumber,
                base64_image: page.image,
                texts: page.texts,
                vector_id: id,
                CV: cvResult.CV._id
            });
            cvDetails.push(cvDetail);
        }

        const payload = {
            ids,
            documents,
            metadatas
        };

        await Promise.all([
            this.collectionRag.add(payload),
            this.cvDetailModel.bulkSave(cvDetails)
        ]);

        return payload;
    }

    private async llmExtraction(
        jobDescription: JobDescription,
        extractedCv: IExtractedDocument,
        extractedProject: IExtractedDocument
    ) {
        const job_descriptions = jobDescriptionParser(jobDescription);
        const stringified_cv = extractedCv.fullText;
        const stringified_project = extractedProject.fullText;
        const cv_images = extractedCv.pages.reduce((prev: string[], page) => {
            if (page.image) prev.push(page.image);
            return prev;
        }, []);
        const project_images = extractedProject.pages.reduce((prev: string[], page) => {
            if (page.image) prev.push(page.image);
            return prev;
        }, []);

        const input = "extract candidates match rate";
        const history = [];

        const stateResult = await this.extractorAgent.chat({
            input,
            history,
            job_descriptions,
            stringified_cv,
            stringified_project,
            cv_images,
            project_images
        });

        return stateResult.output;
    }

    query(query: string) {
        if (!query) return [];

        return this.collection.query({
            queryTexts: [query],
            nResults: 10
        });
    }

    async getResultById(cvResultId: string) {
        return this.cvResultModel.findById(cvResultId).populate(["CV", "jobDescription"]).exec();
    }
}

