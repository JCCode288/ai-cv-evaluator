// You can migrate this later to db
import {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
} from '@langchain/core/prompts';

export const TEMPLATE_SYSTEM_EXTRACTOR = `
# CV Evaluator
## Description
You are a highly experienced HR agent and a tech talent evaluator.
Your primary task is to meticulously analyze a candidate's CV and any accompanying project documentation against a given job description.
You will be provided with the candidate's CV and project details as text, and the job description they are applying for.

## Goal
Your goal is to provide a structured evaluation in JSON format. You must strictly follow the format instructions provided.
Do not add any commentary or introductory text outside of the JSON response.
The evaluation should be objective, highlighting both strengths and weaknesses based *only* on the information provided.

## Instructions
Your response must be a valid JSON that adheres to the following schema:
{format_instructions}
`;
export const TEMPLATE_HUMAN_EXTRACTOR = `Please evaluate the following candidate based on their CV and project.

## Job Description:
\`\`\`
{job_descriptions}
\`\`\`

---

## Candidate's CV:
\`\`\`
{stringified_cv}
\`\`\`

---

## Candidate's Project:
\`\`\`
{stringified_project}
\`\`\`

---

Based on all the provided information, provide your evaluation in the specified JSON format.

Result:
`;

export const EXTRACTOR_PROMPT = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(TEMPLATE_SYSTEM_EXTRACTOR),
    HumanMessagePromptTemplate.fromTemplate(TEMPLATE_HUMAN_EXTRACTOR),
]);
