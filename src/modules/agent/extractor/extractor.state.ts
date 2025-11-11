import { z } from 'zod';
import { EXTRACTOR_OUTPUT } from './extractor.output';

export const ExtractorState = z.object({
  job_descriptions: z.string(),
  stringified_cv: z.string(),
  stringified_project: z.string(),
  output: EXTRACTOR_OUTPUT.optional(),
});
