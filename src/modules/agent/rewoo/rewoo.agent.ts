import { Injectable } from "@nestjs/common";
import { AgentStrategy } from "../interfaces/agent.interface";
import { RewooInput, RewooOutput } from "../interfaces/rewoo.interface";

@Injectable()
/**
 * @description -- Plan and Execute agent
 */
export class RewooAgent implements AgentStrategy {
    chat(input: RewooInput): RewooOutput {
        return {};
    }
}