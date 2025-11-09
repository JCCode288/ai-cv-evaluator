export interface ChatHistory {
    role: 'ai' | 'human';
    content: string;
}

export interface AgentInput {
    input: string;
    history: ChatHistory[];
}
