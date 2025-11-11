import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { CV } from 'src/modules/database/mongodb/schemas/cv.schema';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly storage: Storage;
    private readonly bucketName =
        process.env.GOOGLE_BUCKET_NAME ?? 'ai-cv-evaluator';

    constructor() {
        this.storage = new Storage({
            keyFilename: process.env.GOOGLE_SA_PATH,
        });
    }

    getStorage() {
        return this.storage;
    }

    async saveCv(cv: Express.Multer.File, cvData: CV) {
        const bucket = this.storage.bucket(this.bucketName);
        const path = this.getCvFileFormat(cvData._id, cv.originalname);
        const byteData = cv.buffer;

        return bucket.file(path).save(byteData, { private: true });
    }

    async saveProject(project: Express.Multer.File, cvData: CV) {
        const bucket = this.storage.bucket(this.bucketName);
        const path = this.getProjectFileFormat(
            cvData._id,
            project.originalname,
        );
        const byteData = project.buffer;

        return bucket.file(path).save(byteData, { private: true });
    }

    async getCv(cvData: CV): Promise<Buffer> {
        const bucket = this.storage.bucket(this.bucketName);
        const path = this.getCvFileFormat(cvData._id, cvData.cv_filename);
        const file = bucket.file(path);

        const [content] = await file.download();
        return content;
    }

    async getProject(cvData: CV): Promise<Buffer> {
        const bucket = this.storage.bucket(this.bucketName);
        const path = this.getProjectFileFormat(
            cvData._id,
            cvData.project_filename,
        );
        const file = bucket.file(path);

        const [content] = await file.download();
        return content;
    }

    async createBucket() {
        try {
            const bucket = this.storage.bucket(this.bucketName);
            const isExists = await bucket.exists();
            if (isExists) return bucket;

            const createRes = await this.storage.createBucket(this.bucketName);
            this.logger.log('Success creating bucket: ', createRes);

            return bucket;
        } catch (err) {
            this.logger.error('Failed to create bucket:', err);

            throw err;
        }
    }

    /**
     *
     * @param id Object id of created cv data in mongodb
     * @param name file original name
     * @returns formatted filepath for cv
     */
    getCvFileFormat(id: any, name: string) {
        return `cv/${id}/${name}_cv`;
    }
    /**
     * @description this to prevents overwriting cv to project if user also upload cv or same filename for project. however ai will receive duplicated embedded chunks if file is same. but reducing cognitive load on user when candidates only give cv for recruitment
     * @param id Object id of created cv data in mongodb
     * @param name file original name
     * @returns formatted filepath for project
     */
    getProjectFileFormat(id: any, name: string) {
        return `cv/${id}/${name}_project`;
    }
}
