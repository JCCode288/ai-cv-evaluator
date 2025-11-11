import { AgentInput } from './agent.interface';

export interface ExtractorInput extends AgentInput {
    job_descriptions: string;
    stringified_cv: string;
    stringified_project: string;
    cv_images: string[];
    project_images: string[];
}
