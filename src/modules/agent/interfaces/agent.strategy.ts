import { AgentInput } from './agent.interface';

export interface AgentStrategy {
    chat(input: AgentInput): any;
}
