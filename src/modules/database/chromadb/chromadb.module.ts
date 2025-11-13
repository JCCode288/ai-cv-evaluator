import { Module } from '@nestjs/common';
import { ChromaClient, CloudClient } from 'chromadb';

@Module({
  providers: [
    {
      provide: ChromaClient,
      useFactory: () => {
        const apiKey = process.env.CHROMADB_API_KEY;
        const tenant = process.env.CHROMADB_TENANT;
        const database = process.env.CHROMADB_DATABASE;

        if (apiKey && tenant && database) {
          return new CloudClient({
            apiKey,
            tenant,
            database
          });
        }

        return new ChromaClient({
          host: process.env.CHROMADB_HOST ?? 'localhost',
          port: +(process.env.CHROMADB_PORT ?? '8000'),
        });
      },
    },
  ],
  exports: [ChromaClient],
})
export class ChromaDbModule { }
