import { IAgent } from '@agents/interfaces/agent.interface';
import { Group } from '@agents/models';

export interface IMap {
  _id?: string,
  id?: string,
  name: string,
  description?: string,
  createdAt?: Date,
  updatedAt?: Date,
  archived: boolean,
  agents?: IAgent[],
  groups?: Group[],
  queue?: number
}
