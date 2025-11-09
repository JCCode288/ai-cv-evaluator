import { JobDescription } from "src/modules/database/mongodb/schemas/job-description.schema";

export function jobDescriptionParser(jobDescription: JobDescription) {
    const job_descriptions = `
### Descriptions
${jobDescription.description}
### Requirements
- ${jobDescription.requirements.map(req => `- ${req}`).join('\n')}
`;

    return job_descriptions;
}