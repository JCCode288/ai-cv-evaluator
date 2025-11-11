import z from 'zod';

export const GetCvResultsSchema = z.object({
    query: z
        .any()
        .describe(
            'Mongoose find query to retrieve CV results, by default it is limited to last 15. other than increase limit or manage sorting, use vector store to search more relevant information.',
        )
        .default({ sort: { created_at: -1 }, limit: 15 }),
});

export const GetListJobDescSchema = z.object({
    query: z
        .any()
        .describe(
            'Mongoose find query to retrieve CV results, by default it is limited to last 15. other than increase limit or manage sorting, use vector store to search more relevant information.',
        )
        .default({ sort: { created_at: -1 }, limit: 15 }),
});
