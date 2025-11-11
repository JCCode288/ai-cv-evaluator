import { Module, OnModuleInit } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule implements OnModuleInit {
  constructor(private readonly storageService: StorageService) {}

  async onModuleInit() {
    await this.storageService.createBucket();
  }
}
