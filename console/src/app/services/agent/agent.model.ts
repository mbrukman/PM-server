import { IAgent } from '@agents/interfaces/agent.interface';

export class Agent implements IAgent {
  _id?: string;
  id: string;
  name?: string;
  url: string;
  publicUrl: string;
  key?: string;
  sshKey?: string;
  attributes: string[];
}
