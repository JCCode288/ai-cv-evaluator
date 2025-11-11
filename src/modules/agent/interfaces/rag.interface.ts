import { AgentInput } from './agent.interface';

export interface RagInput extends AgentInput {
    update_id: number;
    chat_id: number;
    message_id: number;
    user?: string;
}
