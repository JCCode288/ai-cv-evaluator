import { forwardRef, Module } from '@nestjs/common';
import { RagAgent } from './rag/rag.agent';
import { MongodbModule } from '../database/mongodb/mongodb.module';
import { ChromaDbModule } from '../database/chromadb/chromadb.module';
import { ExtractorAgent } from './extractor/extractor.agent';
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
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
    {
      provide: Chroma,
      inject: [GoogleGenerativeAIEmbeddings],
      useFactory: (embedding: GoogleGenerativeAIEmbeddings) => {
        const host = process.env.CHROMADB_HOST;
        const port = process.env.CHROMADB_PORT;
        const collectionName = process.env.CHROMA_RAG_COLLECTION_NAME ?? 'rag_collection';

        const apiKey = process.env.CHROMADB_API_KEY;

        if (apiKey)
          return new Chroma(embedding, {
            collectionName,
          });

        if (!host || !port) throw new Error("Chroma DB Env is not set");

        const url = `http://${host}:${port}`;
        return new Chroma(embedding, {
          collectionName,
          url,
        })
      }
    }
  ],
  exports: [RagAgent, ExtractorAgent, GoogleGeminiEmbeddingFunction]
})
export class AgentModule { }
