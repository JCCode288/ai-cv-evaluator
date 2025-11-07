import { Module } from '@nestjs/common';
import { ChromaClient } from 'chromadb';

@Module({
  providers: [
    {
      provide: ChromaClient,
      useFactory: () => {
        return new ChromaClient({
          host: process.env.CHROMADB_HOST ?? "localhost",
          port: +(process.env.CHROMADB_PORT ?? "8000")
        });
      },
    },
  ],
  exports: [ChromaClient],
})
export class ChromaDbModule { }
