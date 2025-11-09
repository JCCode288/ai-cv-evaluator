import { Module } from '@nestjs/common';
import { RagAgent } from './rag/rag.agent';
import { MongodbModule } from '../database/mongodb/mongodb.module';
import { ChromaDbModule } from '../database/chromadb/chromadb.module';
import { ExtractorAgent } from './extractor/extractor.agent';
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";

@Module({
  imports: [MongodbModule, ChromaDbModule],
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
    }
  ],
  exports: [RagAgent, ExtractorAgent, GoogleGeminiEmbeddingFunction]
})
export class AgentModule { }
