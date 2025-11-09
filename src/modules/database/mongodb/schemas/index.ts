import { Chat, ChatSchema } from "./chat.schema";
import { CVDetail, CVDetailSchema } from "./cv-detail.schema";
import { CVResult, CVResultSchema } from "./cv-result.schema";
import { CV, CVSchema } from "./cv.schema";
import { JobDescription, JobDescriptionSchema } from "./job-description.schema";
import { User, UserSchema } from "./user.schema";

export const SCHEMAS = [
    { name: User.name, schema: UserSchema },
    { name: Chat.name, schema: ChatSchema },
    { name: CV.name, schema: CVSchema },
    { name: CVDetail.name, schema: CVDetailSchema },
    { name: CVResult.name, schema: CVResultSchema },
    { name: JobDescription.name, schema: JobDescriptionSchema }
];

export * from './user.schema';