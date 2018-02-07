import { IAgent } from "../interfaces/agent.interface";

export class Agent implements IAgent {
  _id?: string;
  id: string;
  name?: string;
  url: string;
  publicUrl: string;
  key: string;
  sshKey?: string;
  attributes: any[] | string;
}
