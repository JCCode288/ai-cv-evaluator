export interface ChatHistory {
    type: 'ai' | 'human' | 'system';
    content: string;
}

export interface AgentInput {
    input: string;
    history: ChatHistory[];
}
