import { Injectable, Logger } from '@nestjs/common';
import {
    DocumentProcessorServiceClient,
    protos,
} from '@google-cloud/documentai';
import { IExtractedDocument, IExtractedPage, IExtractParam } from './interfaces/extractor.interfaces';
import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class ExtractorService {
    private readonly logger = new Logger(ExtractorService.name);
    private processor: DocumentProcessorServiceClient;
    private readonly processorId: string;
    private readonly location: string;
    private readonly projectId: string;
    private readonly version: string;
    private readonly embeddingModel: GenerativeModel;

    constructor() {
        const projectId = process.env.GOOGLE_OCR_PROJECT_ID;
        const location = process.env.GOOGLE_OCR_LOCATION;
        const version = process.env.GOOGLE_OCR_VERSION;
        const processorId = process.env.GOOGLE_OCR_PROCESSOR_ID;

        if (
            !projectId
            || !location
            || !version
            || !processorId
        ) throw new Error("Env for google ocr is not set");

        this.projectId = projectId;
        this.location = location;
        this.version = version;
        this.processorId = processorId;

        const processor = new DocumentProcessorServiceClient({
            keyFilename: process.env.GOOGLE_SA_PATH
        });
        this.processor = processor;
    }

    async extract(doc: IExtractParam): Promise<IExtractedDocument> {
        try {
            this.logger.log('=== Start Processing Document ===');
            const request = this.buildRequest(doc);

            const [result] = await this.processor.processDocument(request);

            const parsedResult = await this.parseResult(result);
            this.logger.log('=== Document has been extracted ===');

            return parsedResult;
        } catch (err) {
            this.logger.error('Failed to extract document:', err);
            throw err;
        }
    }

    private async parseResult(
        result: protos.google.cloud.documentai.v1.IProcessResponse,
    ): Promise<IExtractedDocument> {
        const { document } = result;

        if (!document || !document.text) {
            throw new Error("Failed to parse result becuase no document found");
        }

        const extractedPages: IExtractedPage[] = [];

        if (document.pages) {
            for (let i = 0; i < document.pages.length; i++) {
                const page = document.pages?.[i];
                if (!page) continue;

                const image = page.image?.content ? Buffer.from(page.image.content).toString("base64") : null;

                const texts: string[] = [];
                if (page.layout?.textAnchor?.textSegments) {
                    for (let seg of page.layout?.textAnchor?.textSegments) {
                        const start = +(seg.startIndex ?? "0");
                        const end = seg.endIndex ? +seg.endIndex : 0;

                        const text = document.text?.substring(start, end);
                        if (!text) continue;

                        texts.push(text);
                    };
                }

                extractedPages.push({
                    pageNumber: page.pageNumber ?? i + 1,
                    texts,
                    image,
                });
            }
        }

        return {
            fullText: document.text,
            pages: extractedPages,
        };
    }

    private buildRequest(
        doc: IExtractParam,
    ): protos.google.cloud.documentai.v1.IProcessRequest {
        return {
            name: this.processorName,
            rawDocument: {
                mimeType: doc.mimeType,
                content: doc.base64File,
            },
        };
    }

    get processorName() {
        return `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`
    }
}
