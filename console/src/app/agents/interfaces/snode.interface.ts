import { IAgent } from "./agent.interface";

export interface ISNode {
  name: string,
  parent?: ISNode,
  children?: [ISNode],
  agent?: string | IAgent
}
