import { Module } from '@nestjs/common';
import { ChromaClient } from 'chromadb';

@Module({
  providers: [
    {
      provide: ChromaClient,
      useFactory: () => {
        return new ChromaClient({
          host: process.env.CHROMADB_HOST ?? 'localhost',
          port: +(process.env.CHROMADB_PORT ?? '8000'),
        });
      },
    },
  ],
  exports: [ChromaClient],
})
export class ChromaDbModule {
  constructor(private readonly chromaDb: ChromaClient) {}

  // async onModuleInit() {
  //   await Promise.all([
  //     this.chromaDb.deleteCollection({ name: process.env.CHROMA_COLLECTION_NAME ?? "cv_collection" }),
  //     this.chromaDb.deleteCollection({ name: process.env.CHROMA_RAG_COLLECTION_NAME ?? 'rag_collection' })
  //   ]);
  // }
}
