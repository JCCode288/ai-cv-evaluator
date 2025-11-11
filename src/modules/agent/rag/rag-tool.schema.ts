import z from "zod";

export const GetCvResultsSchema = z.object({
    query: z.any().describe("Mongoose find query to retrieve CV results, by default it is limited to last 15").default({ sort: { created_at: -1 }, limit: 15 })
});

export const GetListJobDescSchema = z.object({
    query: z.any().describe("Mongoose find query to retrieve CV results, by default it is limited to last 15").default({ sort: { created_at: -1 }, limit: 15 })
});