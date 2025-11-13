import z from 'zod';

const TOOL_OUTPUT = z.array(z.object({
    type: z.string(),
    text: z.string().optional(),
    image_url: z.object({
        url: z.string()
    }).optional()
}));

export const GetCvResultsSchema = z.object({
    query: z
        .any()
        .describe(
            'Mongoose find query to retrieve CV results, by default it is limited to last 15. other than increase limit or manage sorting, use vector store to search more relevant information.',
        )
        .optional()
        .default({ sort: { created_at: -1 }, limit: 15 }),
});
export const GetCvResultOutput = TOOL_OUTPUT;

export const GetListJobDescSchema = z.object({
    query: z
        .any()
        .describe(
            'Mongoose find query to retrieve job descriptions, by default it is limited to last 15. other than increase limit or manage sorting, use vector store to search more relevant information.',
        )
        .optional()
        .default({ sort: { created_at: -1 }, limit: 15 }),
});
export const GetListJobDescOutput = TOOL_OUTPUT;

export const SearchCvVectorSchema = z.object({ query: z.string().describe("Query to use to search in CVs") });
export const SearchCvVectorOutput = TOOL_OUTPUT;

export const SearchCvEvalSchema = z.object({ query: z.string().describe("Query to use to search in Candidate Evaluations") });
export const SearchCvEvalOutput = TOOL_OUTPUT;

export const GetJobDescriptionSchema = z.object({ id: z.string().describe("ID of job description") });
export const GetJobDescriptionOutput = TOOL_OUTPUT;

export const GetCvDetailSchema = z.object({ id: z.string().describe("ID of CV Detail") });
export const GetCvDetailOutput = TOOL_OUTPUT;

export const GetCvEvalSchema = z.object({ id: z.string().describe("ID of CV Eval") });
export const GetCvEvalOutput = TOOL_OUTPUT;


export type IMessageContent = z.infer<typeof TOOL_OUTPUT>;
