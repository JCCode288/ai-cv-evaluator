import { forwardRef, Inject, Module } from '@nestjs/common';
import { RagAgent } from './rag/rag.agent';
import { MongodbModule } from '../database/mongodb/mongodb.module';
import { ChromaDbModule } from '../database/chromadb/chromadb.module';
import { ExtractorAgent } from './extractor/extractor.agent';
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
  imports: [
    MongodbModule,
    ChromaDbModule,
    forwardRef(() => EvaluationModule)
  ],
  providers: [
    RagAgent,
    ExtractorAgent,
    {
      provide: GoogleGeminiEmbeddingFunction,
      useFactory: () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API Key is not set");

        return new GoogleGeminiEmbeddingFunction({
          apiKey
        })
      }
    },
    {
      provide: GoogleGenerativeAIEmbeddings,
      useFactory: () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API Key is not set");

        return new GoogleGenerativeAIEmbeddings({
          apiKey
        });
      }
    },
  ],
  exports: [RagAgent, ExtractorAgent, GoogleGeminiEmbeddingFunction]
})
export class AgentModule { }
