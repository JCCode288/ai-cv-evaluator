import { Module } from '@nestjs/common';
import { ExtractorService } from './extractor.service';
import { ChromaDbModule } from 'src/modules/database/chromadb/chromadb.module';

@Module({
  imports: [ChromaDbModule],
  providers: [ExtractorService],
  exports: [ExtractorService],
})
export class ExtractorModule {}
