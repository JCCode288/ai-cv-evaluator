import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AgentStrategy } from '../interfaces/agent.strategy';
import { RagInput } from '../interfaces/rag.interface';
import { InjectModel } from '@nestjs/mongoose';
import { JobDescription } from 'src/modules/database/mongodb/schemas/job-description.schema';
import { Model } from 'mongoose';
import { CVResult } from 'src/modules/database/mongodb/schemas/cv-result.schema';
import {
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import {
    CompiledStateGraph,
    END,
    START,
    StateGraph,
    MemorySaver,
} from '@langchain/langgraph';
import { RagState, RagStateType } from './rag.state';
import {
    RAG_HUMAN_PROMPT,
    RAG_SYSTEM_PROMPT,
    SUMMARIZER_HUMAN_PROMPT,
    SUMMARIZER_SYSTEM_PROMPT,
} from './rag.prompts';
import {
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
} from '@langchain/core/messages';
import { Chat } from 'src/modules/database/mongodb/schemas/chat.schema';
import { GetCvResultsSchema, GetListJobDescSchema } from './rag-tool.schema';
import {
    getCvDetailParser,
    getCvResultParser,
    getCvResultsParser,
    getJobParser,
    getListJobParser,
    searchVectorStoreParser,
} from 'src/utils/tool.parser';
import { CVDetail } from 'src/modules/database/mongodb/schemas/cv-detail.schema';
import { StringOutputParser } from '@langchain/core/output_parsers';

@Injectable()
export class RagAgent implements AgentStrategy, OnModuleInit {
    private tools: (DynamicTool | DynamicStructuredTool)[];
    private toolMap: Map<string, DynamicTool | DynamicStructuredTool> =
        new Map();
    private graph: CompiledStateGraph<
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
    private readonly logger = new Logger(RagAgent.name);
    private cvCollection: Chroma;
    private evalCollection: Chroma;

    constructor(
        @InjectModel(JobDescription.name)
        private readonly jobDescriptionModel: Model<JobDescription>,
        @InjectModel(CVResult.name)
        private readonly cvResultModel: Model<CVResult>,
        @InjectModel(CVDetail.name)
        private readonly cvDetailModel: Model<CVDetail>,
        @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
        private readonly embedding: GoogleGenerativeAIEmbeddings,
    ) { }

    onModuleInit() {
        this.tools = this.createTools();

        const checkpointer = new MemorySaver();
        this.graph = new StateGraph(RagState)
            .addNode('agent', this.agentNode.bind(this))
            .addNode('tool', this.toolNode.bind(this))
            .addNode('summarizer', this.summaryNode.bind(this))
            .addEdge(START, 'agent')
            .addEdge('tool', 'agent')
            .addConditionalEdges('agent', this.shouldContinueNode.bind(this)) // yes -> tool, no -> summarizer
            .addEdge('summarizer', END)
            .compile({ checkpointer });

        this.cvCollection = this.initCvCollection();
        this.evalCollection = this.initEvalCollection();
    }

    async chat(input: RagInput): Promise<string> {
        try {
            const config = {
                configurable: { thread_id: input.chat_id },
                recursionLimit: 50,
            };
            const chat = new this.chatModel({
                chat_id: input.chat_id,
                update_id: input.update_id,
                message_id: input.message_id,
                content: input.input,
                type: 'human',
            });

            await chat.save();

            const result = await this.graph.invoke(
                {
                    input: input.input,
                    history: input.history,
                    chat_id: input.chat_id,
                    update_id: input.update_id,
                    message_id: input.message_id,
                },
                config,
            );

            let chatResponse = result.agentResponse?.content;
            if (typeof chatResponse !== 'string') {
                chatResponse = JSON.stringify(chatResponse);
            }

            const aiChat = new this.chatModel({
                chat_id: input.chat_id,
                update_id: input.update_id,
                message_id: input.message_id,
                content: chatResponse,
                type: 'ai',
            });
            await aiChat.save();

            return chatResponse;
        } catch (err) {
            this.logger.error('Agent failed to return:', err);

            return "There's something happened with the server right now. please wait for a moment :)";
        }
    }

    private async agentNode(state: RagStateType) {
        const history = state.history.map((hist) => {
            if (hist.type === 'ai')
                return new AIMessage({ content: hist.content });

            if (hist.type === 'human')
                return new HumanMessage({ content: hist.content });
        });

        const question = state.input;
        const summary = state.summary;
        state.agentResponse = null;

        const [systemPrompt, humanPrompt] = await Promise.all([
            RAG_SYSTEM_PROMPT.format({ today: new Date().toLocaleString() }),
            RAG_HUMAN_PROMPT.format({ question, summary }),
        ]);

        if (!state.messages?.length) {
            state.messages = [
                systemPrompt,
                ...history,
                humanPrompt,
            ];
        } else {
            state.messages.push(humanPrompt);
        }

        const agent = this.buildAgent();
        const response = await agent.invoke(state.messages);

        state.agentResponse = response;
        state.messages.push(response);

        return state;
    }

    private async toolNode(state: RagStateType) {
        const { agentResponse } = state;
        if (!agentResponse.tool_calls) {
            throw new Error('toolNode received state with no tool calls');
        }

        const toolMessages = await Promise.all(
            agentResponse.tool_calls.map(async (toolCall) => {
                const tool = this.toolMap.get(toolCall.name);

                if (!tool) {
                    this.logger.warn(
                        `=== Tool not found: ${toolCall.name} ===`,
                    );
                    return `Tool ${toolCall.name} not found`;
                }

                try {
                    const output = await tool.invoke(toolCall.args);
                    this.logger.log(
                        `=== Tool Call succeed: ${toolCall.name} ===`,
                        output
                    );

                    return new ToolMessage({
                        content: output,
                        tool_call_id: toolCall.id,
                    });
                } catch (error) {
                    const output = `Error executing tool ${toolCall.name}: ${error.message}`;
                    this.logger.error(output, error);

                    return new ToolMessage({
                        content:
                            typeof output === 'string'
                                ? output
                                : JSON.stringify(output),
                        tool_call_id: toolCall.id,
                    });
                }
            }),
        );

        state.messages = [...state.messages, ...toolMessages];
        return state;
    }

    private async summaryNode(state: RagStateType) {
        const parser = new StringOutputParser();
        const model = this.buildModel('gemini-2.5-flash', 0.5).pipe(parser);

        const history = state.messages.filter((msg) => !(msg instanceof SystemMessage));
        const summary = state.summary;

        const systemMessage = await SUMMARIZER_SYSTEM_PROMPT.format({});
        const humanMessage = await SUMMARIZER_HUMAN_PROMPT.format({ summary });

        const messages: BaseMessage[] = [
            systemMessage,
            ...history,
            humanMessage,
        ];
        const result = await model.invoke(messages);
        state.summary = result ?? 'No summary yet.';

        return state;
    }

    private async shouldContinueNode(state: RagStateType) {
        const agentResponse = state.agentResponse;

        if (agentResponse.tool_calls && agentResponse.tool_calls.length > 0) {
            return 'tool';
        }

        return 'summarizer';
    }

    private buildAgent(model = this.buildModel('gemini-2.5-pro', 0.2)) {
        const modelTool = model.bindTools(this.tools);
        return modelTool;
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
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
            ],
            ...configs,
        });
    }

    private createTools() {
        const searchCvVectorStore = new DynamicTool({
            name: 'search_cv_vector_store',
            description:
                'Searches the vector store for relevant information about candidates CVs and projects only based on a query string.',
            func: async (input: string) => {
                this.logger.log(`=== searching CV vector with input: ${input} ===`);
                try {
                    const results = await this.cvCollection.similaritySearch(
                        input,
                        5,
                    );
                    return searchVectorStoreParser(results);
                } catch (err) {
                    return err;
                }
            },
        });
        this.toolMap.set(searchCvVectorStore.name, searchCvVectorStore);

        const searchEvalVectorStore = new DynamicTool({
            name: 'search_evaluation_vector_store',
            description:
                'Searches the vector store for relevant information about candidates CV evaluations on a query string.',
            func: async (input: string) => {
                this.logger.log(`=== searching evaluation vector with input: ${input} ===`);
                try {
                    const results = await this.cvCollection.similaritySearch(
                        input,
                        5,
                    );
                    return searchVectorStoreParser(results);
                } catch (err) {
                    return err;
                }
            },
        });
        this.toolMap.set(searchEvalVectorStore.name, searchEvalVectorStore);

        const getListJobDescriptions = new DynamicStructuredTool({
            name: 'get_job_listing',
            description:
                'Retrieves a list of available job descriptions, including their titles and brief descriptions.',
            schema: GetListJobDescSchema,
            func: async (input) => {
                this.logger.log(`=== getting job listing with input: ${JSON.stringify(input)} ===`);
                try {
                    const fields = {
                        title: 1,
                        description: 1,
                    };

                    const jobs = await this.jobDescriptionModel
                        .find(input.query, fields)
                        .exec();

                    return getListJobParser(jobs);
                } catch (err) {
                    this.logger.error('Failed to getting list job', err);
                    return `Error getting job listing: ${err.message}`;
                }
            },
        });
        this.toolMap.set(getListJobDescriptions.name, getListJobDescriptions);

        const getJobDescription = new DynamicTool({
            name: 'get_job_description_by_id',
            description: 'Retrieves a specific job description by its ID.',
            func: async (id: string) => {
                this.logger.log(`=== getting job detail with ID: ${id} ===`);
                try {
                    const job = await this.jobDescriptionModel
                        .findById(id)
                        .exec();

                    if (!job) return 'Job description not found.';

                    return getJobParser(job);
                } catch (err) {
                    this.logger.error('Failed to getting job desc: ', err);
                    return `Error getting job description: ${err.message}`;
                }
            },
        });
        this.toolMap.set(getJobDescription.name, getJobDescription);

        const getCvResults = new DynamicStructuredTool({
            name: 'get_cv_result_list',
            description:
                'Retrieves a list of CV evaluation summaries, including their status, match rates, and overall scores.',
            schema: GetCvResultsSchema,
            func: async (input) => {
                this.logger.log(`=== getting cv result list with input:  ${JSON.stringify(input)} ===`);
                try {
                    const fields = {
                        status: 1,
                        CV: 1,
                        created_at: 1,
                        updated_at: 1,
                    };
                    const cvFields = {
                        cv_filename: 1,
                        project_filename: 1,
                    };
                    const results = await this.cvResultModel
                        .find(input.query, fields)
                        .populate({
                            path: 'CV',
                            options: { fields: cvFields },
                        });

                    return getCvResultsParser(results);
                } catch (err) {
                    this.logger.error(
                        '=== Failed to retrieve cv result list ===',
                    );
                    return `Error getting CV result list: ${err.message}`;
                }
            },
        });
        this.toolMap.set(getCvResults.name, getCvResults);

        const getCvResult = new DynamicTool({
            name: 'get_cv_result_by_id',
            description:
                'Retrieves a comprehensive CV evaluation report for a specific CV result ID, including detailed feedback and scores.',
            func: async (id: string) => {
                this.logger.log(`=== getting CV result with ID: ${id} ===`);
                try {
                    const result = await this.cvResultModel
                        .findById(id)
                        .populate(['CV', 'jobDescription'])
                        .exec();

                    return getCvResultParser(result as any);
                } catch (err) {
                    this.logger.error('Failed to getting cv result: ', err);
                    return `Error getting CV result: ${err.message}`;
                }
            },
        });
        this.toolMap.set(getCvResult.name, getCvResult);

        const getCvDetail = new DynamicTool({
            name: 'get_cv_detail',
            description: `Retrieves specific image pages or sections of a CV document, identified by a cv_detail_id, typically used for visual inspection of CV content.`,
            func: async (cvDetailId: string) => {
                this.logger.log(`=== getting CV detail with ID: ${cvDetailId} ===`);
                try {
                    const result =
                        await this.cvDetailModel.findById(cvDetailId);

                    return getCvDetailParser(result as any);
                } catch (err) {
                    this.logger.error('Failed to getting cv detail: ', err);
                    return `Error getting CV result: ${err.message}`;
                }
            },
        });
        this.toolMap.set(getCvDetail.name, getCvDetail);

        return [
            searchCvVectorStore,
            getListJobDescriptions,
            getJobDescription,
            getCvResults,
            getCvResult,
            getCvDetail,
        ];
    }

    private initCvCollection() {
        const host = process.env.CHROMADB_HOST;
        const port = process.env.CHROMADB_PORT;
        const collectionName =
            process.env.CHROMA_RAG_COLLECTION_NAME ?? 'rag_collection';

        let url = process.env.CHROMA_URI;
        if (url)
            return new Chroma(this.embedding, {
                collectionName,
                url,
            });

        if (!host || !port) throw new Error('Chroma DB Env is not set');

        url = `http://${host}:${port}`;
        return new Chroma(this.embedding, {
            collectionName,
            url,
        });
    }

    private initEvalCollection() {
        const host = process.env.CHROMADB_HOST;
        const port = process.env.CHROMADB_PORT;
        const collectionName =
            process.env.CHROMA_RAG_COLLECTION_NAME ?? 'rag_collection';

        let url = process.env.CHROMA_URI;
        if (url)
            return new Chroma(this.embedding, {
                collectionName,
                url,
            });

        if (!host || !port) throw new Error('Chroma DB Env is not set');

        url = `http://${host}:${port}`;
        return new Chroma(this.embedding, {
            collectionName,
            url,
        });
    }
}
