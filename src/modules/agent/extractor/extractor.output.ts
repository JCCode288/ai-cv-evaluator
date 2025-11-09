import { z } from "zod";

export const EXTRACTOR_OUTPUT = z.object({
    cv_match_rate: z.float64().describe("A score from 0-1 representing how well the CV matches the job description."),
    cv_feedback: z.string().describe("candidate CV feedback"),

    project_score: z.float32().describe("A score from 0 to 10 for the candidate's project compatibility to the job description."),
    project_feedback: z.string().describe("candidate project feedback"),

    overall_score: z.float32().describe("A score from 0 to 10 for the candidate's project compatibility to the job description."),
    overall_summary: z.string().describe("candidate summary for the job based on CV and project")
});