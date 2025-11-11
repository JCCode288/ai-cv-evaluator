import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobDescription } from '../database/mongodb/schemas/job-description.schema';
import { CreateJobDescriptionDto } from './dto/create-job-description.dto';
import { UpdateJobDescriptionDto } from './dto/update-job-description.dto';

@Injectable()
export class JobDescriptionService {
  constructor(
    @InjectModel(JobDescription.name)
    private readonly jobDescriptionModel: Model<JobDescription>,
  ) {}

  async create(
    createJobDescriptionDto: CreateJobDescriptionDto,
  ): Promise<JobDescription> {
    const createdJobDescription = new this.jobDescriptionModel(
      createJobDescriptionDto,
    );
    return createdJobDescription.save();
  }

  async findAll(): Promise<JobDescription[]> {
    return this.jobDescriptionModel.find().exec();
  }

  async findOne(id: string): Promise<JobDescription | null> {
    return this.jobDescriptionModel.findById(id).exec();
  }

  async update(
    id: string,
    updateJobDescriptionDto: UpdateJobDescriptionDto,
  ): Promise<JobDescription | null> {
    return this.jobDescriptionModel
      .findByIdAndUpdate(id, updateJobDescriptionDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<JobDescription | null> {
    return this.jobDescriptionModel.findByIdAndDelete(id).exec();
  }
}
