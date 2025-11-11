import { Injectable } from '@nestjs/common';
import {
  StateGraph,
  START,
  END,
  type CompiledStateGraph,
} from '@langchain/langgraph';
import { AgentStrategy } from '../interfaces/agent.strategy';
import { ExtractorInput } from '../interfaces/extractor.interface';
import { ExtractorState } from './extractor.state';
import { EXTRACTOR_PROMPT } from './extractor.prompts';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { EXTRACTOR_OUTPUT } from './extractor.output';
import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';

@Injectable()
export class ExtractorAgent implements AgentStrategy {
  private readonly state = ExtractorState;
  private readonly graph: CompiledStateGraph<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >;

  private readonly nodeNames = {
    EXTRACT: 'extract',
    START,
    END,
  };
  private readonly prompts = {
    EXTRACT: EXTRACTOR_PROMPT,
  };

  constructor() {
    this.graph = new StateGraph(this.state)
      .addNode(this.nodeNames.EXTRACT, this.extractCv.bind(this))
      .addEdge(START, this.nodeNames.EXTRACT)
      .addEdge(this.nodeNames.EXTRACT, this.nodeNames.END)
      .compile();
  }

  async chat(input: ExtractorInput): Promise<any> {
    const result = await this.graph.invoke(input);
    return result;
  }

  private async extractCv(
    state: z.infer<typeof ExtractorState>,
  ): Promise<Partial<z.infer<typeof ExtractorState>>> {
    const chain = await this.buildExtractorChain();

    const response: any = await chain.invoke({
      job_descriptions: state.job_descriptions,
      stringified_cv: state.stringified_cv,
      stringified_project: state.stringified_project,
    });

    return { output: response };
  }

  private async buildExtractorChain() {
    const parser = StructuredOutputParser.fromZodSchema(EXTRACTOR_OUTPUT);
    const promptWithInstructions = await this.prompts.EXTRACT.partial({
      format_instructions: parser.getFormatInstructions(),
    });

    const model = this.buildModel('gemini-2.5-pro', 0.2);
    const chain = promptWithInstructions.pipe(model).pipe(parser);

    return chain;
  }

  private buildModel(
    modelName = 'gemini-2.5-flash',
    temperature = 0,
    configs = {},
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini Api Key is not set');

    return new ChatGoogleGenerativeAI({
      apiKey,
      model: modelName,
      temperature,
      ...configs,
    });
  }
}
