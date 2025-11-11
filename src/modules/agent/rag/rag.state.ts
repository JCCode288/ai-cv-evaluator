import { z } from 'zod';

export const RagState = z.object({
  input: z.string(),

  history: z.array(z.object({
    type: z.enum(["ai", "human"]),
    content: z.string()
  })).default([]),

  messages: z.array(z.any()).default([]),

  context: z.array(z.string()).default([]),
  jobDescriptionId: z.string().optional(),

  agentResponse: z.any(),

  summary: z.string().default("No summary yet."),

  output: z.string().optional()
});

export type RagStateType = z.infer<typeof RagState>;