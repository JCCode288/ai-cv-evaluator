import { Injectable } from "@nestjs/common";
import { AgentStrategy } from "../interfaces/agent.interface";
import { RagInput, RagOutput } from "../interfaces/rag.interface";

@Injectable()
export class RagAgent implements AgentStrategy {
    chat(input: RagInput): RagOutput {
        return {};
    }
}