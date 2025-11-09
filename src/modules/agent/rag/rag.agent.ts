import { Injectable } from "@nestjs/common";
import { AgentStrategy } from "../interfaces/agent.strategy";
import { RagInput } from "../interfaces/rag.interface";

@Injectable()
export class RagAgent implements AgentStrategy {
    private readonly graph;
    chat(input: RagInput) {
        return {};
    }

    init() {

    }
}