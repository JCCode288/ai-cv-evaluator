import { Module } from '@nestjs/common';
import { ExtractorService } from './extractor.service';

@Module({
  providers: [ExtractorService]
})
export class ExtractorModule {}
