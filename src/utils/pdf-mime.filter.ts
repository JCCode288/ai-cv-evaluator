import { BadRequestException } from '@nestjs/common';

const acceptedMimeTypes = ['application/pdf'];

export const pdfFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: Function,
) => {
    const isValid = acceptedMimeTypes.includes(file.mimetype);
    if (isValid) return cb(null, isValid);

    return cb(new BadRequestException('Invalid file type'), false);
};
