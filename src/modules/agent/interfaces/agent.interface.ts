export interface AgentOutput {

}

export interface AgentInput {

}

export interface AgentStrategy {
    chat(input: AgentInput): AgentOutput;
}