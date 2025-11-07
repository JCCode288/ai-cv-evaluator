import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { JobDescriptionService } from './job-description.service';
import { CreateJobDescriptionDto } from './dto/create-job-description.dto';
import { UpdateJobDescriptionDto } from './dto/update-job-description.dto';

@Controller('job-description')
export class JobDescriptionController {
  constructor(private readonly jobDescriptionService: JobDescriptionService) { }

  @Post()
  create(@Body() createJobDescriptionDto: CreateJobDescriptionDto) {
    return this.jobDescriptionService.create(createJobDescriptionDto);
  }

  @Get()
  findAll(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10
  ) {
    return this.jobDescriptionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    if (!id) throw new BadRequestException("Invalid ID");

    return this.jobDescriptionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobDescriptionDto: UpdateJobDescriptionDto) {
    if (!id) throw new BadRequestException("Invalid ID");

    return this.jobDescriptionService.update(id, updateJobDescriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobDescriptionService.remove(id);
  }
}

